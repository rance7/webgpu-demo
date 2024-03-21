import { Mat4, Vec3, Vec4, mat4, vec3 } from 'wgpu-matrix';
import Controller, { InputHandler } from './controller';

// Returns `x` clamped between [`min` .. `max`]
function clamp(x: number, min: number, max: number): number {
    return Math.min(Math.max(x, min), max);
}

// Returns `x` float-modulo `div`
function mod(x: number, div: number): number {
    return x - (Math.floor(Math.abs(x) / div) * div * Math.sign(x));
}

// Returns `vec` rotated `angle` radians around `axis`
function rotate(vec: Vec3, axis: Vec3, angle: number): Vec3 {
    return vec3.transformMat4Upper3x3(vec, mat4.rotation(axis, angle));
}

// Returns the linear interpolation between 'a' and 'b' using 's'
function lerp(a: Vec3, b: Vec3, s: number): Vec3 {
    return vec3.addScaled(a, vec3.sub(b, a), s);
}

export interface Camera {

    // inverse of the view matrix
    matrix: Mat4;

    // alias to column vector 0 of the camera matrix
    right: Vec4;

    // alias to column vector 1 of the camera matrix
    up: Vec4;

    // alias to column vector 2 of the camera matrix
    back: Vec4;

    // alias to column vector 3 of the camera matrix
    position: Vec4;

    update(delta_time: number, input: Controller): Mat4;
}

export class CameraBase {

    private readonly matrix_: Float32Array = new Float32Array([
        1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
    ]);

    // The calculated view matrix
    private readonly view_: Mat4 = mat4.create();

    // Aliases to column vectors of the matrix
    private readonly right_: Float32Array = new Float32Array(this.matrix_.buffer, 4 * 0, 4);

    private readonly up_: Float32Array = new Float32Array(this.matrix_.buffer, 4 * 4, 4);

    private readonly back_: Float32Array = new Float32Array(this.matrix_.buffer, 4 * 8, 4);

    private readonly position_: Float32Array = new Float32Array(this.matrix_.buffer, 4 * 12, 4);

    public get matrix(): Float32Array {
        return this.matrix_;
    }

    public set matrix(mat: Mat4) {
        mat4.copy(mat, this.matrix_);
    }

    public get view(): Mat4 {
        return this.view_;
    }

    public set view(mat: Mat4) {
        mat4.copy(mat, this.view_);
    }

    public get right(): Float32Array {
        return this.right_;
    }

    public set right(vec: Vec3) {
        vec3.copy(vec, this.right_);
    }

    public get up(): Float32Array {
        return this.up_;
    }

    public set up(vec: Vec3) {
        vec3.copy(vec, this.up_);
    }

    public get back(): Float32Array {
        return this.back_;
    }

    public set back(vec: Vec3) {
        vec3.copy(vec, this.back_);
    }

    public get position(): Float32Array {
        return this.position_;
    }

    public set position(vec: Vec3) {
        vec3.copy(vec, this.position_);
    }

}

export class WASDCamera extends CameraBase implements Camera {

    public pitch: number = 0;

    public yaw: number = 0;

    public readonly velocity_ = vec3.create();

    public movementSpeed = 10;

    public rotationSpeed = 1;

    /*
     * Movement velocity drag coeffient [0 .. 1]
     * 0: Continues forever
     * 1: Instantly stops moving
     */
    public frictionCoefficient = 0.99;

    public constructor(options?: {

        // The initial position of the camera
        position?: Vec3;

        // The initial target of the camera
        target?: Vec3;
    }) {
        super();
        if (options && (options.position || options.target)) {
            const position = options.position ?? vec3.create(0, 0, -5);
            const target = options.target ?? vec3.create(0, 0, 0);
            const forward = vec3.normalize(vec3.sub(target, position));
            this.recalculateAngles(forward);
            this.position = position;
        }
    }

    public get velocity(): Vec3 {
        return this.velocity_;
    }

    public set velocity(vec: Vec3) {
        vec3.copy(vec, this.velocity_);
    }

    public get matrix(): Float32Array {
        return super.matrix;
    }

    public set matrix(mat: Mat4) {
        super.matrix = mat;
        this.recalculateAngles(this.back);
    }

    public update(deltaTime: number, input: Controller): Mat4 {
        const sign = (positive: boolean, negative: boolean): number => (positive ? 1 : 0) - (negative ? 1 : 0);

        // Apply the delta rotation to the pitch and yaw angles
        this.yaw -= input.analog.x * deltaTime * this.rotationSpeed;
        this.pitch -= input.analog.y * deltaTime * this.rotationSpeed;

        // Wrap yaw between [0° .. 360°], just to prevent large accumulation.
        this.yaw = mod(this.yaw, Math.PI * 2);

        // Clamp pitch between [-90° .. +90°] to prevent somersaults.
        this.pitch = clamp(this.pitch, -Math.PI / 2, Math.PI / 2);

        // Save the current position, as we're about to rebuild the camera matrix.
        const position = vec3.copy(this.position);

        // Reconstruct the camera's rotation, and store into the camera matrix.
        super.matrix = mat4.rotateX(mat4.rotationY(this.yaw), this.pitch);

        // Calculate the new target velocity
        const digital = input.digital;
        const deltaRight = sign(digital.right, digital.left);
        const deltaUp = sign(digital.up, digital.down);
        const targetVelocity = vec3.create();
        const deltaBack = sign(digital.backward, digital.forward);
        vec3.addScaled(targetVelocity, this.right, deltaRight, targetVelocity);
        vec3.addScaled(targetVelocity, this.up, deltaUp, targetVelocity);
        vec3.addScaled(targetVelocity, this.back, deltaBack, targetVelocity);
        vec3.normalize(targetVelocity, targetVelocity);
        vec3.mulScalar(targetVelocity, this.movementSpeed, targetVelocity);

        // Mix new target velocity
        this.velocity = lerp(
            targetVelocity,
            this.velocity,
            (1 - this.frictionCoefficient) ** deltaTime,
        );

        // Integrate velocity to calculate new position
        this.position = vec3.addScaled(position, this.velocity, deltaTime);

        // Invert the camera matrix to build the view matrix
        this.view = mat4.invert(this.matrix);
        return this.view;
    }

    public recalculateAngles(dir: Vec3): void {
        this.yaw = Math.atan2(dir[0], dir[2]);
        this.pitch = -Math.asin(dir[1]);
    }

}

export class ArcballCamera extends CameraBase implements Camera {

    // The camera distance from the target
    private distance = 0;

    // The current angular velocity
    private angularVelocity = 0;

    // The current rotation axis
    private readonly axis_ = vec3.create();

    // Returns the rotation axis
    public get axis(): Vec3 {
        return this.axis_;
    }

    // Assigns `vec` to the rotation axis
    public set axis(vec: Vec3) {
        vec3.copy(vec, this.axis_);
    }

    // Speed multiplier for camera rotation
    public rotationSpeed = 1;

    // Speed multiplier for camera zoom
    public zoomSpeed = 0.1;

    /*
     * Rotation velocity drag coeffient [0 .. 1]
     * 0: Spins forever
     * 1: Instantly stops spinning
     */
    public frictionCoefficient = 0.999;

    // Construtor
    public constructor(options?: {

        // The initial position of the camera
        position?: Vec3;
    }) {
        super();
        if (options?.position) {
            this.position = options.position;
            this.distance = vec3.len(this.position);
            this.back = vec3.normalize(this.position);
            this.recalcuateRight();
            this.recalcuateUp();
        }
    }

    // Returns the camera matrix
    public get matrix(): Float32Array {
        return super.matrix;
    }

    // Assigns `mat` to the camera matrix, and recalcuates the distance
    public set matrix(mat: Mat4) {
        super.matrix = mat;
        this.distance = vec3.len(this.position);
    }

    public update(deltaTime: number, input: Controller): Mat4 {
        const epsilon = 0.0000001;

        if (input.analog.touching) {
            // Currently being dragged.
            this.angularVelocity = 0;
        } else {
            // Dampen any existing angular velocity
            this.angularVelocity *= (1 - this.frictionCoefficient) ** deltaTime;
        }

        // Calculate the movement vector
        const movement = vec3.create();
        vec3.addScaled(movement, this.right, input.analog.x, movement);
        vec3.addScaled(movement, this.up, -input.analog.y, movement);

        // Cross the movement vector with the view direction to calculate the rotation axis x magnitude
        const crossProduct = vec3.cross(movement, this.back);

        // Calculate the magnitude of the drag
        const magnitude = vec3.len(crossProduct);

        if (magnitude > epsilon) {
            // Normalize the crossProduct to get the rotation axis
            this.axis = vec3.scale(crossProduct, 1 / magnitude);

            // Remember the current angular velocity. This is used when the touch is released for a fling.
            this.angularVelocity = magnitude * this.rotationSpeed;
        }

        // The rotation around this.axis to apply to the camera matrix this update
        const rotationAngle = this.angularVelocity * deltaTime;
        if (rotationAngle > epsilon) {
            /*
             * Rotate the matrix around axis
             * Note: The rotation is not done as a matrix-matrix multiply as the repeated multiplications
             * will quickly introduce substantial error into the matrix.
             */
            this.back = vec3.normalize(rotate(this.back, this.axis, rotationAngle));
            this.recalcuateRight();
            this.recalcuateUp();
        }

        // recalculate `this.position` from `this.back` considering zoom
        if (input.analog.zoom !== 0) {
            this.distance *= 1 + (input.analog.zoom * this.zoomSpeed);
        }
        this.position = vec3.scale(this.back, this.distance);

        // Invert the camera matrix to build the view matrix
        this.view = mat4.invert(this.matrix);
        return this.view;
    }

    // Assigns `this.right` with the cross product of `this.up` and `this.back`
    public recalcuateRight(): void {
        this.right = vec3.normalize(vec3.cross(this.up, this.back));
    }

    // Assigns `this.up` with the cross product of `this.back` and `this.right`
    public recalcuateUp(): void {
        this.up = vec3.normalize(vec3.cross(this.back, this.right));
    }

}

export interface CameraParams {
    type: 'arcball' | 'WASD';
}

export interface Cameras {
    WASD: WASDCamera;
    arcball: ArcballCamera;
}

export function getModelViewProjectionMatrix(deltaTime: number, camera: WASDCamera | ArcballCamera, inputHandler: InputHandler, aspect: number): Float32Array {
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);
    const modelViewProjectionMatrix = mat4.create();
    const viewMatrix = camera.update(deltaTime, inputHandler());
    mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);
    return modelViewProjectionMatrix as Float32Array;
}

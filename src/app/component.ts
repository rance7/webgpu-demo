import { GUI } from 'dat.gui';
import { vec3 } from 'wgpu-matrix';
import { getTextureBlob } from './lib';
import { ArcballCamera, CameraParams, Cameras, WASDCamera, getModelViewProjectionMatrix } from './lib/camera';
import { InputHandler, createInputHandler } from './lib/controller';
import { ComponentParams, WaveParams, initStatus } from './lib/model.lib';
import { Part } from './part';

export class Component {

    public part?: Part;

    public uniformBuffer?: GPUBuffer;

    public texture?: GPUTexture;

    public sampler?: GPUSampler;

    public bindGroup?: GPUBindGroup;

    public canvas2d?: HTMLCanvasElement;

    public context2d?: CanvasRenderingContext2D;

    public componentParams?: ComponentParams;

    public waveParams?: WaveParams;

    public cameras!: Cameras;

    public cameraParams!: CameraParams;

    public inputHandler?: InputHandler;

    public async initComponent(part: Part, componentParams: ComponentParams): Promise<initStatus> {
        this.part = part;
        this.componentParams = componentParams;
        this.cameras = {
            arcball: new ArcballCamera({ position: vec3.create(3, 2, 5) }),
            WASD: new WASDCamera({ position: vec3.create(3, 2, 5) }),
        };
        this.cameraParams = { type: 'arcball' };

        if (!this.part?.render?.webgpu?.device || !this.part.render.bindGroupLayout || !this.part.render.webgpu.canvas) {
            console.error('Exit initComponent: device, bindGroupLayout, canvas undefined');
            return initStatus.FAIL;
        }

        this.inputHandler = createInputHandler(window, this.part.render.webgpu.canvas);

        this.uniformBuffer = this.part.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * 16 * 3,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });

        this.part.render.webgpu.device.queue.writeBuffer(this.uniformBuffer,
            Float32Array.BYTES_PER_ELEMENT * 16 * 1,
            new Float32Array(componentParams.ScaleMatrix));

        this.part.render.webgpu.device.queue.writeBuffer(this.uniformBuffer,
            Float32Array.BYTES_PER_ELEMENT * 16 * 2,
            new Float32Array(componentParams.LocationMatrix));

        const textureBlob: ImageBitmapSource | null = await getTextureBlob(componentParams.TextureUrl);
        if (!textureBlob) {
            console.error('Exit initComponent: textureBlob undefined');
            return initStatus.FAIL;
        }
        const textureImageBitMap: ImageBitmap = await createImageBitmap(textureBlob, {
            imageOrientation: 'flipY',
        });

        this.texture = this.part.render.webgpu.device.createTexture({
            size:
            {
                width: textureImageBitMap.width,
                height: textureImageBitMap.height,
            },
            format: 'rgba16float',
            usage: GPUTextureUsage.TEXTURE_BINDING
                | GPUTextureUsage.COPY_DST
                | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.part.render.webgpu.device.queue.copyExternalImageToTexture(
            {
                source: textureImageBitMap,
            },
            {
                texture: this.texture,
            },
            {
                width: textureImageBitMap.width,
                height: textureImageBitMap.height,
            },
        );

        this.sampler = this.part.render.webgpu.device.createSampler();

        this.bindGroup = this.part.render.webgpu.device.createBindGroup({
            layout: this.part.render.bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource:
                    {
                        buffer: this.uniformBuffer,
                    },
                },
                {
                    binding: 1,
                    resource: this.texture.createView(),
                },
                {
                    binding: 2,
                    resource: this.sampler,
                },
            ],
        });

        let oldCameraType = this.cameraParams.type;
        const gui: GUI = new GUI();
        gui.add(this.cameraParams, 'type', ['arcball', 'WASD']).onChange(() => {
            const newCameraType = this.cameraParams.type;
            this.cameras[newCameraType].matrix = this.cameras[oldCameraType].matrix;
            oldCameraType = newCameraType;
        });

        return initStatus.OK;
    }

    public draw(passEncoder: GPURenderPassEncoder, lastFrameMS: number): void {
        if (!this.bindGroup || !this.part?.render?.pipeline || !this.part.vertexNumber || !this.part.vertexBuffer || !this.uniformBuffer || !this.part?.render?.webgpu?.canvas || !this.inputHandler) {
            console.error('Exit camera: canvas or inputHandler undefined');
            return;
        }

        const now = Date.now();
        const deltaTime = (now - lastFrameMS) / 1000;
        // eslint-disable-next-line no-param-reassign
        lastFrameMS = now;
        const aspect = this.part?.render?.webgpu?.canvas.width / this.part?.render?.webgpu?.canvas.height;
        const modelViewProjection = getModelViewProjectionMatrix(deltaTime, this.cameras[this.cameraParams.type], this.inputHandler, aspect);

        this.part.render.webgpu.device?.queue.writeBuffer(
            this.uniformBuffer,
            0,
            modelViewProjection.buffer,
            modelViewProjection.byteOffset,
            modelViewProjection.byteLength,
        );

        passEncoder.setPipeline(this.part.render.pipeline);
        passEncoder.setVertexBuffer(0, this.part.vertexBuffer);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.draw(this.part.vertexNumber);
    }

    public rotate(passEncoder: GPURenderPassEncoder): void {
        if (!this.part?.render?.webgpu?.device || !this.uniformBuffer || !this.bindGroup || !this.part.render.pipeline || !this.part.vertexNumber || !this.part.vertexBuffer) {
            console.error('Exit draw: device, uniformBuffer, bindGroup, vertexNumber, vertexBuffer or pipeline undefined');
            return;
        }

        const timeCycle: number = 10000;
        const p: number = 2 * Math.PI * (Date.now() % timeCycle) / timeCycle;
        const cosP: number = Math.cos(p);
        const sinP: number = Math.sin(p);
        this.part.render.webgpu.device.queue.writeBuffer(this.uniformBuffer, 0, new Float32Array(
            [
                sinP, 0, cosP, 0,
                0, 1, 0, 0,
                cosP, 0, -sinP, 0,
                0, 0, 0, 1,
            ],
        ));

        passEncoder.setPipeline(this.part.render.pipeline);
        passEncoder.setVertexBuffer(0, this.part.vertexBuffer);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.draw(this.part.vertexNumber);
    }

    public wave(passEncoder: GPURenderPassEncoder): void {
        if (!this.part?.render?.webgpu?.device || !this.uniformBuffer || !this.bindGroup || !this.part.render.pipeline || !this.waveParams) {
            console.error('Exit draw: device, uniformBuffer, bindGroup, waveParams or pipeline undefined');
            return;
        }

        const timeCycle: number = 10000;
        const p: number = 2 * Math.PI * (Date.now() % timeCycle) / timeCycle;

        this.part.render.webgpu.device.queue.writeBuffer(this.uniformBuffer, 0, new Float32Array(
            [
                this.waveParams.Width,
                this.waveParams.Height,
                this.waveParams.WaveNumber,
                2 * p,
                this.waveParams.WaveAmplitude,
                0, 0, 0,
                1, 0, 0, 0,
                0, Math.cos(Math.PI / 4), Math.sin(Math.PI / 4), 0,
                0, -Math.sin(Math.PI / 4), Math.cos(Math.PI / 4), 0,
                0, 0, 0.5, 1,
            ],
        ));

        passEncoder.setPipeline(this.part.render.pipeline);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.draw(this.waveParams.Width * 6, this.waveParams.Height);
    }

    public drawCanvas2d(passEncoder: GPURenderPassEncoder): void {
        if (!this.context2d || !this.canvas2d || !this.part?.render?.webgpu?.device || !this.texture) {
            console.error('Exit draw: context2d, device or texture undefined');
            return;
        }
        if (!this.part.render.pipeline || !this.part.vertexBuffer || !this.part.vertexNumber || !this.bindGroup) {
            console.error('Exit draw: pipeline, vertexBuffer, bindGroup or vertexNumber undefined');
            return;
        }
        this.context2d.fillStyle = 'rgb(125, 125, 125)';
        this.context2d.fillRect(0, 0, this.canvas2d.width, this.canvas2d.height);
        this.context2d.fillStyle = 'rgb(255,0,0)';
        this.context2d.font = '24px Arial';
        this.context2d.textBaseline = 'middle';
        this.context2d.textAlign = 'left';
        this.context2d.fillText((new Date()).toString(), 0, this.canvas2d.height / 2);

        this.part.render.webgpu.device.queue.copyExternalImageToTexture(
            {
                source: this.canvas2d,
            },
            {
                texture: this.texture,
            },
            {
                width: this.canvas2d.width,
                height: this.canvas2d.height,
            },
        );

        passEncoder.setPipeline(this.part.render.pipeline);
        passEncoder.setVertexBuffer(0, this.part.vertexBuffer);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.draw(this.part.vertexNumber);
    }

}

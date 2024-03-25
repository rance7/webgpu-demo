import { GUI } from 'dat.gui';
import { vec3 } from 'wgpu-matrix';
import { MODEL_PATH, getTextureBlob } from './lib';
import { ArcballCamera, CameraParams, Cameras, WASDCamera, getModelViewProjectionMatrix } from './lib/camera';
import { InputHandler, createInputHandler } from './lib/input-handler';
import { InitStatus } from './lib/model.lib';
import { Part } from './part';

export class Component {

    public part?: Part;

    public uniformBuffer?: GPUBuffer;

    public texture?: GPUTexture;

    public sampler?: GPUSampler;

    public bindGroup?: GPUBindGroup;

    public cameras!: Cameras;

    public cameraParams!: CameraParams;

    public lastFrameMS!: number;

    public inputHandler?: InputHandler;

    public canvas2d?: HTMLCanvasElement;

    public context2d?: CanvasRenderingContext2D;

    public initCamera(): InitStatus {
        this.cameras = {
            arcball: new ArcballCamera({ position: vec3.create(3, 2, 5) }),
            WASD: new WASDCamera({ position: vec3.create(3, 2, 5) }),
        };
        this.cameraParams = { type: 'arcball' };
        this.lastFrameMS = Date.now();
        return InitStatus.OK;
    }

    public initControlBoard(): InitStatus {
        if (!this.part?.render?.webgpu?.canvas) {
            console.error('Exit initControlBoard: canvas undefined');
            return InitStatus.FAIL;
        }

        this.inputHandler = createInputHandler(window, this.part.render.webgpu.canvas);
        let oldCameraType = this.cameraParams.type;
        const gui: GUI = new GUI();
        gui.domElement.id = 'gui';
        gui.add(this.cameraParams, 'type', ['arcball', 'WASD']).onChange(() => {
            const newCameraType = this.cameraParams.type;
            this.cameras[newCameraType].matrix = this.cameras[oldCameraType].matrix;
            oldCameraType = newCameraType;
        });
        const canvasContainer = document.querySelector('.container');
        if (!canvasContainer) {
            console.error('Exit initCamera: Fail to get canvas container');
            return InitStatus.FAIL;
        }
        canvasContainer.append(gui.domElement);
        return InitStatus.OK;
    }

    public async createTexture(imgName: string | undefined): Promise<ImageBitmap | null> {
        if (!imgName) {
            return null;
        }
        const textureBlob: ImageBitmapSource | null = await getTextureBlob(`${MODEL_PATH}/${imgName}`);
        if (!textureBlob) {
            console.error('Exit createTexture: Fail to get texture blob');
            return null;
        }

        const textureImageBitMap: ImageBitmap = await createImageBitmap(textureBlob, {
            imageOrientation: 'flipY',
        });
        return textureImageBitMap;
    }

    public async initComponent(part: Part, imgName: string | undefined): Promise<this> {
        this.part = part;
        this.initCamera();
        this.initControlBoard();
        if (!this.part?.render?.webgpu?.device || !this.part.render.webgpu.canvas || !this.part.render.pipeline) {
            console.error('Exit initComponent: device, canvas or bindGroupLayout undefined');
            return this;
        }

        this.uniformBuffer = this.part.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        if (!imgName) {
            // eslint-disable-next-line no-param-reassign
            imgName = 'grey.jpg';
        }
        const textureImageBitMap: ImageBitmap | null = await this.createTexture(imgName);
        if (!textureImageBitMap) {
            console.error('Exit textureImageBitMap: ImageBitmap undefined');
            return this;
        }

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

        this.sampler = this.part.render.webgpu.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        });

        this.bindGroup = this.part.render.webgpu.device.createBindGroup({
            layout: this.part.render.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
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
        return this;
    }

    public draw(passEncoder: GPURenderPassEncoder): InitStatus {
        if (!this.bindGroup || !this.part?.render?.pipeline || !this.part.vertexNumber || !this.part.vertexBuffer) {
            console.error('Exit camera: bindGroup, pipeline, vertexNumber or vertexBuffer undefined');
            return InitStatus.FAIL;
        }

        if (!this.uniformBuffer || !this.part.render.webgpu?.canvas || !this.inputHandler) {
            console.error('Exit camera: uniformBuffer, canvas or inputHandler undefined');
            return InitStatus.FAIL;
        }

        const now = Date.now();
        const deltaTime = (now - this.lastFrameMS) / 1000;
        this.lastFrameMS = now;
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
        return InitStatus.OK;
    }

    public rotate(passEncoder: GPURenderPassEncoder): void {
        if (!this.bindGroup || !this.part?.render?.pipeline || !this.part.vertexNumber || !this.part.vertexBuffer) {
            console.error('Exit camera: bindGroup, pipeline, vertexNumber or vertexBuffer undefined');
            return;
        }

        if (!this.part?.render?.webgpu?.device || !this.uniformBuffer) {
            console.error('Exit draw: device or uniformBuffer undefined');
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

    public drawCanvas2d(passEncoder: GPURenderPassEncoder): void {
        if (!this.part?.render?.pipeline || !this.part.vertexBuffer || !this.part.vertexNumber || !this.bindGroup) {
            console.error('Exit draw: pipeline, vertexBuffer, bindGroup or vertexNumber undefined');
            return;
        }

        if (!this.context2d || !this.canvas2d || !this.part?.render?.webgpu?.device || !this.texture) {
            console.error('Exit draw: context2d, device or texture undefined');
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

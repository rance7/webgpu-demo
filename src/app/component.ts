import { GUI } from 'dat.gui';
import { vec3 } from 'wgpu-matrix';
import { getTextureBlob } from './lib';
import { ArcballCamera, CameraParams, Cameras, WASDCamera, getModelViewProjectionMatrix } from './lib/camera';
import { InputHandler, createInputHandler } from './lib/input-handler';
import { ComponentParams, initStatus } from './lib/model.lib';
import { Part } from './part';

export class Component {

    public part?: Part;

    public componentParams?: ComponentParams;

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

    public async initComponent(part: Part, componentParams: ComponentParams): Promise<this> {
        this.part = part;
        this.componentParams = componentParams;
        this.cameras = {
            arcball: new ArcballCamera({ position: vec3.create(3, 2, 5) }),
            WASD: new WASDCamera({ position: vec3.create(3, 2, 5) }),
        };
        this.cameraParams = { type: 'arcball' };
        this.lastFrameMS = Date.now();

        if (!this.part?.render?.webgpu?.device || !this.part.render.webgpu.canvas || !this.part.render.pipeline) {
            console.error('Exit initComponent: device, canvas or bindGroupLayout undefined');
            return this;
        }

        this.inputHandler = createInputHandler(window, this.part.render.webgpu.canvas);

        this.uniformBuffer = this.part.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const textureBlob: ImageBitmapSource | null = await getTextureBlob(componentParams.TextureUrl);
        if (!textureBlob) {
            console.error('Exit initComponent: textureBlob undefined');
            return this;
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
            console.error('Fail to get canvas container');
            return this;
        }
        canvasContainer.append(gui.domElement);

        return this;
    }

    public draw(passEncoder: GPURenderPassEncoder): initStatus {
        if (!this.bindGroup || !this.part?.render?.pipeline || !this.part.vertexNumber || !this.part.vertexBuffer) {
            console.error('Exit camera: bindGroup, pipeline, vertexNumber or vertexBuffer undefined');
            return initStatus.FAIL;
        }

        if (!this.uniformBuffer || !this.part.render.webgpu?.canvas || !this.inputHandler) {
            console.error('Exit camera: uniformBuffer , canvas or inputHandler undefined');
            return initStatus.FAIL;
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
        return initStatus.OK;
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

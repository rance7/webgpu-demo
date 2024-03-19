import { getTextureBlob } from './lib';
import { WaveParams, initStatus } from './lib/model.lib';
import { Part } from './part';

export class Component {

    public part?: Part;

    public uniformBuffer?: GPUBuffer;

    public texture?: GPUTexture;

    public sampler?: GPUSampler;

    public bindGroup?: GPUBindGroup;

    public canvas2d?: HTMLCanvasElement;

    public context2d?: CanvasRenderingContext2D;

    public componentParams?: WaveParams;

    public async initComponent(part: Part, componentParams: WaveParams): Promise<initStatus> {
        this.part = part;
        this.componentParams = componentParams;
        if (!this.part?.render?.webgpu?.device || !this.part.render.bindGroupLayout) {
            console.error('Exit initComponent: device undefined');
            return initStatus.FAIL;
        }

        this.uniformBuffer = this.part.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * (8 + 16),
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });

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

        return initStatus.OK;
    }

    public draw(passEncoder: GPURenderPassEncoder): void {
        if (!this.part?.render?.webgpu?.device || !this.uniformBuffer || !this.bindGroup || !this.part.render.pipeline || !this.componentParams) {
            console.error('Exit draw: device, uniformBuffer, bindGroup, componentParams or pipeline undefined');
            return;
        }
        const timeCycle: number = 10000;
        // eslint-disable-next-line id-length
        const p: number = 2 * Math.PI * (Date.now() % timeCycle) / timeCycle;

        this.part.render.webgpu.device.queue.writeBuffer(this.uniformBuffer, 0, new Float32Array(
            [
                this.componentParams.Width,
                this.componentParams.Height,
                this.componentParams.WaveNumber,
                2 * p,
                this.componentParams.WaveAmplitude,
                0, 0, 0,
                1, 0, 0, 0,
                0, Math.cos(Math.PI / 4), Math.sin(Math.PI / 4), 0,
                0, -Math.sin(Math.PI / 4), Math.cos(Math.PI / 4), 0,
                0, 0, 0.5, 1,
            ],
        ));

        passEncoder.setPipeline(this.part.render.pipeline);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.draw(this.componentParams.Width * 6, this.componentParams.Height);
    }

    public rotate(passEncoder: GPURenderPassEncoder): void {
        if (!this.part?.render?.webgpu?.device || !this.uniformBuffer || !this.bindGroup || !this.part.render.pipeline || !this.componentParams) {
            console.error('Exit draw: device, uniformBuffer, bindGroup, componentParams or pipeline undefined');
            return;
        }
        const timeCycle: number = 10000;
        // eslint-disable-next-line id-length
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
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.draw(this.componentParams.Width * 6, this.componentParams.Height);
    }

    public drawCanvas2d(passEncoder: GPURenderPassEncoder): void {
        if (!this.context2d || !this.canvas2d || !this.part?.render?.webgpu?.device || !this.texture) {
            console.error('Exit draw: context2d, device or texture undefined');
            return;
        }
        if (!this.part.render.pipeline || !this.part.vertexBuffer || !this.part.vertexNumber || !this.bindGroup) {
            console.error('Exit draw: pipeline, uniformBuffer, vertexBuffer, bindGroup or vertexNumber undefined');
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

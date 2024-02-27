import { getTextureBlob } from './lib';
import { initStatus } from './lib/model.lib';
import { Part } from './part';

export class Component {

    public part?: Part;

    public uniformBuffer?: GPUBuffer;

    public texture?: GPUTexture;

    public sampler?: GPUSampler;

    public bindGroup?: GPUBindGroup;

    public canvas2d?: HTMLCanvasElement;

    public context2d?: CanvasRenderingContext2D;

    public async initComponent(part: Part): Promise<initStatus> {
        this.part = part;
        if (!this.part?.render?.webgpu?.device || !this.part.render.bindGroupLayout || !this.part.parameter) {
            console.error('Exit constructComponet: device undefined');
            return initStatus.FAIL;
        }

        this.uniformBuffer = this.part.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * 16 * 3,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });

        this.part.render.webgpu.device.queue.writeBuffer(this.uniformBuffer
            , Float32Array.BYTES_PER_ELEMENT * 16 * 1
            , new Float32Array(this.part.parameter.ScaleMatrix));
        this.part.render.webgpu.device.queue.writeBuffer(this.uniformBuffer
            , Float32Array.BYTES_PER_ELEMENT * 16 * 2
            , new Float32Array(this.part.parameter.LocationMatrix));

        const textureBlob: ImageBitmapSource | null = await getTextureBlob(this.part.parameter.TextureUrl);
        if (!textureBlob) {
            console.error('Exit draw: textureBlob undefined');
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
        if (!this.part?.render?.webgpu?.device || !this.uniformBuffer || !this.bindGroup || !this.part.render.pipeline || !this.part.vertexBuffer || !this.part.vertexNumber) {
            console.error('Exit constructComponet: device, uniformBuffer, bindGroup, pipeline, vertexBuffer or vertexNumber undefined');
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
        passEncoder.setVertexBuffer(0, this.part.vertexBuffer);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.draw(this.part.vertexNumber);
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

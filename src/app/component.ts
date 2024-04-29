import { MODEL_PATH, getTextureBlob } from './lib';
import { Part } from './part';

export class Component {

    public part?: Part;

    public uniformBuffer?: GPUBuffer;

    public pickupUniformBuffer?: GPUBuffer;

    public pickupUniformValues: Uint32Array = new Uint32Array(1);

    public uniformValues: Uint32Array = new Uint32Array(16);

    public bindGroup?: GPUBindGroup;

    public pickupBindgroup?: GPUBindGroup;

    public texture?: GPUTexture;

    public sampler?: GPUSampler;

    public async initComponent(part: Part, imgName: string | undefined, i: number): Promise<this> {
        this.part = part;
        if (!this.part?.render?.webgpu?.device || !this.part.render.webgpu.canvas || !this.part.render.pipeline || !this.part.render.pickupPipeline) {
            console.error('Exit initComponent: device, canvas or pipeline undefined');
            return this;
        }

        this.uniformBuffer = this.part.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.pickupUniformBuffer = this.part.render.webgpu.device.createBuffer({
            size: Uint32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.pickupUniformValues.set([i]);
        this.part.render.webgpu.device.queue.writeBuffer(
            this.pickupUniformBuffer,
            0,
            this.pickupUniformValues.buffer,
            this.pickupUniformValues.byteOffset,
            this.pickupUniformValues.byteLength,
        );

        const textureBlob: ImageBitmapSource | null = await getTextureBlob(imgName ? `${MODEL_PATH}/${imgName}` : './assets/grey.jpg');
        if (!textureBlob) {
            console.error('Exit initComponent: fail to get texture blob');
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

        this.pickupBindgroup = this.part.render.webgpu.device.createBindGroup({
            layout: this.part.render.pickupPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.uniformBuffer },
                },
                {
                    binding: 3,
                    resource: { buffer: this.pickupUniformBuffer },
                },
            ],
        });
        return this;
    }

}

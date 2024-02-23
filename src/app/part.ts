import { VERTEX_DATA_PATH, getVertexData } from './lib';
import { initStatus } from './lib/model.lib';
import { Render } from './render';

export class Part {

    public vertexNumber?: number;

    public vertexBuffer?: GPUBuffer;

    public render?: Render;

    public texture?: GPUTexture;

    public sampler?: GPUSampler;

    public bindGroup?: GPUBindGroup;

    public async initPart(render: Render): Promise<initStatus> {
        this.render = render;
        if (!this.render?.webgpu?.device || !this.render.bindGroupLayout) {
            console.error('Exit initVexBuffer: device or bindGroupLayout undefined');
            return initStatus.FAIL;
        }
        const vertexData: Array<number> | null = await getVertexData(VERTEX_DATA_PATH);
        if (!vertexData) {
            console.error('Exit initVexBuffer: get vertexData failed');
            return initStatus.FAIL;
        }

        this.vertexNumber = vertexData.length / 8;
        this.vertexBuffer = this.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * vertexData.length,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.render.webgpu.device.queue.writeBuffer(this.vertexBuffer, 0, new Float32Array(vertexData));

        const textureWidth: number = 600;
        const textureHeight: number = 32;
        this.texture = this.render.webgpu.device.createTexture({
            size: { width: textureWidth, height: textureHeight },
            format: 'rgba16float',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.sampler = this.render.webgpu.device.createSampler();

        this.bindGroup = this.render.webgpu.device.createBindGroup(
            {
                layout: this.render.bindGroupLayout,
                entries: [{
                    binding: 0,
                    resource: this.texture.createView(),
                },
                {
                    binding: 1,
                    resource: this.sampler,
                }],
            },
        );

        return initStatus.OK;
    }

}

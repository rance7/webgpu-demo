import { Render } from './render';

export class Part {

    public vertexNumber?: number;

    public vertexBuffer?: GPUBuffer;

    public render?: Render;

    public initPart(render: Render, vertexData: Float32Array): this {
        this.render = render;
        if (!this.render?.webgpu?.device) {
            console.error('Exit initPart: device undefined');
            return this;
        }
        this.vertexBuffer = this.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * vertexData.length,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.render.webgpu.device.queue.writeBuffer(this.vertexBuffer, 0, new Float32Array(vertexData));
        this.vertexNumber = vertexData.length / this.render.renderParams.arrayStride;
        return this;
    }

}

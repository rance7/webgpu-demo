import { PartParams } from './lib/model.lib';
import { ObjParser } from './lib/obj-parser';
import { Render } from './render';

export class Part {

    public vertexNumber?: number;

    public vertexBuffer?: GPUBuffer;

    public render?: Render;

    public async initPart(render: Render, partParams: PartParams): Promise<this> {
        this.render = render;
        if (!this.render?.webgpu?.device) {
            console.error('Exit initPart: device or bindGroupLayout undefined');
            return this;
        }

        // const vertexData: Array<number> | null = await getVertexData(partParams.VertexDataUrl);

        const vertexData: Float32Array = await new ObjParser().parseObj2Vertices(partParams.VertexDataUrl);
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!vertexData) {
            console.error('Exit initPart: vertexData undefined');
            return this;
        }

        this.vertexBuffer = this.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * vertexData.length,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.render.webgpu.device.queue.writeBuffer(this.vertexBuffer, 0, new Float32Array(vertexData));
        this.vertexNumber = vertexData.length / this.render.renderParams.ArrayStride;

        return this;
    }

}

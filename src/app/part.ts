import { getVertexData } from './lib';
import { PartParams } from './lib/model.lib';
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

        // const vertexData: Float32Array = await new ObjParser().parseObj2Vertices(partParams.VertexDataUrl);

        const vertexData: Array<number> | null = await getVertexData(partParams.VertexDataUrl);
        if (!vertexData) {
            console.error('Exit initPart: vertexData undefined');
            return this;
        }

        console.info(`vertex data length: ${vertexData.length}`);
        this.vertexBuffer = this.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * vertexData.length,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.render.webgpu.device.queue.writeBuffer(this.vertexBuffer, 0, new Float32Array(vertexData));
        this.vertexNumber = vertexData.length / 10;

        return this;
    }

}

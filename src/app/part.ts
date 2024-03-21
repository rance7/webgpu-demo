import { PartParams, initStatus } from './lib/model.lib';
import { ObjParser } from './lib/obj-parser';
import { Render } from './render';

export class Part {

    public vertexNumber?: number;

    public vertexBuffer?: GPUBuffer;

    public render?: Render;

    public async initPart(render: Render, partParams: PartParams): Promise<initStatus> {
        this.render = render;
        if (!this.render?.webgpu?.device || !this.render.bindGroupLayout) {
            console.error('Exit initPart: device or bindGroupLayout undefined');
            return initStatus.FAIL;
        }

        const vertexData: Float32Array = await new ObjParser().parseObj2Vertices(partParams.VertexDataUrl);

        this.vertexBuffer = this.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * vertexData.length,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.render.webgpu.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
        this.vertexNumber = Math.floor(vertexData.length / 8);

        return initStatus.OK;
    }

}

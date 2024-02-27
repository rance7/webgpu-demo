import { getVertexData } from './lib';
import { PartParameter, initStatus } from './lib/model.lib';
import { Render } from './render';

export class Part {

    public vertexNumber?: number;

    public vertexBuffer?: GPUBuffer;

    public render?: Render;

    public parameter?: PartParameter;

    public async initPart(render: Render, parameter: PartParameter): Promise<initStatus> {
        this.render = render;
        if (!this.render?.webgpu?.device || !this.render.bindGroupLayout) {
            console.error('Exit initVexBuffer: device or bindGroupLayout undefined');
            return initStatus.FAIL;
        }
        const vertexData: Array<number> | null = await getVertexData(parameter.VertexDataUrl);
        if (!vertexData) {
            console.error('Exit initVexBuffer: get vertexData failed');
            return initStatus.FAIL;
        }

        this.parameter = parameter;
        this.vertexNumber = vertexData.length / 8;
        this.vertexBuffer = this.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * vertexData.length,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.render.webgpu.device.queue.writeBuffer(this.vertexBuffer, 0, new Float32Array(vertexData));

        return initStatus.OK;
    }

}

import { VERTEX_DATA_PATH, getVertexData } from './lib';
import { initStatus } from './lib/model.lib';
import { Render } from './render';

export class Part {

    public vertexNumber: number | undefined;

    public vertexBuffer: GPUBuffer | undefined;

    public render: Render | undefined;

    public async initPart(render: Render): Promise<initStatus> {
        this.render = render;
        if (!this.render?.webgpu?.device) {
            console.error('Exit initVexBuffer: device undefined');
            return initStatus.fail;
        }
        const vertexData: Array<number> | null = await getVertexData(VERTEX_DATA_PATH);
        if (!vertexData) {
            console.error('Exit initVexBuffer: get vertexData failed');
            return initStatus.fail;
        }

        this.vertexNumber = vertexData.length / 8;
        this.vertexBuffer = this.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * vertexData.length,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.render.webgpu.device.queue.writeBuffer(this.vertexBuffer, 0, new Float32Array(vertexData));

        return initStatus.success;
    }

}

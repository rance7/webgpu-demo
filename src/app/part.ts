import { Part, Render } from './lib/model.lib';

export async function initPart(render: Render): Promise<Part | null> {
    const serverPromise: Response = await fetch('./assets/vertex_data.txt', {
        cache: 'no-cache',
    });

    if (!serverPromise.ok) {
        // eslint-disable-next-line no-alert
        alert(`execute vertex data fetch,status is ${serverPromise.status}`);
        return null;
    }

    const vertexData: Array<number> = await serverPromise.json() as Array<number>;
    const vertexBuffer: GPUBuffer | AudioBuffer = render.webgpu.device.createBuffer({
        size: Float32Array.BYTES_PER_ELEMENT * vertexData.length,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    render.webgpu.device.queue.writeBuffer(vertexBuffer, 0, new Float32Array(vertexData));

    return { render, vertexBuffer, vertexNumber: vertexData.length / 8 };
}

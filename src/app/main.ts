import { drawCanvas } from './draw';
import { Render, WebGPU } from './lib/model.lib';
import { initRender } from './render';
import { initWebgpu } from './webgpu';

async function main(): Promise<void> {
    const webgpu: WebGPU | null = await initWebgpu();
    if (!webgpu) {
        return;
    }

    const render: Render | null = await initRender(webgpu);
    if (!render) {
        return;
    }

    drawCanvas(render);
}

await main();

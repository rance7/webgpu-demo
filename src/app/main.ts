import { initComponent } from './component';
import { drawCanvas } from './draw';
import { Component, Part, Render, WebGPU } from './lib/model.lib';
import { initPart } from './part';
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

    const part: Part | null = await initPart(render);
    if (!part) {
        return;
    }
    const component: Component = initComponent(part);

    drawCanvas(component);
}

await main();

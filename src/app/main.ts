import { Component } from './component';
import { Part } from './part';
import { Render } from './render';
import { Target } from './target';
import { Webgpu } from './webgpu';

async function main(): Promise<void> {
    const webgpu: Webgpu = new Webgpu();
    await webgpu.initWebgpu();

    const render: Render = new Render();
    await render.initRender(webgpu);

    const part: Part = new Part();
    await part.initPart(render);

    const component: Component = new Component();
    component.initComponent(part);

    const target: Target = new Target();
    target.initTarget(component);
    target.drawCanvas();
}

await main();

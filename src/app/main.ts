import { Component } from './component';
import { ComponentParams, PartParams } from './lib/model.lib';
import { Part } from './part';
import { Render } from './render';
import { Target } from './target';
import { Webgpu } from './webgpu';

async function main(): Promise<void> {
    const componentParams: ComponentParams = {
        TextureUrl: './assets/pistol/20110804045230203640.jpg',
        ScaleMatrix: [
            0.95, 0, 0, 0,
            0, 0.95, 0, 0,
            0, 0, 0.5, 0,
            0, 0, 0, 1,
        ],
        LocationMatrix: [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0.5, 1,
        ],
    };

    const partParams: PartParams = {
        VertexDataUrl: './assets/pistol/part.obj',
    };

    const webgpu: Webgpu = new Webgpu();
    await webgpu.initWebgpu();

    const render: Render = new Render();
    await render.initRender(webgpu);

    const earthPart: Part = new Part();
    await earthPart.initPart(render, partParams);

    const components: Array<Component> = new Array<Component>();
    const flagComponent: Component = new Component();
    await flagComponent.initComponent(earthPart, componentParams);
    components.push(flagComponent);

    const target: Target = new Target();
    target.initTarget(components);
    target.drawCanvas();
}

await main();

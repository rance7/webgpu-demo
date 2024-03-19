import { Component } from './component';
import { ComponentParameter } from './lib/model.lib';
import { Part } from './part';
import { Render } from './render';
import { Target } from './target';
import { Webgpu } from './webgpu';

async function main(): Promise<void> {
    const scaleMatrix: Array<number> = [
        0.95, 0, 0, 0,
        0, 0.95, 0, 0,
        0, 0, 0.5, 0,
        0, 0, 0, 1,
    ];

    const locationMatrix: Array<number> = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0.5, 1,
    ];

    const earthComponentParameter: ComponentParameter = {
        Width: 300,
        Height: 300,
        TextureUrl: './assets/earth.png',
        ScaleMatrix: scaleMatrix,
        LocationMatrix: locationMatrix,
    };

    const webgpu: Webgpu = new Webgpu();
    await webgpu.initWebgpu();

    const render: Render = new Render();
    await render.initRender(webgpu);

    const earthPart: Part = new Part();
    earthPart.initPart(render);

    const components: Array<Component> = new Array<Component>();
    const earthComponent: Component = new Component();
    await earthComponent.initComponent(earthPart, earthComponentParameter);
    components.push(earthComponent);

    const target: Target = new Target();
    target.initTarget(components);
    target.drawCanvas();
}

await main();

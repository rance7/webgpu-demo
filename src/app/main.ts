import { Component } from './component';
import { PartParameter } from './lib/model.lib';
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

    const trunkPartParameter: PartParameter = {
        TextureUrl: './assets/trunk.jpg',
        VertexDataUrl: './assets/trunk_vertex_data.txt',
        ScaleMatrix: scaleMatrix,
        LocationMatrix: locationMatrix,
    };

    const crownPartParameter: PartParameter = {
        TextureUrl: './assets/crown.png',
        VertexDataUrl: './assets/crown_vertex_data.txt',
        ScaleMatrix: scaleMatrix,
        LocationMatrix: locationMatrix,
    };

    const webgpu: Webgpu = new Webgpu();
    await webgpu.initWebgpu();

    const render: Render = new Render();
    await render.initRender(webgpu);

    const trunkPart: Part = new Part();
    await trunkPart.initPart(render, trunkPartParameter);

    const crownPart: Part = new Part();
    await crownPart.initPart(render, crownPartParameter);

    const components: Array<Component> = new Array<Component>();
    const trunkComponent: Component = new Component();
    await trunkComponent.initComponent(trunkPart);
    const crownComponent: Component = new Component();
    await crownComponent.initComponent(crownPart);
    components.push(trunkComponent);
    components.push(crownComponent);

    const target: Target = new Target();
    target.initTarget(components);
    target.drawCanvas();
}

await main();

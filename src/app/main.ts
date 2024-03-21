import { Component } from './component';
import { ComponentParams, PartParams, RenderParams } from './lib/model.lib';
import { Part } from './part';
import { Render } from './render';
import { Target } from './target';
import { Webgpu } from './webgpu';

async function main(): Promise<void> {
    const componentParams: ComponentParams = {
        TextureUrl: './assets/pistol/20110804045230203640.jpg',
    };

    const partParams: PartParams = {
        VertexDataUrl: './assets/cube.json',
    };

    const renderParams: RenderParams = {
        ArrayStride: 10,
        PositionOffset: 0,
        UVOffset: 8,
    };

    const part: Part = new Part();
    await part.initPart(await new Render().initRender(await new Webgpu().initWebgpu(), renderParams), partParams);

    const components: Array<Component> = new Array<Component>();
    components.push(await new Component().initComponent(part, componentParams));

    new Target().initTarget(components).drawCanvas();
}

await main();

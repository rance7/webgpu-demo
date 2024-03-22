import { Component } from './component';
import { ComponentParams, PartParams, RenderParams } from './lib/model.lib';
import { Part } from './part';
import { Render } from './render';
import { Target } from './target';
import { Webgpu } from './webgpu';

async function main(): Promise<void> {
    const componentParams: ComponentParams = {
        TextureUrl: './assets/dragon.jpg',
    };

    const partParams: PartParams = {
        VertexDataUrl: './assets/dragon.obj',
    };

    const renderParams: RenderParams = {
        ArrayStride: 6,
        PositionOffset: 0,
        UVOffset: 4,
    };

    const part: Part = new Part();
    await part.initPart(await new Render().initRender(await new Webgpu().initWebgpu(), renderParams), partParams);

    const components: Array<Component> = new Array<Component>();
    components.push(await new Component().initComponent(part, componentParams));

    new Target().initTarget(components).drawCanvas();
}

await main();

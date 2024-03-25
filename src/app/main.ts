import { Component } from './component';
import { MODEL_PATH } from './lib';
import { RenderParams, Vertices } from './lib/model.lib';
import { ObjParser } from './lib/obj-parser';
import { Part } from './part';
import { Render } from './render';
import { Target } from './target';
import { Webgpu } from './webgpu';

async function main(): Promise<void> {
    const renderParams: RenderParams = {
        ArrayStride: 6,
        PositionOffset: 0,
        UVOffset: 4,
    };

    const objParser: ObjParser = new ObjParser();
    const vertexData: Array<Vertices> | null = await objParser.parseObj2Vertices(`${MODEL_PATH}/pistol.obj`);
    if (!vertexData) {
        console.error('Exit main: vertexData undefined');
        return;
    }

    const render: Render = await new Render().initRender(await new Webgpu().initWebgpu(), renderParams);
    const components: Array<Component> = new Array<Component>();
    for (const componentVertex of vertexData) {
        components.push(await new Component().initComponent(new Part().initPart(render, componentVertex.Vertex), componentVertex.TextureImgName));
    }
    new Target().initTarget(components).drawCanvas();
}

await main();

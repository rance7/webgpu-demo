import { Component } from './component';
import { WaveParams } from './lib/model.lib';
import { Part } from './part';
import { Render } from './render';
import { Target } from './target';
import { Webgpu } from './webgpu';

async function main(): Promise<void> {
    const flagParams: WaveParams = {
        Width: 1000,
        Height: 1000,
        WaveNumber: 6,
        TimeCycle: 1000,
        WaveAmplitude: 0.01,
        TextureUrl: './assets/us_flag.png',
    };

    const webgpu: Webgpu = new Webgpu();
    await webgpu.initWebgpu();

    const render: Render = new Render();
    await render.initRender(webgpu);

    const earthPart: Part = new Part();
    earthPart.initPart(render);

    const components: Array<Component> = new Array<Component>();
    const flagComponent: Component = new Component();
    await flagComponent.initComponent(earthPart, flagParams);
    components.push(flagComponent);

    const target: Target = new Target();
    target.initTarget(components);
    target.drawCanvas();
}

await main();

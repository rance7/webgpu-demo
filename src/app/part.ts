import { initStatus } from './lib/model.lib';
import { Render } from './render';

export class Part {

    public vertexNumber?: number;

    public vertexBuffer?: GPUBuffer;

    public render?: Render;

    public initPart(render: Render): initStatus {
        this.render = render;
        if (!this.render?.webgpu?.device || !this.render.bindGroupLayout) {
            console.error('Exit initPart: device or bindGroupLayout undefined');
            return initStatus.FAIL;
        }
        return initStatus.OK;
    }

}

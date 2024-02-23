import { convertNullToUndefined } from './lib';
import { initStatus } from './lib/model.lib';
import { Part } from './part';

export class Component {

    public part?: Part;

    public canvas2d?: HTMLCanvasElement;

    public context2d?: CanvasRenderingContext2D;

    public initComponent(part: Part): initStatus {
        if (!part?.render?.webgpu?.device || !part.texture?.width || !part.texture.height) {
            console.error('Exit constructComponet: device, width or height undefined');
            return initStatus.FAIL;
        }
        this.part = part;
        this.canvas2d = document.createElement('canvas');
        this.canvas2d.width = part.texture.width;
        this.canvas2d.height = part.texture.height;
        this.context2d = convertNullToUndefined(this.canvas2d.getContext('2d'));

        return initStatus.OK;
    }

    public draw(passEncoder: GPURenderPassEncoder): void {
        if (!this.context2d || !this.canvas2d || !this.part?.render?.webgpu?.device || !this.part.texture) {
            console.error('Exit draw: context2d, device or texture undefined');
            return;
        }
        if (!this.part.render.pipeline || !this.part.vertexBuffer || !this.part.vertexNumber || !this.part.bindGroup) {
            console.error('Exit draw: pipeline, uniformBuffer, vertexBuffer, bindGroup or vertexNumber undefined');
            return;
        }
        this.context2d.fillStyle = 'rgb(125, 125, 125)';
        this.context2d.fillRect(0, 0, this.canvas2d.width, this.canvas2d.height);
        this.context2d.fillStyle = 'rgb(255,0,0)';
        this.context2d.font = '24px Arial';
        this.context2d.textBaseline = 'middle';
        this.context2d.textAlign = 'left';
        this.context2d.fillText((new Date()).toString(), 0, this.canvas2d.height / 2);

        this.part.render.webgpu.device.queue.copyExternalImageToTexture(
            {
                source: this.canvas2d,
            },
            {
                texture: this.part.texture,
            },
            {
                width: this.canvas2d.width,
                height: this.canvas2d.height,
            },
        );

        passEncoder.setPipeline(this.part.render.pipeline);
        passEncoder.setVertexBuffer(0, this.part.vertexBuffer);
        passEncoder.setBindGroup(0, this.part.bindGroup);
        passEncoder.draw(this.part.vertexNumber);
    }

}

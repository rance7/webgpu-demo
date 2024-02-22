import { Component } from './component';
import { initStatus } from './lib/model.lib';

export class Target {

    public commandEncoder?: GPUCommandEncoder;

    public passEncoder?: GPURenderPassEncoder;

    public component?: Component;

    public initTarget(component: Component): initStatus {
        this.component = component;
        return initStatus.success;
    }

    public beginDraw(): void {
        if (!this.component?.part?.render?.webgpu?.device || !this.component.part.render.webgpu.canvasContext) {
            console.error('Exit beginDraw: device or canvasContext undefined');
            return;
        }
        this.commandEncoder = this.component.part.render.webgpu.device.createCommandEncoder();
        this.passEncoder = this.commandEncoder.beginRenderPass(
            {
                colorAttachments: [
                    {
                        view: this.component.part.render.webgpu.canvasContext.getCurrentTexture().createView(),
                        clearValue: { r: 0, g: 0, b: 0, a: 1 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            },
        );
    }

    public doDraw(): void {
        if (!this.component || !this.passEncoder) {
            console.error('Exit doDraw: component or passEncoder undefined');
            return;
        }
        this.component.rotate(this.passEncoder);
    }

    public endDraw(): void {
        if (!this.component?.part?.render?.webgpu?.device || !this.passEncoder || !this.commandEncoder) {
            console.error('Exit doDraw: device, passEncoder or commandEncoder undefined');
            return;
        }
        this.passEncoder.end();
        this.component.part.render.webgpu.device.queue.submit([this.commandEncoder.finish()]);
    }

    public drawCanvas(): void {
        this.beginDraw();
        this.doDraw();
        this.endDraw();
        window.requestAnimationFrame(() => this.drawCanvas());
    }

}

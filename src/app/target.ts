import { Component } from './component';
import { InitStatus } from './lib/model.lib';

export class Target {

    public commandEncoder?: GPUCommandEncoder;

    public passEncoder?: GPURenderPassEncoder;

    public depthTexture?: GPUTexture;

    public components?: Array<Component>;

    public initTarget(components: Array<Component>): this {
        this.components = components;
        if (!Array.isArray(this.components) || !this.components[0]?.part?.render?.webgpu?.device || !this.components[0].part.render.webgpu.canvasContext) {
            console.error('Exit doDraw: components, device or canvasContext undefined');
            return this;
        }
        const canvasTexture: GPUTexture = this.components[0].part.render.webgpu.canvasContext.getCurrentTexture();
        this.depthTexture = this.components[0].part.render.webgpu.device.createTexture({
            size:
            {
                width: canvasTexture.width,
                height: canvasTexture.height,
            },
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        return this;
    }

    public beginDraw(): void {
        if (!Array.isArray(this.components) || !this.components[0]?.part?.render?.webgpu?.device || !this.components[0].part.render.webgpu.canvasContext || !this.depthTexture) {
            console.error('Exit doDraw: device or canvasContext undefined');
            return;
        }
        this.commandEncoder = this.components[0].part.render.webgpu.device.createCommandEncoder();
        this.passEncoder = this.commandEncoder.beginRenderPass(
            {
                colorAttachments: [
                    {
                        view: this.components[0].part.render.webgpu.canvasContext.getCurrentTexture().createView(),
                        clearValue: { r: 0, g: 0, b: 0, a: 1 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
                depthStencilAttachment:
                {
                    view: this.depthTexture.createView(),

                    depthClearValue: 1,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',

                    stencilClearValue: 0,
                    stencilLoadOp: 'clear',
                    stencilStoreOp: 'store',
                },
            },
        );
    }

    public doDraw(): boolean {
        if (!Array.isArray(this.components) || !this.passEncoder) {
            console.error('Exit doDraw: passEncoder undefined');
            return false;
        }
        for (const component of this.components) {
            const flag = component.draw(this.passEncoder);
            if (flag == InitStatus.FAIL) { return false; }
        }
        return true;
    }

    public endDraw(): void {
        if (!Array.isArray(this.components) || !this.components[0]?.part?.render?.webgpu?.device || !this.passEncoder || !this.commandEncoder) {
            console.error('Exit doDraw: device, passEncoder or commandEncoder undefined');
            return;
        }
        this.passEncoder.end();
        this.components[0].part.render.webgpu.device.queue.submit([this.commandEncoder.finish()]);
    }

    public drawCanvas(): void {
        this.beginDraw();
        const flag = this.doDraw();
        this.endDraw();
        if (!flag) {
            return;
        }
        window.requestAnimationFrame(() => this.drawCanvas());
    }

}

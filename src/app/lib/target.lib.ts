import { Render } from "./model.lib";

export class Target {
    private render: Render;
    private commandEncoder: GPUCommandEncoder | null;
    private passEncoder: GPURenderPassEncoder | null;

    constructor(render: Render) {
        this.render = render;
        this.commandEncoder = null;
        this.passEncoder = null;
    }

    public beginDraw(): void {
        this.commandEncoder = this.render.webgpu.device.createCommandEncoder();
        this.passEncoder = this.commandEncoder.beginRenderPass(
            {
                colorAttachments: [
                    {
                        view: this.render.webgpu.context.getCurrentTexture().createView(),
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    }
                ]
            })
    }

    public doDraw(): void {
        if (!this.passEncoder) {
            alert('passEncoder is null');
            return;
        }
        this.passEncoder.setPipeline(this.render.pipeline);
        this.passEncoder.draw(3);
    };

    public endDraw(): void {
        if (!this.passEncoder || !this.commandEncoder) {
            alert('passEncoder or commandEncoder is null');
            return;
        }
        this.passEncoder.end();
        this.render.webgpu.device.queue.submit([this.commandEncoder.finish()]);
    };

}

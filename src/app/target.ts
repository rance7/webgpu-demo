import { Component } from './component';

export class Target {

    public depthTexture?: GPUTexture;

    public pickupTexture?: GPUTexture;

    public pickupDepthTexture?: GPUTexture;

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

        this.pickupTexture = this.components[0].part.render.webgpu.device.createTexture({
            size: {
                width: 1,
                height: 1,
            },
            format: 'r32uint',
            usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.pickupDepthTexture = this.components[0].part.render.webgpu.device.createTexture({
            size: {
                width: 1,
                height: 1,
            },
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        return this;
    }

    public async doDraw(): Promise<void> {
        if (!Array.isArray(this.components) || !this.components[0].part?.render?.webgpu?.device || !this.components[0].part.render.webgpu.canvasContext) {
            console.error('Exit doDraw: passEncoder undefined');
            return;
        }

        if (!this.depthTexture || !this.pickupTexture || !this.pickupDepthTexture) {
            console.error('Exit doDraw: depthTexture, pickupTexture or pickupDepthTexture undefined');
            return;
        }

        const commandEncoder: GPUCommandEncoder = this.components[0].part.render.webgpu.device.createCommandEncoder();
        const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.components[0].part.render.webgpu.canvasContext.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
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
        });
        for (const component of this.components) {
            component.draw(passEncoder);
        }
        passEncoder.end();
        this.components[0].part.render.webgpu.device.queue.submit([commandEncoder.finish()]);

        const pickupCommandEncoder: GPUCommandEncoder = this.components[0].part.render.webgpu.device.createCommandEncoder();
        const pickupPassEncoder: GPURenderPassEncoder = pickupCommandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.pickupTexture.createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 0 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
            depthStencilAttachment:
            {
                view: this.pickupDepthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        });
        for (const component of this.components) {
            await component.drawId(pickupCommandEncoder, this.pickupTexture, pickupPassEncoder);
        }
        pickupPassEncoder.end();
        this.components[0].part.render.webgpu.device.queue.submit([pickupCommandEncoder.finish()]);

        window.requestAnimationFrame(async () => this.doDraw());
    }

}

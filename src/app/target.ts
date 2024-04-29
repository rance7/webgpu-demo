import { Component } from './component';
import { getModelViewProjectionMatrix } from './lib/camera.lib';
import { PerspectiveController } from './perspective-controller';

export class Target {

    public passEncoder?: GPURenderPassEncoder;

    public commandEncoder?: GPUCommandEncoder;

    public pickupCommandEncoder?: GPUCommandEncoder;

    public pickupPassEncoder?: GPURenderPassEncoder;

    public depthTexture!: GPUTexture;

    public pickupTexture!: GPUTexture;

    public pickupDepthTexture!: GPUTexture;

    public perspectiveController!: PerspectiveController;

    public components!: Array<Component>;

    public constructor(components: Array<Component>) {
        this.components = components;
        if (!this.components[0]?.part?.render?.webgpu?.device || !this.components[0].part.render.webgpu.canvasContext || !this.components[0].part.render.webgpu.canvas) {
            console.error('Exit doDraw: device, canvas or canvasContext undefined');
            return;
        }
        this.perspectiveController = new PerspectiveController(this.components[0].part.render.webgpu.canvas);
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
                width: this.components[0].part.render.webgpu.canvas.width,
                height: this.components[0].part.render.webgpu.canvas.height,
            },
            format: 'r32uint',
            usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.pickupDepthTexture = this.components[0].part.render.webgpu.device.createTexture({
            size: {
                width: this.components[0].part.render.webgpu.canvas.width,
                height: this.components[0].part.render.webgpu.canvas.height,
            },
            format: 'depth24plus',
            usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    public async doDraw(): Promise<void> {
        if (!this.components[0].part?.render?.webgpu?.device || !this.components[0].part.render.webgpu.canvasContext
            || !this.components[0].part.render.pipeline || !this.components[0].part.render.pickupPipeline) {
            console.error('Exit doDraw: passEncoder undefined');
            return;
        }

        this.commandEncoder = this.components[0].part.render.webgpu.device.createCommandEncoder();
        this.passEncoder = this.commandEncoder.beginRenderPass({
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
        this.passEncoder.setPipeline(this.components[0].part.render.pipeline);
        for (const component of this.components) {
            this.draw(component);
        }
        this.passEncoder.end();
        this.components[0].part.render.webgpu.device.queue.submit([this.commandEncoder.finish()]);
        await this.components[0].part.render.webgpu.device.queue.onSubmittedWorkDone();

        this.pickupCommandEncoder = this.components[0].part.render.webgpu.device.createCommandEncoder();
        this.pickupPassEncoder = this.pickupCommandEncoder.beginRenderPass({
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
        this.pickupPassEncoder.setPipeline(this.components[0].part.render.pickupPipeline);
        for (const component of this.components) {
            await this.drawId(component);
        }
        this.pickupPassEncoder.end();
        this.components[0].part.render.webgpu.device.queue.submit([this.pickupCommandEncoder.finish()]);
        await this.components[0].part.render.webgpu.device.queue.onSubmittedWorkDone();

        window.requestAnimationFrame(async () => this.doDraw());
    }

    public draw(component: Component): void {
        if (!component.bindGroup || !component.part?.render?.pipeline || !component.part.vertexNumber || !component.part.vertexBuffer) {
            console.error('Exit camera1: bindGroup, pipeline, vertexNumber or vertexBuffer undefined');
            return;
        }

        if (!component.uniformBuffer || !component.part.render.webgpu?.canvas || !this.passEncoder) {
            console.error('Exit camera: uniformBuffer, canvas or passEncoder undefined');
            return;
        }

        const now = Date.now();
        const deltaTime = (now - this.perspectiveController.lastFrameTime) / 1000;
        this.perspectiveController.lastFrameTime = now;
        const aspect = component.part.render.webgpu.canvas.width / component.part.render.webgpu.canvas.height;
        const modelViewProjection = getModelViewProjectionMatrix(deltaTime, this.perspectiveController.cameras[this.perspectiveController.cameraParams.type], this.perspectiveController.inputHandler, aspect);

        component.part.render.webgpu.device?.queue.writeBuffer(
            component.uniformBuffer,
            0,
            modelViewProjection.buffer,
            modelViewProjection.byteOffset,
            modelViewProjection.byteLength,
        );

        this.passEncoder.setVertexBuffer(0, component.part.vertexBuffer);
        this.passEncoder.setBindGroup(0, component.bindGroup);
        this.passEncoder.draw(component.part.vertexNumber);
    }

    public async drawId(component: Component): Promise<void> {
        if (!component.part?.render?.pipeline || !component.part.vertexNumber || !component.part.vertexBuffer || !component.bindGroup) {
            console.error('Exit camera: pipeline, vertexNumber, vertexBuffer or bindGroup undefined');
            return;
        }

        if (!component.part?.render?.webgpu?.device || !component.part.render.pickupPipeline || !component.pickupBindgroup) {
            console.error('Exit camera: device, pickupPipeline or pickBindgroup undefined');
            return;
        }

        if (!this.pickupPassEncoder || !this.pickupCommandEncoder) {
            console.error('Exit camera: pickupPassEncoder or pickupCommandEncoder undefined');
            return;
        }

        if (this.perspectiveController.mouseX < 0 || this.perspectiveController.mouseY < 0) {
            return;
        }

        const pickupBuffer: GPUBuffer = component.part.render.webgpu.device.createBuffer({
            size: Uint32Array.BYTES_PER_ELEMENT * 4,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });

        this.pickupPassEncoder.setVertexBuffer(0, component.part.vertexBuffer);
        this.pickupPassEncoder.setBindGroup(0, component.pickupBindgroup);
        this.pickupPassEncoder.draw(component.part.vertexNumber);

        this.pickupCommandEncoder.copyTextureToBuffer({
            texture: this.pickupTexture,
            origin: {
                x: this.perspectiveController.mouseX,
                y: this.perspectiveController.mouseY,
            },
        }, {
            buffer: pickupBuffer,
            offset: 0,
            bytesPerRow: Uint32Array.BYTES_PER_ELEMENT * 16 * 4,
            rowsPerImage: 1,
        }, {
            width: 1,
            height: 1,
        });

        await pickupBuffer.mapAsync(GPUMapMode.READ, 0, Uint32Array.BYTES_PER_ELEMENT * 4);
        const ids: Uint32Array = new Uint32Array(pickupBuffer.getMappedRange(0, Uint32Array.BYTES_PER_ELEMENT * 4));
        const id: number = ids[0];
        console.log(id);
        pickupBuffer.unmap();
        const pickupInfoElem: HTMLElement | null = document.querySelector('#pickup');
        if (!pickupInfoElem || !component.pickUniformBuffer) {
            console.error('Exit drawId: pickupInfoElem or pickupUniformBuffer undefined');
            return;
        }
        component.part.render.webgpu.device.queue.writeBuffer(
            component.pickUniformBuffer,
            0,
            component.pickupUniformId.buffer,
            component.pickupUniformId.byteOffset,
            component.pickupUniformId.byteLength,
        );
        pickupInfoElem.textContent = `obj#: ${id || 'none'}`;
    }

}

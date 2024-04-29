import { Component } from './component';
import { CURRENT_COMPONENT, SELECTED_COMPONENT } from './lib';
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

    public currentComonentId: number = 0;

    public seletedComponentId: number = 0;

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
            format: 'depth24plus',
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
        this.drawComponents();
        await this.drawIds();
        window.requestAnimationFrame(async () => this.doDraw());
    }

    public drawComponents(): void {
        if (!this.components[0].part?.render?.webgpu?.device || !this.components[0].part.render.webgpu.canvasContext || !this.components[0].part.render.pipeline) {
            console.error('Exit drawComponents: device, canvasContext or pipeline undefined');
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
            },
        });

        this.passEncoder.setPipeline(this.components[0].part.render.pipeline);
        for (const component of this.components) {
            this.drawComponent(component);
        }
        this.passEncoder.end();
        this.components[0].part.render.webgpu.device.queue.submit([this.commandEncoder.finish()]);
    }

    public async drawIds(): Promise<void> {
        if (!this.components[0].part?.render?.webgpu?.device || !this.components[0].part.render.pickupPipeline) {
            console.error('Exit drawIds: device or pickupPipeline undefined');
            return;
        }

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

        const pickupBuffer: GPUBuffer = this.components[0].part.render.webgpu.device.createBuffer({
            size: Uint32Array.BYTES_PER_ELEMENT * 4,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });

        this.pickupPassEncoder.setPipeline(this.components[0].part.render.pickupPipeline);
        for (const component of this.components) {
            this.drawId(component);
        }
        this.pickupPassEncoder.end();

        if (this.perspectiveController.mouseX < 0 || this.perspectiveController.mouseY < 0) {
            return;
        }
        this.pickupCommandEncoder.copyTextureToBuffer({
            texture: this.pickupTexture,
            origin: {
                x: this.perspectiveController.mouseX,
                y: this.perspectiveController.mouseY,
            },
        }, {
            buffer: pickupBuffer,
            offset: 0,
            bytesPerRow: 256,
            rowsPerImage: 1,
        }, {
            width: 1,
            height: 1,
        });
        this.components[0].part.render.webgpu.device.queue.submit([this.pickupCommandEncoder.finish()]);

        await pickupBuffer.mapAsync(GPUMapMode.READ, 0, Uint32Array.BYTES_PER_ELEMENT * 4);
        const ids: Uint32Array = new Uint32Array(pickupBuffer.getMappedRange(0, Uint32Array.BYTES_PER_ELEMENT * 4));
        this.currentComonentId = ids[0];
        pickupBuffer.unmap();

        const currentElem: HTMLElement | null = document.querySelector(CURRENT_COMPONENT);
        if (currentElem) {
            currentElem.textContent = `current-elem#: ${this.currentComonentId || 'none'}`;
        }

        const selectedElem: HTMLElement | null = document.querySelector(SELECTED_COMPONENT);
        if (selectedElem) {
            selectedElem.textContent = `selected-elem#: ${this.seletedComponentId || 'none'}`;
        }
    }

    public drawComponent(component: Component): void {
        if (!component.bindGroup || !component.part?.vertexNumber || !component.part.vertexBuffer) {
            console.error('Exit camera: bindGroup, vertexNumber or vertexBuffer undefined');
            return;
        }

        if (!component.uniformBuffer || !component.part.render?.webgpu?.canvas || !this.passEncoder) {
            console.error('Exit camera: uniformBuffer, canvas or passEncoder undefined');
            return;
        }

        const now = Date.now();
        const deltaTime = (now - this.perspectiveController.lastFrameTime) / 1000;
        this.perspectiveController.lastFrameTime = now;
        const aspect = component.part.render.webgpu.canvas.width / component.part.render.webgpu.canvas.height;
        const modelViewProjection: Float32Array = getModelViewProjectionMatrix(deltaTime, this.perspectiveController.cameras[this.perspectiveController.cameraParams.type], this.perspectiveController.inputHandler, aspect);

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

    public drawId(component: Component): void {
        if (!component.part?.vertexNumber || !component.part.vertexBuffer) {
            console.error('Exit camera: vertexNumber or vertexBuffer undefined');
            return;
        }

        if (!this.pickupPassEncoder || !component.part?.render?.pickupPipeline || !component.pickupBindgroup) {
            console.error('Exit camera: pickupPassEncoder, pickupPipeline or pickBindgroup undefined');
            return;
        }

        this.pickupPassEncoder.setBindGroup(0, component.pickupBindgroup);
        this.pickupPassEncoder.setVertexBuffer(0, component.part.vertexBuffer);
        this.pickupPassEncoder.draw(component.part.vertexNumber);
    }

}

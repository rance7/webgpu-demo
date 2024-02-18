/* eslint-disable no-alert */
import { Component, Render, Target } from './lib/model.lib';

export function initTarget(render: Render, commandEncoder?: GPUCommandEncoder, passEncoder?: GPURenderPassEncoder): Target {
    return { render, commandEncoder, passEncoder };
}

export function beginDraw(target: Target): void {
    target.commandEncoder = target.render.webgpu.device.createCommandEncoder();
    target.passEncoder = target.commandEncoder.beginRenderPass(
        {
            colorAttachments: [
                {
                    view: target.render.webgpu.context.getCurrentTexture().createView(),
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        },
    );
}

export function doDraw(target: Target, component: Component): void {
    if (!target.passEncoder) {
        alert('passEncoder is null');
        return;
    }
    target.passEncoder.setPipeline(component.part.render.pipeline);
    target.passEncoder.setVertexBuffer(0, component.part.vertexBuffer);
    target.passEncoder.draw(component.part.vertexNumber);
}

export function endDraw(target: Target): void {
    if (!target?.passEncoder || !target.commandEncoder) {
        alert('passEncoder or commandEncoder is null');
        return;
    }
    target.passEncoder.end();
    target.render.webgpu.device.queue.submit([target.commandEncoder.finish()]);
}

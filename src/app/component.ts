import { initStatus } from './lib/model.lib';
import { Part } from './part';

export class Component {

    public uniformBuffer: GPUBuffer | undefined;

    public bindGroup: GPUBindGroup | undefined;

    public part: Part | undefined;

    public initComponent(part: Part): initStatus {
        this.part = part;
        if (!part?.render?.webgpu?.device || !part.render.bindGroupLayout) {
            console.error('Exit constructComponet: device or bindGroupLayout undefined');
            return initStatus.fail;
        }
        this.uniformBuffer = part.render.webgpu.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * (16 + 4),
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.bindGroup = part.render.webgpu.device.createBindGroup({
            layout: part.render.bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.uniformBuffer },
                },
            ],
        });

        return initStatus.success;
    }

    public rotate(passEncoder: GPURenderPassEncoder): void {
        if (!this.part?.render?.webgpu?.device || !this.part.render.bindGroupLayout) {
            console.error('Exit constructComponet: device or bindGroupLayout undefined');
            return;
        }
        const timeCycle: number = 5000;
        // eslint-disable-next-line id-length
        const p: number = (Date.now() % timeCycle) / timeCycle;
        const cosV: number = Math.cos(2 * Math.PI * p);
        const sinV: number = Math.sin(2 * Math.PI * p);

        if (!this.part.render.pipeline || !this.uniformBuffer || !this.part.vertexBuffer || !this.bindGroup || !this.part.vertexNumber) {
            console.error('Exit constructComponet: pipeline, uniformBuffer, vertexBuffer, bindGroup or vertexNumber undefined');
            return;
        }
        this.part.render.webgpu.device.queue.writeBuffer(
            this.uniformBuffer, 0,
            new Float32Array([
                sinV, 0, cosV, 0,
                0, 1, 0, 0,
                cosV, 0, -sinV, 0,
                0, 0, 0.5, 1,
                p, p, p, 1,
            ]),
        );
        passEncoder.setPipeline(this.part.render.pipeline);
        passEncoder.setVertexBuffer(0, this.part.vertexBuffer);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.draw(this.part.vertexNumber);
    }

}

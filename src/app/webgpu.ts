/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { CANVAS_ID, convertNullToUndefined } from './lib';

export class Webgpu {

    public gpu?: GPU;

    public device?: GPUDevice;

    public canvas?: HTMLCanvasElement;

    public canvasContext?: GPUCanvasContext;

    public commandEncoder?: GPUCommandEncoder;

    public renderPassEncoder?: GPURenderPassEncoder;

    public async initWebgpu(): Promise<this> {
        if (!Reflect.has(window.navigator, 'gpu')) {
            console.error('Exit initWebgpu: No gpu available');
            return this;
        }

        this.gpu = window.navigator.gpu;
        const gpuAdapter: GPUAdapter | null = await this.gpu.requestAdapter();
        if (!gpuAdapter) {
            console.error('Exit initWebgpu: Fail to get gpu adapter');
            return this;
        }

        this.device = await gpuAdapter.requestDevice();
        if (!this.device) {
            console.error('Exit initWebgpu: Fail to get device');
            return this;
        }

        this.canvas = convertNullToUndefined(document.querySelector(CANVAS_ID));
        if (!this.canvas) {
            console.error(`Exit initWebgpu: No canvas with id ${CANVAS_ID}`);
            return this;
        }

        this.canvasContext = convertNullToUndefined(this.canvas.getContext('webgpu'));
        if (!this.canvasContext) {
            console.error('Exit initWebgpu: Fail to get canvas context');
            return this;
        }

        this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
        this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
        this.canvasContext.configure({
            device: this.device,
            format: this.gpu.getPreferredCanvasFormat(),
            usage: GPUTextureUsage.COPY_DST + GPUTextureUsage.RENDER_ATTACHMENT,
            alphaMode: 'premultiplied',
        });
        return this;
    }

    public destroy(): void {
        this.gpu = undefined;
        this.device = undefined;
        this.canvas = undefined;
        this.canvasContext = undefined;
        this.commandEncoder = undefined;
        this.renderPassEncoder = undefined;
    }

}

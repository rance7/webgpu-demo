/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { CANVAS_ID, convertNullToUndefined } from './lib';

export class Webgpu {

    public gpu?: GPU;

    public gpuAdapter?: GPUAdapter | null;

    public device?: GPUDevice;

    public canvas?: HTMLCanvasElement;

    public canvasContext?: GPUCanvasContext;

    public async initWebgpu(): Promise<this> {
        if (!Reflect.has(window.navigator, 'gpu')) {
            console.error('no gpu available');
            return this;
        }

        this.gpu = window.navigator.gpu;
        this.gpuAdapter = await this.gpu.requestAdapter();
        if (!this.gpuAdapter) {
            console.error('fail to get gpu adapter');
            return this;
        }

        this.device = await this.gpuAdapter.requestDevice();
        if (!this.device) {
            console.error('fail to get device');
            return this;
        }

        this.canvas = convertNullToUndefined(document.querySelector(CANVAS_ID));
        if (!this.canvas) {
            console.error(`no canvas with id ${CANVAS_ID}`);
            return this;
        }

        this.canvasContext = convertNullToUndefined(this.canvas.getContext('webgpu'));
        if (!this.canvasContext) {
            console.error('fail to get canvas context');
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

}

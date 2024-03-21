/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { CANVAS_ID, convertNullToUndefined } from './lib';
import { initStatus } from './lib/model.lib';

export class Webgpu {

    public gpu?: GPU;

    public gpuAdapter?: GPUAdapter | null;

    public device?: GPUDevice;

    public canvas?: HTMLCanvasElement;

    public canvasContext?: GPUCanvasContext;

    public isConstructed(): initStatus {
        if (!this.gpu || !this.gpuAdapter || !this.device || this.canvasContext) {
            return initStatus.FAIL;
        }

        return initStatus.OK;
    }

    public async initWebgpu(): Promise<initStatus> {
        if (!Reflect.has(window.navigator, 'gpu')) {
            console.error('no gpu available');
            return initStatus.FAIL;
        }

        this.gpu = window.navigator.gpu;
        this.gpuAdapter = await this.gpu.requestAdapter();
        if (!this.gpuAdapter) {
            console.error('fail to get gpu adapter');
            return initStatus.FAIL;
        }

        this.device = await this.gpuAdapter.requestDevice();
        if (!this.device) {
            console.error('fail to get device');
            return initStatus.FAIL;
        }

        this.canvas = convertNullToUndefined(document.querySelector(CANVAS_ID));
        if (!this.canvas) {
            console.error(`no canvas with id ${CANVAS_ID}`);
            return initStatus.FAIL;
        }

        this.canvasContext = convertNullToUndefined(this.canvas.getContext('webgpu'));
        if (!this.canvasContext) {
            console.error('fail to get canvas context');
            return initStatus.FAIL;
        }

        this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
        this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
        this.canvasContext.configure({
            device: this.device,
            format: this.gpu.getPreferredCanvasFormat(),
            usage: GPUTextureUsage.COPY_DST + GPUTextureUsage.RENDER_ATTACHMENT,
            alphaMode: 'premultiplied',
        });
        return initStatus.OK;
    }

}

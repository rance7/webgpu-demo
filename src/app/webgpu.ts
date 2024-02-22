/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { CANVAS_ID, convertNullToUndefined } from './lib';
import { initStatus } from './lib/model.lib';

export class Webgpu {

    public gpu: GPU | undefined;

    public gpuAdapter: GPUAdapter | null | undefined;

    public device: GPUDevice | undefined;

    public canvasContext: GPUCanvasContext | undefined;

    public isConstructed(): initStatus {
        if (!this.gpu || !this.gpuAdapter || !this.device || this.canvasContext) {
            return initStatus.fail;
        }

        return initStatus.success;
    }

    public async initWebgpu(): Promise<initStatus> {
        if (!Reflect.has(window.navigator, 'gpu')) {
            console.error('no gpu available');
            return initStatus.fail;
        }

        this.gpu = window.navigator.gpu;
        this.gpuAdapter = await this.gpu.requestAdapter();
        if (!this.gpuAdapter) {
            console.error('fail to get gpu adapter');
            return initStatus.fail;
        }

        this.device = await this.gpuAdapter.requestDevice();
        if (!this.device) {
            console.error('fail to get device');
            return initStatus.fail;
        }

        const canvas: HTMLCanvasElement | null = document.querySelector(CANVAS_ID);
        if (!canvas) {
            console.error(`no canvas with id ${CANVAS_ID}`);
            return initStatus.fail;
        }

        this.canvasContext = convertNullToUndefined(canvas.getContext('webgpu'));
        if (!this.canvasContext) {
            console.error('fail to get canvas context');
            return initStatus.fail;
        }

        canvas.width = canvas.clientWidth * window.devicePixelRatio;
        canvas.height = canvas.clientHeight * window.devicePixelRatio;
        this.canvasContext.configure({
            device: this.device,
            format: this.gpu.getPreferredCanvasFormat(),
            usage: GPUTextureUsage.COPY_DST + GPUTextureUsage.RENDER_ATTACHMENT,
            alphaMode: 'premultiplied',
        });
        return initStatus.success;
    }

}

import { WebGPU } from './lib/model.lib';

export async function initWebgpu(): Promise<WebGPU | null> {
    if (!Reflect.has(window.navigator, 'gpu')) {
        return null;
    }

    const gpu: GPU = window.navigator.gpu;
    const adapter: GPUAdapter | null = await gpu.requestAdapter();
    const device: GPUDevice | undefined = await adapter?.requestDevice();

    const canvas: HTMLCanvasElement | null = document.querySelector('#my_canvas');
    if (!adapter || !device || !canvas) { return null; }

    const context: GPUCanvasContext | null = canvas?.getContext('webgpu');
    if (!context) { return null; }

    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    context.configure({
        device,
        format: gpu.getPreferredCanvasFormat(),
        usage: GPUTextureUsage.COPY_DST + GPUTextureUsage.RENDER_ATTACHMENT,
        alphaMode: 'premultiplied',
    });

    return { canvas, gpu, adapter, device, context };
}

import { WebGPU } from './lib/model.lib';

export async function initWebgpu(): Promise<WebGPU | null> {
    const { gpu } = navigator;
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!gpu) { return null; }
    const adapter: GPUAdapter | null = await gpu.requestAdapter();
    if (!adapter) { return null; }
    const device: GPUDevice = await adapter.requestDevice();

    const canvas: HTMLCanvasElement | null = document.querySelector('canvas');
    if (!canvas) { return null; }
    const context: GPUCanvasContext | null = canvas.getContext('webgpu');
    if (!context) { return null; }

    const { devicePixelRatio } = window;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const presentationFormat: GPUTextureFormat = gpu.getPreferredCanvasFormat();

    context.configure({
        device,
        format: presentationFormat,
        usage: GPUTextureUsage.COPY_DST + GPUTextureUsage.RENDER_ATTACHMENT,
        alphaMode: 'premultiplied',
    });

    return { canvas, gpu, adapter, device, context };
}

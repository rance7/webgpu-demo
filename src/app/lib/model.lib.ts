export interface WebGPU {
    canvas: HTMLCanvasElement;
    gpu: GPU;
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
}

export interface Render {
    webgpu: WebGPU;
    pipeline: GPURenderPipeline;
}

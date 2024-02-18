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

export interface Part {
    render: Render;
    vertexBuffer: GPUBuffer;
    vertexNumber: number;
}

export interface Component {
    part: Part;
}

export interface Target {
    render: Render;
    commandEncoder: GPUCommandEncoder | undefined;
    passEncoder: GPURenderPassEncoder | undefined;
}

import { Render, WebGPU } from './lib/model.lib';

export async function initRender(webgpu: WebGPU): Promise<Render | null> {
    const shaderContent: string = await fetch('./assets/shader.txt').then(async (res: Response) => res.text());
    const shaderModule: GPUShaderModule = webgpu.device.createShaderModule({ code: shaderContent });

    const pipeline: GPURenderPipeline = webgpu.device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: shaderModule,
            entryPoint: 'vertex_main',
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fragment_main',
            targets: [
                {
                    format: webgpu.gpu.getPreferredCanvasFormat(),
                },
            ],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });

    return { webgpu, pipeline };
}

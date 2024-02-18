import { Render, WebGPU } from './app/lib/model.lib';

export async function initRender(webgpu: WebGPU): Promise<Render | null> {
    const response: Response = await fetch('./assets/shader.txt', { cache: 'no-cache' });
    if (!response.ok) {
        alert(`execute shader fetch, status is ${response.status}`);
        return null;
    }
    const shader: string = await response.text();
    const shaderModule: GPUShaderModule = webgpu.device.createShaderModule({ code: shader });

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

    return { webgpu: webgpu, pipeline: pipeline };
}

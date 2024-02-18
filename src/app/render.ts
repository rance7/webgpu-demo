import { Render, WebGPU } from './lib/model.lib';

export async function initRender(webgpu: WebGPU): Promise<Render | null> {
    const shaderContent: string = await fetch('./assets/shader2.txt', { cache: 'no-cache' }).then(async (res: Response) => res.text());
    const shaderModule: GPUShaderModule = webgpu.device.createShaderModule({ code: shaderContent });

    const pipeline: GPURenderPipeline = webgpu.device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: shaderModule,
            entryPoint: 'vertex_main',
            buffers: [{
                arrayStride: Float32Array.BYTES_PER_ELEMENT * 8,
                stepMode: 'vertex',
                attributes: [{
                    // vertex
                    format: 'float32x4',
                    offset: 0,
                    shaderLocation: 0,
                }, {
                    // texture
                    format: 'float32x4',
                    offset: Float32Array.BYTES_PER_ELEMENT * 4,
                    shaderLocation: 1,
                }],
            }],
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

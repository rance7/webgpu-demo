import { SHADER_PATH, getShader } from './lib';
import { initStatus } from './lib/model.lib';
import { Webgpu } from './webgpu';

export class Render {

    public bindGroupLayoutEntries!: Array<GPUBindGroupLayoutEntry>;

    public bindGroupLayout: GPUBindGroupLayout | undefined;

    public pipelineLayout: GPUPipelineLayout | undefined;

    public pipeline: GPURenderPipeline | undefined;

    public shaderModule: GPUShaderModule | undefined;

    public webgpu: Webgpu | undefined;

    public async initRender(webgpu: Webgpu): Promise<initStatus> {
        this.webgpu = webgpu;
        this.bindGroupLayoutEntries = [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                buffer: {
                    type: 'uniform',
                    hasDynamicOffset: false,
                },
            },
        ];

        if (!webgpu.device) {
            console.error('Exit initRender: device undefined');
            return initStatus.fail;
        }

        this.bindGroupLayout = webgpu.device.createBindGroupLayout({
            entries: this.bindGroupLayoutEntries,
        });

        this.pipelineLayout = webgpu.device.createPipelineLayout({
            bindGroupLayouts: [this.bindGroupLayout],
        });

        if (!this.webgpu?.device || !this.webgpu.gpu) {
            console.error('Exit initRender: webgpu or gpu undefined');
            return initStatus.fail;
        }

        const shaderContent: string | null = await getShader(SHADER_PATH);
        if (!shaderContent) {
            console.error('Exit initRender: get shader content failed');
            return initStatus.fail;
        }

        this.shaderModule = this.webgpu.device.createShaderModule({ code: shaderContent });

        this.pipeline = this.webgpu.device.createRenderPipeline({
            layout: this.pipelineLayout,
            vertex: {
                module: this.shaderModule,
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
                module: this.shaderModule,
                entryPoint: 'fragment_main',
                targets: [
                    {
                        format: this.webgpu.gpu.getPreferredCanvasFormat(),
                    },
                ],
            },
            primitive: {
                topology: 'triangle-list',
            },
        });
        return initStatus.success;
    }

}

import { getShaderContent } from './lib';
import { initStatus } from './lib/model.lib';
import { Webgpu } from './webgpu';

export class Render {

    public bindGroupLayoutEntries!: Array<GPUBindGroupLayoutEntry>;

    public bindGroupLayout?: GPUBindGroupLayout;

    public pipelineLayout?: GPUPipelineLayout;

    public pipeline?: GPURenderPipeline;

    public shaderModule?: GPUShaderModule;

    public webgpu?: Webgpu;

    public async initRender(webgpu: Webgpu): Promise<initStatus> {
        this.webgpu = webgpu;
        this.bindGroupLayoutEntries = [
            // component_information
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer:
                {
                    type: 'uniform',
                    hasDynamicOffset: false,
                },
            },

            // texture
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                texture: {},
            },

            // sampler
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                sampler: {},
            },
        ];

        if (!this.webgpu.device || !this.webgpu.gpu) {
            console.error('Exit initRender: device or gpu undefined');
            return initStatus.FAIL;
        }

        this.bindGroupLayout = this.webgpu.device.createBindGroupLayout({
            entries: this.bindGroupLayoutEntries,
        });

        this.pipelineLayout = this.webgpu.device.createPipelineLayout({
            bindGroupLayouts: [this.bindGroupLayout],
        });

        const shaderContent: string | null = await getShaderContent('./assets/shader.txt');
        if (!shaderContent) {
            console.error('Exit initRender: get shader content failed');
            return initStatus.FAIL;
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
            depthStencil: {
                format: 'depth24plus-stencil8',
                depthWriteEnabled: true,
                depthCompare: 'less',
                stencilFront: {},
                stencilBack: {},
                stencilReadMask: 0x01,
                stencilWriteMask: 0x01,
            },
        });
        return initStatus.OK;
    }

}

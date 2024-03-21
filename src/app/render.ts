import { SHADER_PATH, getFileContent } from './lib';
import { RenderParams } from './lib/model.lib';
import { Webgpu } from './webgpu';

export class Render {

    public bindGroupLayoutEntries?: Array<GPUBindGroupLayoutEntry>;

    public bindGroupLayout?: GPUBindGroupLayout;

    public pipelineLayout?: GPUPipelineLayout;

    public pipeline?: GPURenderPipeline;

    public shaderModule?: GPUShaderModule;

    public renderParams!: RenderParams;

    public webgpu?: Webgpu;

    public async initRender(webgpu: Webgpu, renderParams: RenderParams): Promise<this> {
        this.webgpu = webgpu;
        this.renderParams = renderParams;
        if (!this.webgpu.device || !this.webgpu.gpu) {
            console.error('Exit initRender: device or gpu undefined');
            return this;
        }

        const shaderContent: string | null = await getFileContent(SHADER_PATH);
        if (!shaderContent) {
            console.error('Exit initRender: get shader content failed');
            return this;
        }

        this.shaderModule = this.webgpu.device.createShaderModule({ code: shaderContent });

        this.pipeline = this.webgpu.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                buffers: [{
                    arrayStride: Float32Array.BYTES_PER_ELEMENT * renderParams.ArrayStride,
                    attributes:
                        [
                            {
                                // position
                                format: 'float32x4',
                                offset: renderParams.PositionOffset,
                                shaderLocation: 0,
                            },
                            {
                                // uv
                                format: 'float32x2',
                                offset: Float32Array.BYTES_PER_ELEMENT * renderParams.UVOffset,
                                shaderLocation: 1,
                            },
                        ],
                }],
            },
            fragment: {
                module: this.shaderModule,
                targets: [
                    {
                        format: this.webgpu.gpu.getPreferredCanvasFormat(),
                    },
                ],
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
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
        return this;
    }

}

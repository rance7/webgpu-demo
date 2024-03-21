import { SHADER_PATH, getFileContent } from './lib';
import { Webgpu } from './webgpu';

export class Render {

    public bindGroupLayoutEntries?: Array<GPUBindGroupLayoutEntry>;

    public bindGroupLayout?: GPUBindGroupLayout;

    public pipelineLayout?: GPUPipelineLayout;

    public pipeline?: GPURenderPipeline;

    public shaderModule?: GPUShaderModule;

    public webgpu?: Webgpu;

    public async initRender(webgpu: Webgpu): Promise<this> {
        this.webgpu = webgpu;
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
                    arrayStride: Float32Array.BYTES_PER_ELEMENT * 10,
                    attributes:
                        [
                            {
                                // texture
                                format: 'float32x4',
                                offset: 0,
                                shaderLocation: 0,
                            },
                            {
                                // coord
                                format: 'float32x2',
                                offset: Float32Array.BYTES_PER_ELEMENT * 8,
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

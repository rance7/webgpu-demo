import { SHADER_PATH, getFileContent } from './lib';
import { RenderParams } from './lib/model.lib';
import { Webgpu } from './webgpu';

export class Render {

    public pipeline?: GPURenderPipeline;

    public pickupPipeline?: GPURenderPipeline;

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
                entryPoint: 'VertexMain',
                buffers: [{
                    arrayStride: Float32Array.BYTES_PER_ELEMENT * this.renderParams.arrayStride,
                    attributes:
                        [
                            {
                                // position
                                format: 'float32x4',
                                offset: this.renderParams.positionOffset,
                                shaderLocation: 0,
                            },
                            {
                                // uv
                                format: 'float32x2',
                                offset: Float32Array.BYTES_PER_ELEMENT * this.renderParams.uvOffset,
                                shaderLocation: 1,
                            },
                        ],
                }],
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: 'FragmentMain',
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
                format: 'depth24plus',
                depthWriteEnabled: true,
                depthCompare: 'less',
            },
        });

        this.pickupPipeline = this.webgpu.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                entryPoint: 'VertexMain',
                buffers: [{
                    arrayStride: Float32Array.BYTES_PER_ELEMENT * this.renderParams.arrayStride,
                    attributes:
                        [
                            {
                                // position
                                format: 'float32x4',
                                offset: this.renderParams.positionOffset,
                                shaderLocation: 0,
                            },
                            {
                                // uv
                                format: 'float32x2',
                                offset: Float32Array.BYTES_PER_ELEMENT * this.renderParams.uvOffset,
                                shaderLocation: 1,
                            },
                        ],
                }],
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: 'FragmentPick',
                targets: [
                    { format: 'r32uint' },
                ],
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            },
        });

        return this;
    }

}

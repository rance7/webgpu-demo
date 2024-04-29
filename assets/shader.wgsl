struct ViewUniform {
  modelViewProjectionMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> viewUniform : ViewUniform;
@group(0) @binding(1) var texture: texture_2d<f32>;
@group(0) @binding(2) var textureSampler: sampler;

struct VertexToFragmentStruct {
  @builtin(position) vertexPosition: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn VertexMain(
    @location(0) position: vec4f,
    @location(1) uv: vec2f
) -> VertexToFragmentStruct {
    return VertexToFragmentStruct(viewUniform.modelViewProjectionMatrix * position, uv);
}

struct PickUniform {
    id: u32,
}

@group(0) @binding(3) var<uniform> pickUniforms : PickUniform;

@fragment
fn FragmentMain(v: VertexToFragmentStruct) -> @location(0) vec4f {
    return textureSample(texture, textureSampler, v.uv);
}

@fragment
fn FragmentPick(v: VertexToFragmentStruct) -> @location(0) u32 {
    return pickUniforms.id;
}
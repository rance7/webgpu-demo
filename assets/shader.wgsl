struct ViewUniform {
  modelViewProjectionMatrix: mat4x4f,
}

struct PickUniform {
    id: u32,
}

@group(0) @binding(0) var<uniform> viewUniform : ViewUniform;
@group(0) @binding(1) var texture: texture_2d<f32>;
@group(0) @binding(1) var<uniform> pickUniform : PickUniform;
@group(0) @binding(2) var textureSampler: sampler;

struct VertexToFragmentStruct {
  @builtin(position) Position: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn VertexMain(
    @location(0) position: vec4f,
    @location(1) uv: vec2f
) -> VertexToFragmentStruct {
    return VertexToFragmentStruct(viewUniform.modelViewProjectionMatrix * position, uv);
}

@fragment
fn FragmentMain(@location(0) uv: vec2f) -> @location(0) vec4f {
    return textureSample(texture, textureSampler, uv);
}

@fragment
fn FragmentPick() -> @location(0) u32 {
    return pickUniform.id;
}
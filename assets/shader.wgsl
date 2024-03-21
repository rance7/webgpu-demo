struct uniform_ {
  modelViewProjectionMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : uniform_;
@group(0) @binding(1) var texture: texture_2d<f32>;
@group(0) @binding(2) var texture_sampler: sampler;

struct vertex_to_fragment_struct {
  @builtin(position) Position : vec4f,
  @location(0) frag_uv : vec2f,
}

@vertex
fn vertex_main(
  @location(0) position : vec4f,
  @location(1) uv : vec2f
) -> vertex_to_fragment_struct {
  return vertex_to_fragment_struct(uniforms.modelViewProjectionMatrix * position, uv);
}

@fragment
fn fragment_main(@location(0) frag_uv: vec2f) -> @location(0) vec4f {
  return textureSample(texture, texture_sampler, frag_uv);
}

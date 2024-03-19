struct component_information {
    rotate_matrix: mat4x4<f32>,
    scale_matrix: mat4x4<f32>,
    location_matrix: mat4x4<f32>,
    width_height: vec4<f32>
};
struct vertex_to_fragment_struct {
    @builtin(position)    vertex_position: vec4<f32>,
    @location(0)        vertex_texture: vec4<f32>
};

struct fragment_to_target_struct {
    @location(0)         fragment_color: vec4<f32>
};

@group(0) @binding(0) var<uniform> component_info    :    component_information;
@group(0) @binding(1) var textur_object                :    texture_2d<f32>;
@group(0) @binding(2) var texture_sampler            :    sampler;

@vertex
fn vertex_main(
    @builtin(vertex_index)        vertex_index: u32,
    @builtin(instance_index)    instance_index: u32
) -> vertex_to_fragment_struct {
    var vf: vertex_to_fragment_struct;

    const squard_point = array<vec4<f32>,6>(
        vec4(0.0, 0.0, 0.0, 0.0), vec4(1.0, 0.0, 0.0, 0.0), vec4(1.0, 1.0, 0.0, 0.0),
        vec4(1.0, 1.0, 0.0, 0.0), vec4(0.0, 1.0, 0.0, 0.0), vec4(0.0, 0.0, 0.0, 0.0)
    );

    vf.vertex_texture = squard_point[vertex_index % 6];
    vf.vertex_texture += vec4(f32(vertex_index / 6), f32(instance_index), 0.0, 1.0);
    vf.vertex_texture /= component_info.width_height;

    vf.vertex_position = vec4(
        sin(radians((1.0 - vf.vertex_texture.y) * 180.0)) * sin(radians(vf.vertex_texture.x * 360.0)),
        cos(radians((1.0 - vf.vertex_texture.y) * 180.0)),
        sin(radians((1.0 - vf.vertex_texture.y) * 180.0)) * cos(radians(vf.vertex_texture.x * 360.0)),
        1.0
    );
    vf.vertex_position = component_info.rotate_matrix * vf.vertex_position;
    vf.vertex_position = component_info.scale_matrix * vf.vertex_position;
    vf.vertex_position = component_info.location_matrix * vf.vertex_position;

    return vf;
}

@fragment
fn fragment_main(vf: vertex_to_fragment_struct) -> fragment_to_target_struct {
    var ft: fragment_to_target_struct;
    ft.fragment_color = textureSample(textur_object, texture_sampler, vf.vertex_texture.xy);
    return ft;
}

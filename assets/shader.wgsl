struct component_information
{
	rotate_matrix				:	mat4x4<f32>,
	scale_matrix				:	mat4x4<f32>,
	location_matrix				:	mat4x4<f32>
};

struct vertex_to_fragment_struct
{
	@builtin(position)	vertex_position		:	vec4<f32>,
	@location(0)		vertex_texture		:	vec4<f32>
};

struct fragment_to_target_struct
{
	@location(0) 		fragment_color		:	vec4<f32>
};

@group(0) @binding(0) var<uniform> component_info	:	component_information;
@group(0) @binding(1) var textur_object				:	texture_2d<f32>;
@group(0) @binding(2) var texture_sampler			:	sampler;

@vertex
fn vertex_main(
		@location(0)	my_coord		:	vec4<f32>,
		@location(1)	my_texture		:	vec4<f32>
	)->vertex_to_fragment_struct
{
	var vf:vertex_to_fragment_struct;
	vf.vertex_position	=my_coord;
	vf.vertex_texture	=my_texture;
	
	vf.vertex_position=component_info.rotate_matrix		*vf.vertex_position;
	vf.vertex_position=component_info.scale_matrix		*vf.vertex_position;
	vf.vertex_position=component_info.location_matrix	*vf.vertex_position;
	
	return vf;
}

@fragment
fn fragment_main(vf:vertex_to_fragment_struct) ->fragment_to_target_struct
{
	var ft:fragment_to_target_struct;
	ft.fragment_color=textureSample(textur_object,texture_sampler,vf.vertex_texture.xy);
	return ft;
}

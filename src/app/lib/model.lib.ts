import { Vec3 } from 'wgpu-matrix';

export type Nullable<T> = T | null;

export enum InitStatus {
    FAIL = 0,
    OK = 1,
}

export interface Vertices {
    TextureImgName: string | undefined;
    Vertex: Float32Array;
}

export interface RenderParams {
    ArrayStride: number;
    PositionOffset: number;
    UVOffset: number;
}

export interface Material {

    // newmtl
    Name: string;

    // Ns 反射指数
    SpecularExponent: number;

    // d 渐隐指数
    Dissove: number;

    // Tr
    Transparency: number;

    // Tf 滤光透射率
    TransmissionFilter: Vec3;

    // illum
    Illum: number;

    // Ka 环境反射
    Ambient: Vec3;

    // Kd 漫反射
    Diffuse: Vec3;

    // Ks 镜反射
    Specular: Vec3;
}

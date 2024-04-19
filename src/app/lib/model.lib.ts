import { Vec3 } from 'wgpu-matrix';

export type Nullable<T> = T | null;

export enum InitStatus {
    FAIL = 0,
    OK = 1,
}

export interface Vertices {
    textureImgName: string | undefined;
    vertex: Float32Array;
}

export interface RenderParams {
    arrayStride: number;
    positionOffset: number;
    uvOffset: number;
}

export interface Material {

    // newmtl
    name: string;

    // Ns 反射指数
    specularExponent: number;

    // d 渐隐指数
    dissove: number;

    // Tr
    transparency: number;

    // Tf 滤光透射率
    transmissionFilter: Vec3;

    // illum
    illum: number;

    // Ka 环境反射
    ambient: Vec3;

    // Kd 漫反射
    diffuse: Vec3;

    // Ks 镜反射
    specular: Vec3;
}

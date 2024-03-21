export type Nullable<T> = T | null;

export enum initStatus {
    FAIL = 0,
    OK = 1,
}

export interface PartParams {
    VertexDataUrl: string;
}

export interface ComponentParams {
    TextureUrl: string;
    ScaleMatrix: Array<number>;
    LocationMatrix: Array<number>;
}

export interface WaveParams {
    Width: number;
    Height: number;
    WaveNumber: number;
    TimeCycle: number;
    WaveAmplitude: number;
    TextureUrl: string;
}

export interface Mesh {

    // v
    Positions: Float32Array;

    // vt
    Uvs: Float32Array;

    // vn
    Normals: Float32Array;

    // f
    Indices: Uint16Array;
}

export interface Material {

    // newmtl
    Face: string;

    // Ns
    Shininess: number;

    // Ka
    Ambient: Array<number>;

    // Kd
    Diffuse: Array<number>;

    // Ks
    Specular: Array<number>;

    // Tf
    TransmissionFilter: Array<number>;

    // Tr
    Transparency: number;

    // d
    Opacity: number;

    // illum
    Illum: number;
}

export enum initStatus {
    FAIL = 0,
    OK = 1,
}

export interface RotateParams {
    Width: number;
    Height: number;
    ScaleMatrix: Array<number>;
    LocationMatrix: Array<number>;
    TextureUrl: string;
}

export interface WaveParams {
    Width: number;
    Height: number;
    WaveNumber: number;
    TimeCycle: number;
    WaveAmplitude: number;
    TextureUrl: string;
}

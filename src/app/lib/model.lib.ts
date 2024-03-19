export enum initStatus {
    FAIL = 0,
    OK = 1,
}

export interface ComponentParameter {
    Width: number;
    Height: number;
    TextureUrl: string;
    ScaleMatrix: Array<number>;
    LocationMatrix: Array<number>;
}

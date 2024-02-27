export enum initStatus {
    FAIL = 0,
    OK = 1,
}

export interface PartParameter {
    TextureUrl: string;
    VertexDataUrl: string;
    ScaleMatrix: Array<number>;
    LocationMatrix: Array<number>;
}

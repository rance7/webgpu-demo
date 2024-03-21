import { Nullable } from './model.lib';

export const SHADER_PATH: string = './assets/shader.wgsl';

export const CANVAS_ID: string = '#my_canvas';

export function convertNullToUndefined<T>(value: Nullable<T>): T | undefined {
    return value as T | undefined;
}

export async function getFileContent(path: string): Promise<string | null> {
    try {
        const res: Response = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) {
            console.error(`Fail to get file content:${path}, status:${res.status}`);
            return null;
        }
        return await res.text();
    } catch (error) {
        console.error(`Error occurred when fetching file:`, error);
    }
    return null;
}

export async function getVertexData(path: string): Promise<Array<number> | null> {
    try {
        const res: Response = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) {
            console.error(`Fail to get vertex data:${path}, status:${res.status}`);
            return null;
        }
        return await res.json() as Array<number>;
    } catch (error) {
        console.error(`Error occurred when fetching vertex data file:`, error);
    }
    return null;
}

export async function getTextureBlob(path: string): Promise<ImageBitmapSource | null> {
    try {
        const res: Response = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) {
            console.error(`Fail to get texture blob:${path}, status:${res.status}`);
            return null;
        }
        return await res.blob() as unknown as ImageBitmapSource;
    } catch (error) {
        console.error(`Error occurred when fetching texture file:`, error);
    }
    return null;
}

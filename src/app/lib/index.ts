type Nullable<T> = T | null;

export const CANVAS_ID: string = '#my_canvas';

export const SHADER_PATH: string = './assets/shader2.txt';

export const VERTEX_DATA_PATH: string = './assets/vertex_data.txt';

export function convertNullToUndefined<T>(value: Nullable<T>): T | undefined {
    return value as T | undefined;
}

export async function getShader(path: string): Promise<string | null> {
    try {
        const res: Response = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) {
            console.error(`Fail to get shader content with http status:${res.status}`);
            return null;
        }
        return await res.text();
    } catch (error) {
        console.error(`Error occurred when fetching shader file:`, error);
    }
    return null;
}

export async function getVertexData(path: string): Promise<Array<number> | null> {
    try {
        const res: Response = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) {
            console.error(`Fail to get vertex data with http status:${res.status}`);
            return null;
        }
        return await res.json() as Array<number>;
    } catch (error) {
        console.error(`Error occurred when fetching vertex data file:`, error);
    }
    return null;
}

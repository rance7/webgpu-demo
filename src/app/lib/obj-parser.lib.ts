import { Vec2, Vec3 } from 'wgpu-matrix';
import { MODEL_PATH, getFileContent } from '.';
import { Vertices } from './model.lib';

export class ObjParser {

    public mtl: Map<string, Array<string>>;

    public vt: Map<string, Array<Vec2>>;

    public vn: Map<string, Array<Vec3>>;

    public v: Map<string, Array<Vec3>>;

    public f: Map<string, Map<string, Array<Array<string>>>>;

    public constructor() {
        this.mtl = new Map();
        this.vt = new Map();
        this.vn = new Map();
        this.v = new Map();
        this.f = new Map();
    }

    public async parseObj(objPath: string): Promise<string> {
        const objContent: string | null = await getFileContent(objPath);
        if (!objContent) {
            console.error('Fail to load obj content');
            return '';
        }

        const mtl: Array<string> = [];

        const vt: Array<Vec2> = [];

        const vn: Array<Vec3> = [];

        const v: Array<Vec3> = [];

        let f: Array<Array<string>> = [];

        const mtlMap: Map<string, Array<Array<string>>> = new Map();

        let mtlFileName: string = '';
        let currentComponent: string = '';
        let currentMatrial: string = '';
        const lines: Array<string> = objContent.replaceAll('\r', '').split('\n');
        for (const line of lines) {
            const trimedLine: string = line.trim();
            if (trimedLine == '' || trimedLine.startsWith('#')) {
                continue;
            }

            const [startingChar, ...data] = trimedLine.split(/\s+/u);
            switch (startingChar) {
                case 'vt':
                    vt.push([
                        Number(data[0]).valueOf(),
                        Number(data[1]).valueOf(),
                    ]);
                    break;
                case 'vn':
                    vn.push([
                        Number(data[0]).valueOf(),
                        Number(data[1]).valueOf(),
                        Number(data[2]).valueOf(),
                    ]);
                    break;
                case 'v':
                    v.push([
                        Number(data[0]).valueOf(),
                        Number(data[1]).valueOf(),
                        Number(data[2]).valueOf(),
                    ]);
                    break;
                case 'f':
                    f.push(data);
                    break;
                case 'usemtl':
                    if (currentMatrial) {
                        mtlMap.set(currentMatrial, f);
                    }
                    currentMatrial = data[0];
                    mtl.push(data[0]);
                    f = [];
                    break;
                case 'o':
                    if (currentComponent) {
                        this.mtl.set(currentComponent, mtl);
                        this.vt.set(currentComponent, vt);
                        this.vn.set(currentComponent, vn);
                        this.v.set(currentComponent, v);
                        this.f.set(currentComponent, mtlMap);
                    }
                    currentComponent = data[0];
                    break;
                case 'mtllib':
                    mtlFileName = data[0];
                    break;
                default:
                    break;
            }
        }
        mtlMap.set(currentMatrial, f);
        this.mtl.set(currentComponent, mtl);
        this.vt.set(currentComponent, vt);
        this.vn.set(currentComponent, vn);
        this.v.set(currentComponent, v);
        this.f.set(currentComponent, mtlMap);
        return mtlFileName;
    }

    public async parseObj2Vertices(objContent: string): Promise<Array<Vertices> | null> {
        const mtlFileName: string = await this.parseObj(objContent);
        if (!mtlFileName) {
            return null;
        }

        const mtlMap: Map<string, string> | null = await this.parseMtl(mtlFileName);
        if (!mtlMap) {
            return null;
        }

        let componentVertices: Array<number> = [];
        const result: Array<Vertices> = [];
        for (const componentKey of this.f.keys()) {
            const verticesMap: Map<string, Array<Array<string>>> | undefined = this.f.get(componentKey);
            if (!verticesMap) {
                continue;
            }
            for (const mtlKey of verticesMap.keys()) {
                const vertices: Array<Array<string>> | undefined = verticesMap.get(mtlKey);
                if (!vertices) {
                    continue;
                }
                for (const faces of vertices) {
                    for (const face of faces) {
                        const indices: Array<string> = face.split('/');
                        const v: Array<Vec3> | undefined = this.v.get(componentKey);
                        const vt: Array<Vec3> | undefined = this.vt.get(componentKey);
                        if (!v || !vt) {
                            continue;
                        }
                        componentVertices.push(...v[Number(indices[0]).valueOf() - 1], 1, ...vt[Number(indices[1]).valueOf() - 1]);
                    }
                }
                const temp: Float32Array = new Float32Array(componentVertices);
                const record: Vertices = {
                    textureImgName: mtlMap.get(mtlKey),
                    vertex: temp,
                };
                result.push(record);
                componentVertices = [];
            }
        }

        return result;
    }

    public async parseMtl(mtlFileName: string): Promise<Map<string, string> | null> {
        const mtlData: string | null = await getFileContent(`${MODEL_PATH}/${mtlFileName}`);
        if (!mtlData) {
            console.error('Fail to get mtl file content');
            return null;
        }

        let currentMatrial: string = '';
        const result: Map<string, string> = new Map();
        const lines: Array<string> = mtlData.replaceAll('\r', '').split('\n');
        for (const line of lines) {
            const trimedLine: string = line.trim();
            if (trimedLine == '' || trimedLine.startsWith('#')) {
                continue;
            }

            const [startingChar, ...data] = trimedLine.split(/\s+/u);
            switch (startingChar) {
                case 'map_Kd':
                    result.set(currentMatrial, data[0]);
                    break;
                case 'newmtl':
                    currentMatrial = data[0];
                    break;
                default:
                    break;
            }
        }
        return result;
    }

}

import { Vec2, Vec3 } from 'wgpu-matrix';
import { getFileContent } from '.';
import { Mesh } from './model.lib';

export class ObjParser {

    public vt: Array<Vec2>;

    public vn: Array<Vec3>;

    public v: Array<Vec3>;

    public f: Array<Array<string>>;

    public constructor() {
        this.vt = [];
        this.vn = [];
        this.v = [];
        this.f = [];
    }

    public async parseObj(objPath: string): Promise<void> {
        const objContent: string | null = await getFileContent(objPath);
        if (!objContent) {
            console.error('Fail to load obj content');
            return;
        }
        const lines: Array<string> = objContent.split('\n');
        for (const line of lines) {
            const trimedLine: string = line.trim();
            if (trimedLine == '' || trimedLine.startsWith('#')) {
                continue;
            }
            const [startingChar, ...data] = line.replaceAll('\r', '').trim().split(' ');
            switch (startingChar) {
                case 'vt':
                    this.vt.push([
                        Number(data[0]).valueOf(),
                        Number(data[1]).valueOf(),
                    ]);
                    break;
                case 'vn':
                    this.vn.push([
                        Number(data[0]).valueOf(),
                        Number(data[1]).valueOf(),
                        Number(data[2]).valueOf(),
                    ]);
                    break;
                case 'v':
                    this.v.push([
                        Number(data[0]).valueOf(),
                        Number(data[1]).valueOf(),
                        Number(data[2]).valueOf(),
                    ]);
                    break;
                case 'f':
                    this.f.push(data);
                    break;
                default:
                    break;
            }
        }
    }

    public async parseObj2Vertices(objContent: string): Promise<Float32Array> {
        await this.parseObj(objContent);

        const result: Array<number> = [];
        for (const faces of this.f) {
            for (const face of faces) {
                const indices: Array<string> = face.split('/');
                const v: Vec3 = this.v[Number(indices[0]).valueOf() - 1];
                const vt: Vec2 = this.vt[Number(indices[1]).valueOf() - 1];
                result.push(...v, 1, ...vt);
            }
        }
        return new Float32Array(result);
    }

    public async parseObj2Mesh(objContent: string): Promise<Mesh> {
        await this.parseObj(objContent);

        const finalUvs: Array<number> = [];
        const finalNormals: Array<number> = [];
        const finalPositions: Array<number> = [];
        const finalIndices: Array<number> = [];

        {
            const cache: Record<string, number> = {};
            let i: number = 0;
            for (const faces of this.f) {
                for (const face of faces) {
                    if (!cache[face]) {
                        finalIndices.push(cache[face]);
                        continue;
                    }

                    cache[face] = i;
                    finalIndices.push(i);

                    const [vI, uvI, nI] = face.split('/').map((s: string) => Number(s).valueOf() - 1);

                    if (vI > -1) {
                        finalPositions.push(...this.v[vI]);
                    }

                    if (uvI > -1) {
                        finalUvs.push(...this.vt[uvI]);
                    }

                    if (nI > -1) {
                        finalNormals.push(...this.vn[nI]);
                    }
                    i += 1;
                }
            }
        }

        return {
            Positions: new Float32Array(finalPositions),
            Uvs: new Float32Array(finalUvs),
            Normals: new Float32Array(finalNormals),
            Indices: new Uint16Array(finalIndices),
        };
    }

}

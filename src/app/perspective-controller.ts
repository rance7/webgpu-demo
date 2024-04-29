import { GUI } from 'dat.gui';
import { vec3 } from 'wgpu-matrix';
import { Cameras, CameraParams, ArcballCamera, WASDCamera } from './lib/camera.lib';
import { createInputHandler, InputHandler } from './lib/input-handler.lib';

export class PerspectiveController {

    public canvas!: HTMLCanvasElement;

    public cameras!: Cameras;

    public cameraParams!: CameraParams;

    public lastFrameTime!: number;

    public inputHandler!: InputHandler;

    public mouseX: number = -1;

    public mouseY: number = -1;

    public constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.initCamera();
        this.initControlBoard();
        window.addEventListener('mousemove', e => {
            const rect: DOMRect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
    }

    public initCamera(): void {
        this.cameras = {
            arcball: new ArcballCamera({ position: vec3.create(3, 2, 5) }),
            keyboard: new WASDCamera({ position: vec3.create(3, 2, 5) }),
        };
        this.cameraParams = { type: 'arcball' };
        this.lastFrameTime = Date.now();
    }

    public initControlBoard(): void {
        this.inputHandler = createInputHandler(window, this.canvas);
        let oldCameraType = this.cameraParams.type;
        const gui: GUI = new GUI();
        gui.domElement.id = 'gui';
        gui.add(this.cameraParams, 'type', ['arcball', 'keyboard']).onChange(() => {
            const newCameraType = this.cameraParams.type;
            this.cameras[newCameraType].matrix = this.cameras[oldCameraType].matrix;
            oldCameraType = newCameraType;
        });
        const canvasContainer = document.querySelector('.container');
        if (!canvasContainer) {
            console.error('Exit initCamera: fail to get canvas container');
            return;
        }
        canvasContainer.append(gui.domElement);
    }

}

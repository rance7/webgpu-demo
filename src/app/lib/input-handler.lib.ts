import { CURRENT_COMPONENT, SELECTED_COMPONENT } from '.';

// eslint-disable-next-line import/exports-last, import/no-default-export
export default interface Controller {

    // Digital input (e.g keyboard state)
    readonly digital: {
        readonly forward: boolean;
        readonly backward: boolean;
        readonly left: boolean;
        readonly right: boolean;
        readonly up: boolean;
        readonly down: boolean;
    };

    // Analog input (e.g mouse, touchscreen)
    readonly analog: {
        readonly x: number;
        readonly y: number;
        readonly zoom: number;
        readonly touching: boolean;
    };
    // eslint-disable-next-line semi
}

// eslint-disable-next-line @typescript-eslint/no-type-alias
export type InputHandler = () => Controller;

export function createInputHandler(
    window: Window,
    canvas: HTMLCanvasElement,
): InputHandler {
    const digital = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
    };

    const analog = {
        x: 0,
        y: 0,
        zoom: 0,
    };

    let mouseDown = false;
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const setDigital = (e: KeyboardEvent, value: boolean) => {
        switch (e.code) {
            case 'KeyW':
                digital.forward = value;
                e.preventDefault();
                e.stopPropagation();
                break;
            case 'KeyS':
                digital.backward = value;
                e.preventDefault();
                e.stopPropagation();
                break;
            case 'KeyA':
                digital.left = value;
                e.preventDefault();
                e.stopPropagation();
                break;
            case 'KeyD':
                digital.right = value;
                e.preventDefault();
                e.stopPropagation();
                break;
            case 'Space':
                digital.up = value;
                e.preventDefault();
                e.stopPropagation();
                break;
            case 'ShiftLeft':
            case 'ControlLeft':
            case 'KeyC':
                digital.down = value;
                e.preventDefault();
                e.stopPropagation();
                break;
            default:
                break;
        }
    };

    window.addEventListener('keydown', e => setDigital(e, true));
    window.addEventListener('keyup', e => setDigital(e, false));

    canvas.style.touchAction = 'pinch-zoom';
    const currentElem: HTMLElement | null = document.querySelector(CURRENT_COMPONENT);
    const selectedElem: HTMLElement | null = document.querySelector(SELECTED_COMPONENT);
    canvas.addEventListener('pointerdown', () => {
        let id = 0;
        if (currentElem?.textContent) {
            const currentContent: string = currentElem.textContent.split(' ')[1];
            id = currentContent == 'none' ? 0 : Number(currentContent);
        }

        if (selectedElem) {
            selectedElem.textContent = `selected-elem#: ${id}`;
        }
        mouseDown = true;
    });
    canvas.addEventListener('pointerup', () => {
        mouseDown = false;
    });
    canvas.addEventListener('pointermove', e => {
        mouseDown = e.pointerType == 'mouse' ? (e.buttons & 1) !== 0 : true;
        if (mouseDown) {
            analog.x += e.movementX;
            analog.y += e.movementY;
        }
    });
    canvas.addEventListener(
        'wheel',
        e => {
            mouseDown = (e.buttons & 1) !== 0;
            if (mouseDown) {
                analog.zoom += Math.sign(e.deltaY);
                e.preventDefault();
                e.stopPropagation();
            }
        },
        { passive: false },
    );

    return () => {
        const out = {
            digital,
            analog: {
                x: analog.x,
                y: analog.y,
                zoom: analog.zoom,
                touching: mouseDown,
            },
        };
        analog.x = 0;
        analog.y = 0;
        analog.zoom = 0;
        return out;
    };
}

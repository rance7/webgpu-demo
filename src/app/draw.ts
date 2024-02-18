import { Target } from './lib/target.lib';

export function drawCanvas(target: Target): void {
    target.beginDraw();

    target.doDraw();

    target.endDraw();

    window.requestAnimationFrame(() => drawCanvas(target));
}

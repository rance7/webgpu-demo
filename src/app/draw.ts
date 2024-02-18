import { Render, Target } from './lib/model.lib';
import { initTarget, endDraw, doDraw, beginDraw } from './target';

export function drawCanvas(render: Render): void {
    const target: Target = initTarget(render);

    beginDraw(target);
    doDraw(target);
    endDraw(target);

    window.requestAnimationFrame(() => drawCanvas(render));
}

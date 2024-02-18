import { Component, Target } from './lib/model.lib';
import { beginDraw, doDraw, endDraw, initTarget } from './target';

export function drawCanvas(component: Component): void {
    const target: Target = initTarget(component.part.render);

    beginDraw(target);
    doDraw(target, component);
    endDraw(target);

    window.requestAnimationFrame(() => drawCanvas(component));
}

import { Target } from "./lib/target.lib.js";

export function drawCanvas(target: Target) {
    target.beginDraw();

    target.doDraw();

    target.endDraw();

    window.requestAnimationFrame(() => drawCanvas(target));
}

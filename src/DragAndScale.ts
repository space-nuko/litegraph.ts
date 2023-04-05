import { Vector2, Vector4 } from "./types";

export default class DragAndScale {
    constructor(element?: HTMLElement, skipEvents?: boolean);
    offset: [number, number];
    scale: number;
    max_scale: number;
    min_scale: number;
    onredraw: Function | null;
    enabled: boolean;
    last_mouse: Vector2;
    element: HTMLElement | null;
    visible_area: Vector4;
    bindEvents(element: HTMLElement): void;
    computeVisibleArea(): void;
    onMouse(e: MouseEvent): void;
    toCanvasContext(ctx: CanvasRenderingContext2D): void;
    convertOffsetToCanvas(pos: Vector2): Vector2;
    convertCanvasToOffset(pos: Vector2): Vector2;
    mouseDrag(x: number, y: number): void;
    changeScale(value: number, zooming_center?: Vector2): void;
    changeDeltaScale(value: number, zooming_center?: Vector2): void;
    reset(): void;
}

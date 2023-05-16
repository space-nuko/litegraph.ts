import type { Vector2, Vector4 } from "./types";
import LiteGraph from "./LiteGraph";

export interface EventExt {
    canvasX: number;
    canvasY: number;
    dragging: boolean;
    eventType?: string;
    wheel?: number;
    delta?: number;
    wheelDelta?: number;
    deltaX?: number;
    deltaY?: number;
    wheelDeltaY?: number;
    click_time?: number;
    layerY?: number;
}

export interface MouseEventExt extends MouseEvent, EventExt { }
export interface DragEventExt extends DragEvent, EventExt { }
export interface CustomEventExt extends CustomEvent, EventExt { }

export default class DragAndScale {
    constructor(element?: HTMLCanvasElement, skipEvents: boolean = false) {
        if (element) {
            this.element = element;
            if (!skipEvents) {
                this.bindEvents(element);
            }
        }
    }

    offset: [number, number] = [0, 0];
    scale: number = 1;
    max_scale: number = 10
    min_scale: number = 0.1
    onredraw: Function | null = null;
    enabled: boolean = true;
    last_mouse: Vector2 = [0, 0];
    element: HTMLCanvasElement | null = null;
    visible_area: Float32Array = new Float32Array([0, 0, 0, 0]);
    viewport: Vector4 | null = null;

    dragging: boolean = false;

    private _binded_mouse_callback: EventListener | null = null;

    bindEvents(element: HTMLCanvasElement): void {
        this.last_mouse = [0, 0]

        this._binded_mouse_callback = this.onMouse.bind(this);

        LiteGraph.pointerListenerAdd(element, "down", this._binded_mouse_callback);
        LiteGraph.pointerListenerAdd(element, "move", this._binded_mouse_callback);
        LiteGraph.pointerListenerAdd(element, "up", this._binded_mouse_callback);

        element.addEventListener(
            "mousewheel",
            this._binded_mouse_callback,
            false
        );
        element.addEventListener("wheel", this._binded_mouse_callback, false);
    }

    computeVisibleArea(viewport?: Vector4): void {
        if (!this.element) {
            this.visible_area[0] = this.visible_area[1] = this.visible_area[2] = this.visible_area[3] = 0;
            return;
        }
        var width = this.element.width;
        var height = this.element.height;
        var startx = -this.offset[0];
        var starty = -this.offset[1];
        if (viewport) {
            startx += viewport[0] / this.scale;
            starty += viewport[1] / this.scale;
            width = viewport[2];
            height = viewport[3];
        }
        var endx = startx + width / this.scale;
        var endy = starty + height / this.scale;
        this.visible_area[0] = startx;
        this.visible_area[1] = starty;
        this.visible_area[2] = endx - startx;
        this.visible_area[3] = endy - starty;
    }

    onMouse(_e: MouseEvent): boolean | null {
        if (!this.enabled) {
            return;
        }

        var canvas = this.element;
        var rect = canvas.getBoundingClientRect();
        let e = _e as MouseEventExt;
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        e.canvasX = x;
        e.canvasX = y;
        e.dragging = this.dragging;

        var is_inside = !this.viewport || (this.viewport && x >= this.viewport[0] && x < (this.viewport[0] + this.viewport[2]) && y >= this.viewport[1] && y < (this.viewport[1] + this.viewport[3]));

        //console.log("pointerevents: DragAndScale onMouse "+e.type+" "+is_inside);

        var ignore = false;
        // if (this.onmouse) {
        //     ignore = this.onmouse(e);
        // }

        if (e.type == LiteGraph.pointerevents_method + "down" && is_inside) {
            this.dragging = true;
            LiteGraph.pointerListenerRemove(canvas, "move", this._binded_mouse_callback);
            LiteGraph.pointerListenerAdd(document, "move", this._binded_mouse_callback);
            LiteGraph.pointerListenerAdd(document, "up", this._binded_mouse_callback);
        } else if (e.type == LiteGraph.pointerevents_method + "move") {
            if (!ignore) {
                var deltax = x - this.last_mouse[0];
                var deltay = y - this.last_mouse[1];
                if (this.dragging) {
                    this.mouseDrag(deltax, deltay);
                }
            }
        } else if (e.type == LiteGraph.pointerevents_method + "up") {
            this.dragging = false;
            LiteGraph.pointerListenerRemove(document, "move", this._binded_mouse_callback);
            LiteGraph.pointerListenerRemove(document, "up", this._binded_mouse_callback);
            LiteGraph.pointerListenerAdd(canvas, "move", this._binded_mouse_callback);
        } else if (is_inside &&
            (e.type == "mousewheel" ||
                e.type == "wheel" ||
                e.type == "DOMMouseScroll")
        ) {
            e.eventType = "mousewheel";
            if (e.type == "wheel") {
                e.wheel = -e.deltaY;
            } else {
                e.wheel =
                    e.wheelDeltaY != null ? e.wheelDeltaY : e.detail * -60;
            }

            //from stack overflow
            e.delta = e.wheelDelta
                ? e.wheelDelta / 40
                : e.deltaY
                    ? -e.deltaY / 3
                    : 0;
            this.changeDeltaScale(1.0 + e.delta * 0.05, [e.clientX, e.clientY]);
        }

        this.last_mouse[0] = x;
        this.last_mouse[1] = y;

        if (is_inside) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }

    toCanvasContext(ctx: CanvasRenderingContext2D): void {
        ctx.scale(this.scale, this.scale);
        ctx.translate(this.offset[0], this.offset[1]);
    }

    convertOffsetToCanvas(pos: Vector2): Vector2 {
        //return [pos[0] / this.scale - this.offset[0], pos[1] / this.scale - this.offset[1]];
        return [
            (pos[0] + this.offset[0]) * this.scale,
            (pos[1] + this.offset[1]) * this.scale
        ];
    }

    convertCanvasToOffset(pos: Vector2, out: Vector2 = [0, 0]): Vector2 {
        out[0] = pos[0] / this.scale - this.offset[0];
        out[1] = pos[1] / this.scale - this.offset[1];
        return out;
    }

    mouseDrag(x: number, y: number): void {
        this.offset[0] += x / this.scale;
        this.offset[1] += y / this.scale;

        if (this.onredraw) {
            this.onredraw(this);
        }
    }

    changeScale(value: number, zooming_center?: Vector2): void {
        if (value < this.min_scale) {
            value = this.min_scale;
        } else if (value > this.max_scale) {
            value = this.max_scale;
        }

        if (value == this.scale) {
            return;
        }

        if (!this.element) {
            return;
        }

        var rect = this.element.getBoundingClientRect();
        if (!rect) {
            return;
        }

        zooming_center = zooming_center || [
            rect.width * 0.5,
            rect.height * 0.5
        ];
        zooming_center[0] -= rect.left
        zooming_center[1] -= rect.top
        var center = this.convertCanvasToOffset(zooming_center);
        this.scale = value;
        if (Math.abs(this.scale - 1) < 0.01) {
            this.scale = 1;
        }

        var new_center = this.convertCanvasToOffset(zooming_center);
        var delta_offset = [
            new_center[0] - center[0],
            new_center[1] - center[1]
        ];

        this.offset[0] += delta_offset[0];
        this.offset[1] += delta_offset[1];

        if (this.onredraw) {
            this.onredraw(this);
        }
    }

    changeDeltaScale(value: number, zooming_center?: Vector2): void {
        this.changeScale(this.scale * value, zooming_center);
    }

    reset(): void {
        this.scale = 1;
        this.offset[0] = 0;
        this.offset[1] = 0;
    }

}

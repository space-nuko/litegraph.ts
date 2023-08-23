import { BuiltInSlotType, clamp, LGraphNode, LiteGraph, MouseEventExt, SlotLayout, Vector2 } from "@litegraph-ts/core";

export interface WidgetNumberProperties extends Record<string, any> {
    min: number,
    max: number,
    value: number
    step: number,
    markers_color: string,
    font: string
}

export default class WidgetNumber extends LGraphNode {
    override properties: WidgetNumberProperties = {
        min: -1000,
        max: 1000,
        value: 1,
        step: 1,
        markers_color: "#666",
        font: "Arial"
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: [
            { name: "", type: "number" }
        ]
    }

    override size: Vector2 = [80, 60];

    static pixels_threshold: number = 10;

    old_y: number = -1;
    private _remainder: number = 0;
    private _precision: number = 0;
    mouse_captured: boolean = false;

    override onDrawForeground(ctx: CanvasRenderingContext2D) {
        var x = this.size[0] * 0.5;
        var h = this.size[1];
        if (h > 30) {
            ctx.fillStyle = this.properties.markers_color;
            ctx.beginPath();
            ctx.moveTo(x, h * 0.1);
            ctx.lineTo(x + h * 0.1, h * 0.2);
            ctx.lineTo(x + h * -0.1, h * 0.2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x, h * 0.9);
            ctx.lineTo(x + h * 0.1, h * 0.8);
            ctx.lineTo(x + h * -0.1, h * 0.8);
            ctx.fill();
            ctx.font = (h * 0.7).toFixed(1) + "px " + this.properties.font;
        } else {
            ctx.font = (h * 0.8).toFixed(1) + "px " + this.properties.font;
        }

        ctx.textAlign = "center";
        ctx.font = (h * 0.7).toFixed(1) + "px " + this.properties.font;
        ctx.fillStyle = "#EEE";
        ctx.fillText(
            this.properties.value.toFixed(this._precision),
            x,
            h * 0.75
        );
    }

    override onExecute() {
        this.setOutputData(0, this.properties.value);
    };

    override onPropertyChanged(name: string, value: any) {
        var t = (this.properties.step + "").split(".");
        this._precision = t.length > 1 ? t[1].length : 0;
    };

    override onMouseDown(e: MouseEventExt, pos: Vector2) {
        if (pos[1] < 0) {
            return;
        }

        this.old_y = e.canvasY;
        this.captureInput(true);
        this.mouse_captured = true;

        return true;
    };

    override onMouseMove(e: MouseEventExt) {
        if (!this.mouse_captured) {
            return;
        }

        var delta = this.old_y - e.canvasY;
        if (e.shiftKey) {
            delta *= 10;
        }
        if (e.metaKey || e.altKey) {
            delta *= 0.1;
        }
        this.old_y = e.canvasY;

        var steps = this._remainder + delta / WidgetNumber.pixels_threshold;
        this._remainder = steps % 1;
        steps = steps | 0;

        var v = clamp(
            this.properties.value + steps * this.properties.step,
            this.properties.min,
            this.properties.max
        );
        this.properties.value = v;
        this.graph._version++;
        this.setDirtyCanvas(true);
    };

    override onMouseUp(e: MouseEventExt, pos: Vector2) {
        if (e.click_time < 200) {
            var steps = pos[1] > this.size[1] * 0.5 ? -1 : 1;
            this.properties.value = clamp(
                this.properties.value + steps * this.properties.step,
                this.properties.min,
                this.properties.max
            );
            this.graph._version++;
            this.setDirtyCanvas(true);
        }

        if (this.mouse_captured) {
            this.mouse_captured = false;
            this.captureInput(false);
        }
    };
}

LiteGraph.registerNodeType({
    class: WidgetNumber,
    title: "Number",
    desc: "Widget to select number value",
    type: "widget/number"
})

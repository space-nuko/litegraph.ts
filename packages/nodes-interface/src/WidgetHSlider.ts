import { BuiltInSlotType, clamp, IComboWidget, ISliderWidget, LGraphNode, LiteGraph, MouseEventExt, SlotLayout, Vector2 } from "@litegraph-ts/core";

export interface WidgetHSliderProperties extends Record<string, any> {
    color: string,
    min: number,
    max: number,
    value: number
}

export default class WidgetHSlider extends LGraphNode {
    override properties: WidgetHSliderProperties = {
        color: "#7AF",
        min: 0,
        max: 1,
        value: 0.5
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: [
            { name: "", type: "number" },
            { name: "", type: BuiltInSlotType.EVENT }
        ]
    }

    override size: Vector2 = [160, 26];

    value: number = -1;
    oldmouse: Vector2 | null = null;

    override onDrawForeground(ctx: CanvasRenderingContext2D) {
        if (this.value == -1) {
            this.value =
                (this.properties.value - this.properties.min) /
                (this.properties.max - this.properties.min);
        }

        //border
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.fillStyle = "#000";
        ctx.fillRect(2, 2, this.size[0] - 4, this.size[1] - 4);

        ctx.fillStyle = this.properties.color;
        ctx.beginPath();
        ctx.rect(4, 4, (this.size[0] - 8) * this.value, this.size[1] - 8);
        ctx.fill();
    };

    override onExecute() {
        const newValue =
            this.properties.min +
            (this.properties.max - this.properties.min) * this.value;
        this.setProperty("value", newValue);
        this.setOutputData(0, this.properties.value);
        this.triggerSlot(1, this.properties.value);
        this.boxcolor = LiteGraph.colorToString([
            this.value,
            this.value,
            this.value
        ]);
    };

    override onMouseDown(e: MouseEventExt) {
        if (e.canvasY - this.pos[1] < 0) {
            return false;
        }

        this.oldmouse = [e.canvasX - this.pos[0], e.canvasY - this.pos[1]];
        this.captureInput(true);
        return true;
    };

    override onMouseMove(e: MouseEventExt) {
        if (!this.oldmouse) {
            return;
        }

        const m: Vector2 = [e.canvasX - this.pos[0], e.canvasY - this.pos[1]];

        let v = this.value;
        const delta = m[0] - this.oldmouse[0];
        v += delta / this.size[0];
        if (v > 1.0) {
            v = 1.0;
        } else if (v < 0.0) {
            v = 0.0;
        }

        this.value = v;

        this.oldmouse = m;
        this.setDirtyCanvas(true);
    };

    override onMouseUp(e: MouseEventExt) {
        this.oldmouse = null;
        this.captureInput(false);
    };

    override onMouseLeave(e: MouseEventExt) {
        //this.oldmouse = null;
    };
}

LiteGraph.registerNodeType({
    class: WidgetHSlider,
    title: "H.Slider",
    desc: "Linear slider controller",
    type: "widget/hslider"
})

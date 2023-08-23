import { BuiltInSlotType, clamp, IComboWidget, ISliderWidget, LGraphNode, LiteGraph, MouseEventExt, SlotLayout, Vector2 } from "@litegraph-ts/core";

export interface WidgetProgressProperties extends Record<string, any> {
    color: string,
    min: number,
    max: number,
    value: number
}

export default class WidgetProgress extends LGraphNode {
    override properties: WidgetProgressProperties = {
        color: "#7AF",
        min: 0,
        max: 1,
        value: 0.5
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "", type: "number" }
        ],
        outputs: []
    }

    override size: Vector2 = [160, 26];

    override onExecute() {
        var v = this.getInputData(0);
        if (v != null) {
            this.setProperty("value", v)
        }
    };

    override onDrawForeground(ctx: CanvasRenderingContext2D) {
        //border
        ctx.lineWidth = 1;
        ctx.fillStyle = this.properties.color;
        var v =
            (this.properties.value - this.properties.min) /
            (this.properties.max - this.properties.min);
        v = Math.min(1, v);
        v = Math.max(0, v);
        ctx.fillRect(2, 2, (this.size[0] - 4) * v, this.size[1] - 4);
    };
}

LiteGraph.registerNodeType({
    class: WidgetProgress,
    title: "Progress",
    desc: "Shows data in linear progress",
    type: "widget/progress"
})

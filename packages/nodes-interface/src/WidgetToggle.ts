import { BuiltInSlotType, LGraphNode, LiteGraph, SlotLayout, Vector2 } from "@litegraph-ts/core";

export interface WidgetToggleProperties extends Record<string, any> {
    font: string,
    value: boolean,
}

export default class WidgetToggle extends LGraphNode {
    override properties: WidgetToggleProperties = {
        font: "",
        value: false
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "v", type: "boolean" },
            { name: "e", type: BuiltInSlotType.ACTION }
        ],
        outputs: [
            { name: "v", type: "boolean" },
            { name: "e", type: BuiltInSlotType.EVENT }
        ]
    }

    override size: Vector2 = [160, 44];

    override onDrawForeground(ctx: CanvasRenderingContext2D) {
        if (this.flags.collapsed) {
            return;
        }

        var size = this.size[1] * 0.5;
        var margin = 0.25;
        var h = this.size[1] * 0.8;
        ctx.font = this.properties.font || (size * 0.8).toFixed(0) + "px Arial";
        var w = ctx.measureText(this.title).width;
        var x = (this.size[0] - (w + size)) * 0.5;

        ctx.fillStyle = "#AAA";
        ctx.fillRect(x, h - size, size, size);

        ctx.fillStyle = this.properties.value ? "#AEF" : "#000";
        ctx.fillRect(
            x + size * margin,
            h - size + size * margin,
            size * (1 - margin * 2),
            size * (1 - margin * 2)
        );

        ctx.textAlign = "left";
        ctx.fillStyle = "#AAA";
        ctx.fillText(this.title, size * 1.2 + x, h * 0.85);
        ctx.textAlign = "left";
    }

    override onAction(action: any) {
        this.properties.value = !this.properties.value;
        this.triggerSlot(1, this.properties.value);
    };

    override onExecute() {
        var v = this.getInputData(0);
        if (v != null) {
            this.properties.value = v;
        }
        this.setOutputData(0, this.properties.value);
    };

    override onMouseDown(e: MouseEvent, local_pos: Vector2) {
        if (
            local_pos[0] > 1 &&
            local_pos[1] > 1 &&
            local_pos[0] < this.size[0] - 2 &&
            local_pos[1] < this.size[1] - 2
        ) {
            this.properties.value = !this.properties.value;
            this.graph._version++;
            this.triggerSlot(1, this.properties.value);
            return true;
        }
    };
}

LiteGraph.registerNodeType({
    class: WidgetToggle,
    title: "Toggle",
    desc: "Toggles between true or false",
    type: "widget/toggle"
})

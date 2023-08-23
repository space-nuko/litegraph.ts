import { BuiltInSlotType, LGraphNode, LiteGraph, MouseEventExt, SlotLayout, Vector2 } from "@litegraph-ts/core";

export interface WidgetButtonProperties extends Record<string, any> {
    text: string,
    font: string,
    font_size: number,
    message: string,
}

export default class WidgetButton extends LGraphNode {
    override properties: WidgetButtonProperties = {
        text: "click me",
        font: "Arial",
        font_size: 20,
        message: ""
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: [
            { name: "e", type: BuiltInSlotType.EVENT },
            { name: "v", type: "boolean" }
        ]
    }

    override size: Vector2 = [164, 84];
    override no_panel_on_double_click = true;

    clicked: boolean = false;

    override onDrawForeground(ctx: CanvasRenderingContext2D) {
        if (this.flags.collapsed) {
            return;
        }
        const margin = 10;
        ctx.fillStyle = "black";
        ctx.fillRect(
            margin + 1,
            margin + 1,
            this.size[0] - margin * 2,
            this.size[1] - margin * 2
        );
        ctx.fillStyle = "#AAF";
        ctx.fillRect(
            margin - 1,
            margin - 1,
            this.size[0] - margin * 2,
            this.size[1] - margin * 2
        );
        ctx.fillStyle = this.clicked
            ? "white"
            : this.mouseOver
                ? "#668"
                : "#334";
        ctx.fillRect(
            margin,
            margin,
            this.size[0] - margin * 2,
            this.size[1] - margin * 2
        );

        if (this.properties.text) {
            var font_size = this.properties.font_size || 30;
            ctx.textAlign = "center";
            ctx.fillStyle = this.clicked ? "black" : "white";
            ctx.font = font_size + "px " + this.properties.font;
            ctx.fillText(
                this.properties.text,
                this.size[0] * 0.5,
                this.size[1] * 0.5 + font_size * 0.3
            );
            ctx.textAlign = "left";
        }
    }

    override onMouseDown(e: MouseEvent, local_pos: Vector2) {
        if (
            local_pos[0] > 1 &&
            local_pos[1] > 1 &&
            local_pos[0] < this.size[0] - 2 &&
            local_pos[1] < this.size[1] - 2
        ) {
            this.clicked = true;
            this.setOutputData(1, this.clicked);
            this.triggerSlot(0, this.properties.message);
            return true;
        }
    };

    override onExecute() {
        this.setOutputData(1, this.clicked);
    };

    override onMouseUp(e: MouseEvent) {
        this.clicked = false;
    };
}

LiteGraph.registerNodeType({
    class: WidgetButton,
    title: "Button",
    desc: "Triggers an event",
    type: "widget/button"
})

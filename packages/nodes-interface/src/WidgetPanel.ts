import { BuiltInSlotType, clamp, IComboWidget, ISliderWidget, LGraphNode, LiteGraph, MouseEventExt, SlotLayout, Vector2 } from "@litegraph-ts/core";

export interface WidgetPanelProperties extends Record<string, any> {
    borderColor: string,
    bgcolorTop: string,
    bgcolorBottom: string,
    shadowSize: number,
    borderRadius: number
}

export default class WidgetPanel extends LGraphNode {
    override properties: WidgetPanelProperties = {
        borderColor: "#ffffff",
        bgcolorTop: "#f0f0f0",
        bgcolorBottom: "#e0e0e0",
        shadowSize: 2,
        borderRadius: 3
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: []
    }

    override size: Vector2 = [200, 100];

    lineargradient: CanvasGradient | null = null;

    createGradient(ctx: CanvasRenderingContext2D) {
        if (
            this.properties["bgcolorTop"] == "" ||
            this.properties["bgcolorBottom"] == ""
        ) {
            this.lineargradient = null;
            return;
        }

        this.lineargradient = ctx.createLinearGradient(0, 0, 0, this.size[1]);
        this.lineargradient.addColorStop(0, this.properties["bgcolorTop"]);
        this.lineargradient.addColorStop(1, this.properties["bgcolorBottom"]);
    };

    override onDrawForeground(ctx: CanvasRenderingContext2D) {
        if (this.flags.collapsed) {
            return;
        }

        if (this.lineargradient == null) {
            this.createGradient(ctx);
        }

        if (!this.lineargradient) {
            return;
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = this.properties["borderColor"];
        //ctx.fillStyle = "#ebebeb";
        ctx.fillStyle = this.lineargradient;

        if (this.properties["shadowSize"]) {
            ctx.shadowColor = "#000";
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = this.properties["shadowSize"];
        } else {
            ctx.shadowColor = "transparent";
        }

        (ctx as any).roundRect(
            0,
            0,
            this.size[0] - 1,
            this.size[1] - 1,
            this.properties["shadowSize"]
        );
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.stroke();
    };
}

LiteGraph.registerNodeType({
    class: WidgetPanel,
    title: "Panel",
    desc: "Non interactive panel",
    type: "widget/panel"
})

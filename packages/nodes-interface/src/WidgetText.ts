import { LGraphNode, LiteGraph, SlotLayout } from "@litegraph-ts/core";

export interface WidgetTextProperties extends Record<string, any> {
    value: any,
    font: string,
    fontsize: number,
    color: string,
    align: CanvasTextAlign,
    glowSize: number,
    decimals: number
}

export default class WidgetText extends LGraphNode {
    override properties: WidgetTextProperties = {
        value: "...",
        font: "Arial",
        fontsize: 18,
        color: "#AAA",
        align: "left",
        glowSize: 0,
        decimals: 1
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "", type: "*" }
        ],
        outputs: []
    }

    str: any = "";
    last_ctx: CanvasRenderingContext2D | null = null;

    override onDrawForeground(ctx: CanvasRenderingContext2D) {
        //ctx.fillStyle="#000";
        //ctx.fillRect(0,0,100,60);
        ctx.fillStyle = this.properties.color;
        const v = this.properties.value;

        if (this.properties["glowSize"]) {
            ctx.shadowColor = this.properties.color;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = this.properties["glowSize"];
        } else {
            ctx.shadowColor = "transparent";
        }

        var fontsize = this.properties["fontsize"];

        ctx.textAlign = this.properties["align"];
        ctx.font = fontsize.toString() + "px " + this.properties["font"];
        this.str =
            typeof v == "number" ? v.toFixed(this.properties.decimals) : v;

        if (typeof this.str == "string") {
            var lines = this.str.replace(/[\r\n]/g, "\\n").split("\\n");
            for (var i = 0; i < lines.length; i++) {
                ctx.fillText(
                    lines[i],
                    this.properties["align"] == "left" ? 15 : this.size[0] - 15,
                    fontsize * -0.15 + fontsize * (i + 1)
                );
            }
        }

        ctx.shadowColor = "transparent";
        this.last_ctx = ctx;
        ctx.textAlign = "left";
    };

    override onExecute() {
        var v = this.getInputData(0);
        if (v != null) {
            this.properties["value"] = v;
        }
        //this.setDirtyCanvas(true);
    };

    resize() {
        if (!this.last_ctx) {
            return;
        }

        var lines = this.str.split("\\n");
        this.last_ctx.font =
            this.properties["fontsize"] + "px " + this.properties["font"];
        var max = 0;
        for (var i = 0; i < lines.length; i++) {
            var w = this.last_ctx.measureText(lines[i]).width;
            if (max < w) {
                max = w;
            }
        }
        this.size[0] = max + 20;
        this.size[1] = 4 + lines.length * this.properties["fontsize"];

        this.setDirtyCanvas(true);
    };

    override onPropertyChanged(name: string, value: any) {
        this.properties[name] = value;
        this.str = typeof value == "number" ? value.toFixed(3) : value;
        //this.resize();
        return true;
    };
}

LiteGraph.registerNodeType({
    class: WidgetText,
    title: "Text",
    desc: "Shows the input value",
    type: "widget/text"
})

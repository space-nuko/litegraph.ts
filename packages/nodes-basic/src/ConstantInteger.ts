import type { INumberWidget, PropertyLayout, SlotLayout, Vector2 } from "@litegraph-ts/core"
import { LiteGraph, LGraphNode } from "@litegraph-ts/core"

export interface ConstantIntegerProperties extends Record<string, any> {
    value: number,
}

export default class ConstantInteger extends LGraphNode {
    override properties: ConstantIntegerProperties = {
        value: 1
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: [
            { name: "value", type: "number" }
        ]
    }

    static propertyLayout: PropertyLayout = [
        { name: "value", defaultValue: 1.0 }
    ]

    widget: INumberWidget;

    nameInGraph: string = "";

    override size: Vector2 = [180, 30];

    constructor(title?: string) {
        super(title)
        this.widget = this.addWidget("number", "value", 1, "value", { step: 1, precision: 0 });
        this.widgets_up = true;
    }

    override onExecute() {
        this.setOutputData(0, this.properties["value"]);
    }

    override getTitle(): string {
        if (this.flags.collapsed) {
            return "" + this.properties.value;
        }
        return this.title;
    }

    setValue(v: any) {
        if (typeof v !== "number")
            v = parseFloat(v);
        this.setProperty("value", Math.floor(v));
    }

    override onDrawBackground(_ctx: CanvasRenderingContext2D) {
        //show the current value
        this.outputs[0].label = this.properties["value"].toFixed(0);
    }
}

LiteGraph.registerNodeType({
    class: ConstantInteger,
    title: "Const Integer",
    desc: "Constant integer",
    type: "basic/integer"
})

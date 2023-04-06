import type { INumberWidget } from "../../IWidget";
import type { PropertyLayout, SlotLayout } from "../../LGraphNode";
import LGraphNode from "../../LGraphNode";
import LiteGraph from "../../LiteGraph";
import type { Vector2 } from "../../types";
import { BuiltInSlotType } from "../../types";

export interface WatchProperties extends Record<string, any> {
    value: any,
}

export default class Watch extends LGraphNode {
    override properties: WatchProperties = {
        value: 0
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "value", type: BuiltInSlotType.DEFAULT, options: { label: "" } }
        ],
        outputs: []
    }

    static propertyLayout: PropertyLayout = [
        { name: "value", defaultValue: 1.0 }
    ]

    widget: INumberWidget;

    nameInGraph: string = "";

    override size: Vector2 = [60, 30];

    value: any = 0;

    constructor(title?: string) {
        super(title)
    }

    override onExecute() {
        if (this.inputs[0]) {
            this.value = this.getInputData(0);
        }
    }

    override getTitle(): string {
        if (this.flags.collapsed) {
            return this.inputs[0].label;
        }
        return this.title;
    }

    static toString(o: any) {
        if (o == null) {
            return "null";
        } else if (o.constructor === Number) {
            return o.toFixed(3);
        } else if (o.constructor === Array) {
            var str = "[";
            for (var i = 0; i < o.length; ++i) {
                str += Watch.toString(o[i]) + (i + 1 != o.length ? "," : "");
            }
            str += "]";
            return str;
        } else {
            return String(o);
        }
    }

    override onDrawBackground(_ctx: CanvasRenderingContext2D) {
        //show the current value
        this.inputs[0].label = Watch.toString(this.value);
    }
}

LiteGraph.registerNodeType({
    type: Watch,
    title: "Watch",
    desc: "Show value of input",
    typeName: "basic/watch"
})

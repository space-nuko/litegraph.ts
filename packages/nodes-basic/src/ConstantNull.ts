import { BuiltInSlotType, IToggleWidget, OptionalSlots, PropertyLayout, SlotLayout, Vector2 } from "@litegraph-ts/core"
import { LiteGraph, LGraphNode } from "@litegraph-ts/core"

export interface ConstantNullProperties extends Record<string, any> {
    value: null | undefined,
}

export default class ConstantNull extends LGraphNode {
    override properties: ConstantNullProperties = {
        value: null
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: [
            { name: "null", type: "*" }
        ]
    }

    static propertyLayout: PropertyLayout = [
        { name: "value", defaultValue: null }
    ]

    static optionalSlots: OptionalSlots = {
        inputs: [
            { name: "toggle", type: BuiltInSlotType.ACTION }
        ]
    }

    widget: IToggleWidget;

    override size: Vector2 = [140, 30];

    constructor(title?: string) {
        super(title)
        this.widget = this.addWidget("toggle", "value", this.properties.value, "value");
        this.widgets_up = true;
    }

    override onExecute() {
        this.setOutputData(0, this.properties["value"]);
    }

    override onAction() {
        if (this.properties.value === null)
            this.setValue(undefined)
        else
            this.setValue(null)
    }

    override getTitle(): string {
        if (this.flags.collapsed) {
            return "" + String(this.properties.value);
        }
        return this.title;
    }

    setValue(v: any) {
        this.setProperty("value", v === undefined ? undefined : null);
    }
}

LiteGraph.registerNodeType({
    class: ConstantNull,
    title: "Const Null",
    desc: "Constant null or undefined",
    type: "basic/null"
})

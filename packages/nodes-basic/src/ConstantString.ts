import { ITextWidget, LGraphNode, LiteGraph, OptionalSlots, PropertyLayout, SlotLayout, Vector2 } from "@litegraph-ts/core"

export interface ConstantStringProperties extends Record<string, any> {
    value: string,
}

export default class ConstantString extends LGraphNode {
    override properties: ConstantStringProperties = {
        value: ""
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: [
            { name: "string", type: "string" }
        ]
    }

    static propertyLayout: PropertyLayout = [
        { name: "value", defaultValue: "" }
    ]

    static optionalSlots: OptionalSlots = {
    }

    widget: ITextWidget;

    override size: Vector2 = [180, 30];

    constructor(title?: string) {
        super(title)
        this.widget = this.addWidget("text", "value", "", "value");
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
        this.setProperty("value", String(v));
    }

    override onDropFile(file: File) {
        var that = this;
        var reader = new FileReader();
        reader.onload = function(e: ProgressEvent) {
            that.setProperty("value", reader.result as string);
        }
        reader.readAsText(file);
    }
}

LiteGraph.registerNodeType({
    class: ConstantString,
    title: "Const String",
    desc: "Constant string",
    type: "basic/string"
})

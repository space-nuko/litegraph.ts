import { BuiltInSlotType, clamp, IComboWidget, LGraphNode, LiteGraph, MouseEventExt, SlotLayout, Vector2 } from "@litegraph-ts/core";

export interface WidgetComboProperties extends Record<string, any> {
    value: string,
    values: string
}

export default class WidgetCombo extends LGraphNode {
    override properties: WidgetComboProperties = {
        value: "A",
        values: "A;B;C"
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: [
            { name: "", type: "string" },
            { name: "change", type: BuiltInSlotType.EVENT }
        ]
    }

    override size: Vector2 = [80, 60];

    old_y: number = -1;
    mouse_captured: boolean = false;
    private _values: string[] = [];

    widget: IComboWidget;

    constructor(title?: string) {
        super(title);
        this._values = this.properties.values.split(";");
        this.widget = this.addWidget("combo", "", this.properties.value, (v: any) => {
            this.properties.value = v;
            this.triggerSlot(1, v);
        }, { property: "value", values: this._values });
        this.widgets_up = true;
    }

    override onExecute() {
        this.setOutputData(0, this.properties.value);
    }

    override onPropertyChanged(name: string, value: any) {
        if (name == "values") {
            this._values = value.split(";");
            this.widget.options.values = this._values;
        }
        else if (name == "value") {
            this.widget.value = value;
        }
    };
}

LiteGraph.registerNodeType({
    class: WidgetCombo,
    title: "Combo",
    desc: "Widget to select from a list",
    type: "widget/combo"
})

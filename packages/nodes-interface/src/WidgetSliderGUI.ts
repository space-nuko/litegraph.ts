import { BuiltInSlotType, clamp, IComboWidget, ISliderWidget, LGraphNode, LiteGraph, MouseEventExt, SlotLayout, Vector2 } from "@litegraph-ts/core";

export interface WidgetSliderGUIProperties extends Record<string, any> {
    value: number,
    min: number,
    max: number,
    text: string
}

export default class WidgetSliderGUI extends LGraphNode {
    override properties: WidgetSliderGUIProperties = {
        value: 0.5,
        min: 0,
        max: 1,
        text: "V"
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: [
            { name: "", type: "number" },
            { name: "change", type: BuiltInSlotType.EVENT }
        ]
    }

    override size: Vector2 = [140, 40];

    slider: ISliderWidget;

    constructor(title?: string) {
        super(title);
        this.slider = this.addWidget("slider", "V", this.properties.value, "value")
    }

    override onPropertyChanged(name: string, value: any) {
        if (name == "value") {
            this.slider.value = value;
            this.triggerSlot(1, value)
        }
    };

    override onExecute() {
        this.setOutputData(0, this.properties.value);
    };
}

LiteGraph.registerNodeType({
    class: WidgetSliderGUI,
    title: "Inner Slider",
    desc: "Slider widget that outputs a number",
    type: "widget/internal_slider"
})

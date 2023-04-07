import { BuiltInSlotShape, ITextWidget, IWidget, LGraphNode, LiteGraph, OptionalSlots, PropertyLayout, SlotLayout, Vector2 } from "@litegraph-ts/core"
import Watch from "./Watch"

export interface ConstantJSONProperties extends Record<string, any> {
    value: string,
    type: string,
}

/*
 * Equivalent to ConstantData/ConstantArray in litegraph.js
 */
export default class ConstantJSON extends LGraphNode {
    override properties: ConstantJSONProperties = {
        json: "",
        value: "",
        type: "object"
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: [
            { name: "data", type: "object" }
        ]
    }

    static propertyLayout: PropertyLayout = [
        { name: "json", defaultValue: "" },
        { name: "value", defaultValue: "" },
        { name: "type", defaultValue: "object" }
    ]

    static optionalSlots: OptionalSlots = {
    }

    jsonWidget: ITextWidget;
    valueWidget: IWidget;
    typeWidget: ITextWidget;

    override size: Vector2 = [140, 30];

    private _value: any;
    private _type: any;

    constructor(title?: string) {
        super(title)
        this.jsonWidget = this.addWidget("text", "json", "", "json");
        this.valueWidget = this.addWidget("text", "value", "", "value");
        this.valueWidget.disabled = true;
        this.typeWidget = this.addWidget("text", "type", this.properties.type, "type");
        this.typeWidget.disabled = true;
        this.widgets_up = true;
        this._value = null;
    }

    getType(): string {
        if (Array.isArray(this._value)) {
            return "array";
        }
        else {
            return typeof this._value;
        }
    }

    updateType() {
        var type = this.getType();
        this.typeWidget.value = "" + type;

        //update output
        if (this.outputs[0].type != type) {
            if (!LiteGraph.isValidConnection(this.outputs[0].type, type))
                this.disconnectOutput(0);
            this.outputs[0].type = type;
        }

        this.valueWidget.value = this._value;
        this.outputs[0].shape = BuiltInSlotShape.DEFAULT;

        if (type == "number") {
            this.valueWidget.type = "number";
        }
        else if (type == "boolean") {
            this.valueWidget.type = "toggle";
        }
        else if (type == "string") {
            this.valueWidget.type = "text";
        }
        else if (type == "object" || type == "array") {
            this.valueWidget.type = "text";
            this.valueWidget.value = Watch.toString(this._value);
            if (type == "array") {
                this.outputs[0].shape = BuiltInSlotShape.GRID_SHAPE;
            }
        }
        else {
            this.valueWidget.type = null;
        }
        this.properties.value = this.valueWidget.value;
    }

    override onPropertyChanged(name: string, value: any) {
        if (name == "json") {
            this.jsonWidget.value = value;
            if (value == null || value == "") {
                return
            }

            try {
                this._value = JSON.parse(value);
                this.boxcolor = "#AEA";
                this.updateType();
            }
            catch (err) {
                this.boxcolor = "red";
            }
        }
        else if (name == "type") {
            this.updateType();
        }
    }

    override onExecute() {
        this.setOutputData(0, this._value);
    }

    setValue(v: any) {
        this.setProperty("value", v);
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
    type: ConstantJSON,
    title: "Const JSON",
    desc: "Parses a string to JSON object",
    typeName: "basic/json"
})

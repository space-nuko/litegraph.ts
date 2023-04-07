import type { default as IWidget, ITextWidget } from "../IWidget";
import type { SlotLayout } from "../LGraphNode";
import LGraphNode from "../LGraphNode";
import LiteGraph from "../LiteGraph";
import type { SlotType, Vector2 } from "../types";
import { BuiltInSlotType } from "../types";

export interface GraphInputProperties extends Record<string, any> {
    name: string,
    type: SlotType,
    value: any
}

export default class GraphInput extends LGraphNode {
    override properties: GraphInputProperties = {
        name: "",
        type: "number",
        value: 0
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "", type: "number" }
        ],
        outputs: []
    }

    nameWidget: ITextWidget;
    typeWidget: ITextWidget;
    valueWidget: IWidget;

    nameInGraph: string = "";

    override size: Vector2 = [180, 90];

    constructor(title?: string) {
        super(title)

        let that = this;

        this.nameWidget = this.addWidget(
            "text",
            "Name",
            this.properties.name,
            function(v) {
                if (!v) {
                    return
                }
                that.setProperty("name", v);
            }
        );

        this.typeWidget = this.addWidget(
            "text",
            "Type",
            "" + this.properties.type,
            function(v) {
                if (!v) {
                    return
                }
                that.setProperty("type", v);
            }
        );

        this.valueWidget = this.addWidget(
            "number",
            "Value",
            this.properties.value,
            function(v) {
                that.setProperty("value", v);
            }
        );

        this.widgets_up = true;
    }

    override onConfigure() {
        this.updateType();
    }

    /** ensures the type in the node output and the type in the associated graph input are the same */
    updateType() {
        var type = this.properties.type;
        this.typeWidget.value = "" + type;

        //update output
        if (this.outputs[0].type != type) {
            if (!LiteGraph.isValidConnection(this.outputs[0].type, type))
                this.disconnectOutput(0);
            this.outputs[0].type = type;
        }

        //update widget
        if (type == "number") {
            this.valueWidget.type = "number";
            this.valueWidget.value = 0;
        }
        else if (type == "boolean") {
            this.valueWidget.type = "toggle";
            this.valueWidget.value = true;
        }
        else if (type == "string") {
            this.valueWidget.type = "text";
            this.valueWidget.value = "";
        }
        else {
            this.valueWidget.type = null;
            this.valueWidget.value = null;
        }
        this.properties.value = this.valueWidget.value;

        //update graph
        if (this.graph && this.nameInGraph && typeof type === "string") {
            this.graph.changeInputType(this.nameInGraph, type);
        }
        else {
            console.error("Can't change GraphInput to type", type, this.graph, this.nameInGraph)
        }
    }

    /** this is executed AFTER the property has changed */
    override onPropertyChanged(name: string, value: any) {
        if (name == "name") {
            if (value == "" || value == this.nameInGraph || value == "enabled") {
                return false;
            }
            if (this.graph) {
                if (this.nameInGraph) {
                    //already added
                    this.graph.renameInput(this.nameInGraph, value);
                } else {
                    this.graph.addInput(value, "" + this.properties.type, null);
                }
            } //what if not?!
            this.nameWidget.value = value;
            this.nameInGraph = value;
        }
        else if (name == "type") {
            this.updateType();
        }
        else if (name == "value") {
        }
    }

    override getTitle(): string {
        if (this.flags.collapsed) {
            return this.properties.name;
        }
        return this.title;
    }

    override onAction(action: any, param: any) {
        if (this.properties.type == BuiltInSlotType.EVENT) {
            this.triggerSlot(0, param);
        }
    }

    override onExecute() {
        var name = this.properties.name;
        //read from global input
        var data = this.graph.inputs[name];
        if (!data) {
            this.setOutputData(0, this.properties.value);
            return;
        }

        this.setOutputData(0, data.value !== undefined ? data.value : this.properties.value);
    }

    override onRemoved() {
        if (this.nameInGraph) {
            this.graph.removeInput(this.nameInGraph);
        }
    }
}

LiteGraph.registerNodeType({
    class: GraphInput,
    title: "Input",
    desc: "Input of the graph",
    type: "graph/input"
})

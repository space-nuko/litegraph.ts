import type { default as IWidget, ITextWidget } from "../IWidget";
import { IComboWidget } from "../IWidget";
import type { SlotLayout } from "../LGraphNode";
import LGraphNode from "../LGraphNode";
import LiteGraph from "../LiteGraph";
import { BASE_SLOT_TYPES, BuiltInSlotShape, NodeID, SlotType, Vector2 } from "../types";
import { BuiltInSlotType } from "../types";
import { UUID } from "../types";
import { getLitegraphTypeName, isValidLitegraphType } from "../utils";
import Subgraph from "./Subgraph";

export interface GraphInputProperties extends Record<string, any> {
    name: string,
    type: SlotType,
    value: any,
    subgraphID: NodeID | null
}

export function getSlotTypesIn(): string[] {
    let result = []
    result = result.concat(BASE_SLOT_TYPES)
    result = result.concat([BuiltInSlotType.ACTION])
    result = result.concat(LiteGraph.slot_types_in.map(ty => ty.toUpperCase()))
    return result
}

export function getSlotTypesInFormatted(): string[] {
    return getSlotTypesIn().map(getLitegraphTypeName);
}

export default class GraphInput extends LGraphNode {
    override properties: GraphInputProperties = {
        name: "",
        type: "number",
        value: 0,
        subgraphID: null
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: [
            { name: "", type: "number" }
        ]
    }

    nameWidget: ITextWidget;
    typeWidget: IWidget;
    valueWidget: IWidget;

    nameInGraph: string = "";

    override clonable = false;
    override size: Vector2 = [180, 90];

    constructor(title?: string) {
        super(title)

        let that = this;

        this.nameWidget = this.addWidget(
            "text",
            "Name",
            this.properties.name,
            this.setName.bind(this),
        );

        if (LiteGraph.graph_inputs_outputs_use_combo_widget) {
            this.typeWidget = this.addWidget<IComboWidget>(
                "combo",
                "Type",
                getLitegraphTypeName(this.properties.type),
                this.setType.bind(this),
                { values: getSlotTypesInFormatted }
            );
        }
        else {
            this.typeWidget = this.addWidget<ITextWidget>(
                "text",
                "Type",
                getLitegraphTypeName(this.properties.type),
                this.setType.bind(this),
            );
        }

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

    setName(v: string) {
        if (v == null || v === this.properties.name) {
            return
        }
        const subgraph = this.getParentSubgraph();
        if (!subgraph)
            return;
        v = subgraph.getValidGraphInputName(v);
        this.setProperty("name", v);
    }

    setType(v: string) {
        if (!v) {
            v = "*"
        }

        let type: SlotType = v;
        if (v === "-1" || v === "Action")
            type = BuiltInSlotType.ACTION
        else if (v === "-2" || v === "Event")
            type = BuiltInSlotType.EVENT
        else if (v === "0")
            type = "*"

        this.setProperty("type", type);
    }

    override onConfigure() {
        this.updateType();
    }

    getParentSubgraph(): Subgraph | null {
        return this.graph._subgraph_node?.graph?.getNodeById(this.properties.subgraphID);
    }

    /** ensures the type in the node output and the type in the associated graph input are the same */
    updateType() {
        var type = this.properties.type;
        this.typeWidget.value = getLitegraphTypeName(type)
        const output = this.outputs[0];

        //update output
        if (output.type != type) {
            if (!LiteGraph.isValidConnection(output.type, type))
                this.disconnectOutput(0);
            output.type = type;
        }

        if (type == "array") {
            output.shape = BuiltInSlotShape.GRID_SHAPE;
        }
        else if (type === BuiltInSlotType.EVENT || type === BuiltInSlotType.ACTION) {
            output.shape = BuiltInSlotShape.BOX_SHAPE;
        }
        else {
            output.shape = BuiltInSlotShape.DEFAULT;
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
        if (this.graph && this.nameInGraph && isValidLitegraphType(type)) {
            this.graph.changeInputType(this.nameInGraph, type);
            if (output.type !== type) {
                this.setOutputDataType(0, type);
            }
        }
        else {
            console.error("[GraphInput] Can't change output to type", type, this.graph, this.nameInGraph)
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
    type: "graph/input",
    hide_in_node_lists: true
})

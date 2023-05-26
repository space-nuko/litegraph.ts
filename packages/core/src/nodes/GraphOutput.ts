import type { default as IWidget, ITextWidget, IComboWidget } from "../IWidget";
import type { LActionOptions, SlotLayout } from "../LGraphNode";
import LGraphNode from "../LGraphNode";
import LiteGraph from "../LiteGraph";
import { BASE_SLOT_TYPES, BuiltInSlotShape, NodeID, SlotType, Vector2 } from "../types";
import { BuiltInSlotType } from "../types";
import { UUID } from "../types";
import { getLitegraphTypeName, isValidLitegraphType } from "../utils";
import Subgraph from "./Subgraph";

export interface GraphOutputProperties extends Record<string, any> {
    name: string,
    type: SlotType,
    subgraphID: NodeID | null
}

export function getSlotTypesOut(): string[] {
    let result = []
    result = result.concat(BASE_SLOT_TYPES)
    result = result.concat([BuiltInSlotType.EVENT])
    result = result.concat(LiteGraph.slot_types_out)
    return result
}

export function getSlotTypesOutFormatted(): string[] {
    return getSlotTypesOut().map(getLitegraphTypeName);
}

export default class GraphOutput extends LGraphNode {
    override properties: GraphOutputProperties = {
        name: "",
        type: "number",
        subgraphID: null
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "", type: "" }
        ],
        outputs: []
    }

    nameWidget: ITextWidget;
    typeWidget: IWidget;

    nameInGraph: string = "";

    override clonable = false;
    override size: Vector2 = [180, 60];

    constructor(title?: string) {
        super(title)

        let that = this;

        this.nameWidget = this.addWidget(
            "text",
            "Name",
            this.properties.name,
            this.setName.bind(this)
        );

        if (LiteGraph.graph_inputs_outputs_use_combo_widget) {
            this.typeWidget = this.addWidget<IComboWidget>(
                "combo",
                "Type",
                getLitegraphTypeName(this.properties.type),
                this.setType.bind(this),
                { values: getSlotTypesOutFormatted }
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

        this.widgets_up = true;
    }

    setName(v: string) {
        if (v == null || v === this.properties.name) {
            return
        }
        const subgraph = this.getParentSubgraph();
        if (!subgraph)
            return;
        v = subgraph.getValidGraphOutputName(v);
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

    updateType() {
        var type = this.properties.type;
        const input = this.inputs[0]
        if (this.typeWidget)
            this.typeWidget.value = getLitegraphTypeName(type);

        if (type == "array") {
            input.shape = BuiltInSlotShape.GRID_SHAPE;
        }
        else if (type === BuiltInSlotType.EVENT || type === BuiltInSlotType.ACTION) {
            input.shape = BuiltInSlotShape.BOX_SHAPE;
        }
        else {
            input.shape = BuiltInSlotShape.DEFAULT;
        }

        //update output
        if (input.type != type) {

            if (type == "action" || type == "event")
                type = BuiltInSlotType.EVENT;
            if (!LiteGraph.isValidConnection(input.type, type))
                this.disconnectInput(0);
            input.type = type;
        }

        //update graph
        if (this.graph && this.nameInGraph && isValidLitegraphType(type)) {
            this.graph.changeOutputType(this.nameInGraph, type);
            if (input.type !== type) {
                this.setInputDataType(0, type);
            }
        }
        else {
            console.error("Can't change GraphOutput to type", type, this.graph, this.nameInGraph)
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
                    this.graph.renameOutput(this.nameInGraph, value);
                } else {
                    this.graph.addOutput(value, "" + this.properties.type, null);
                }
            } //what if not?!
            else {
                console.error("[GraphOutput] missing graph!", name, value)
            }
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

    override onAction(action: any, param: any, options: LActionOptions) {
        // if (this.properties.type == BuiltInSlotType.ACTION) {
        //     this.graph.trigger(this.properties.name, param);
        // }

        const subgraph = this.getParentSubgraph();
        if (!subgraph)
            return;

        const outerIndex = subgraph.findOutputSlotIndexByName(this.properties.name);
        if (outerIndex == null)
            return

        const outer = subgraph.outputs[outerIndex]
        if (outer == null /* || outer.type !== BuiltInSlotType.EVENT */)
            return

        // console.debug("[GraphOutput] Trigger slot!", subgraph, outerIndex, outer, action, param);
        subgraph.triggerSlot(outerIndex, param);
    }

    override onExecute() {
        const value = this.getInputData(0);
        this.graph.setOutputData(this.properties.name, value);
    }

    override onRemoved() {
        if (this.nameInGraph) {
            this.graph.removeOutput(this.nameInGraph);
        }
    }
}

LiteGraph.registerNodeType({
    class: GraphOutput,
    title: "Output",
    desc: "Output of the graph",
    type: "graph/output",
    hide_in_node_lists: true
})

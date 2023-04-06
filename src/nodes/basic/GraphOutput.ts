import { default as LGraphNode, SlotLayout } from "../../LGraphNode"
import LiteGraph from "../../LiteGraph"
import { default as IWidget, ITextWidget } from "../../IWidget"
import { BuiltInSlotType, SlotType, Vector2 } from "../../types";

export interface GraphOutputProperties extends Record<string, any> {
    name: string,
    type: SlotType,
}

export default class GraphOutput extends LGraphNode {
    override properties: GraphOutputProperties = {
        name: "",
        type: "number",
    }

    static slotLayout: SlotLayout = {
        inputs: [
            {name: "", type: ""}
        ],
        outputs: []
    }

    nameWidget: ITextWidget;
    typeWidget: ITextWidget;

    nameInGraph: string = "";

    override size: Vector2 = [180, 60];

    constructor(title?: string) {
        super(title)

        let that = this;

        this.nameWidget = this.addWidget("text", "Name", this.properties.name, "name");
        this.typeWidget = this.addWidget("text", "Type", "" + this.properties.type, "type");

        this.widgets_up = true;
    }

    override onConfigure() {
        this.updateType();
    }

    updateType() {
        var type = this.properties.type;
        if (this.typeWidget)
            this.typeWidget.value = "" + type;

        //update output
        if (this.inputs[0].type != type) {

			if ( type == "action" || type == "event")
	            type = BuiltInSlotType.EVENT;
			if (!LiteGraph.isValidConnection(this.inputs[0].type, type))
				this.disconnectInput(0);
			this.inputs[0].type = type;
        }

        //update graph
		if (this.graph && this.nameInGraph && typeof type === "string") {
			this.graph.changeOutputType(this.nameInGraph, type);
		}
        else {
            console.error("Can't change GraphOutput to type", type, this.graph, this.nameInGraph)
        }
    }

	/** this is executed AFTER the property has changed */
	override onPropertyChanged(name: string, value: any)
	{
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
        if (this.properties.type == BuiltInSlotType.ACTION) {
            this.graph.trigger(this.properties.name, param);
        }
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
    type: GraphOutput,
    title: "Output",
    desc: "Output of the graph",
    typeName: "graph/output"
})
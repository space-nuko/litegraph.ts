import { BuiltInSlotShape, LGraphNode, LiteGraph, OptionalSlots, PropertyLayout, SlotLayout, Vector2 } from "@litegraph-ts/core"

export default class Reroute extends LGraphNode {
    static slotLayout: SlotLayout = {
        inputs: [
            { name: "", type: "" },
        ],
        outputs: [
            { name: "", type: "" }
        ]
    }

    static overrideSize = [40, 30];
    override resizable: boolean = false;

    constructor(title?: string) {
        super(" ")
    }

    override onExecute() {
        this.setOutputData(0, this.getInputData(0));
    }
}

LiteGraph.registerNodeType({
    class: Reroute,
    title: "Reroute",
    desc: "Simple pass-through for organization",
    type: "basic/reroute"
})

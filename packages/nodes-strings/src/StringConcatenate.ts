import { LGraphNode, LiteGraph, SlotLayout } from "@litegraph-ts/core";

export default class StringConcatenate extends LGraphNode {
    static slotLayout: SlotLayout = {
        inputs: [
            { name: "A", type: "string" },
            { name: "B", type: "string" },
        ],
        outputs: [
            { name: "out", type: "string" },
        ],
    }

    override onExecute() {
        const value = this.getInputData(0) + this.getInputData(1)
        this.setOutputData(0, value);
    };
}

LiteGraph.registerNodeType({
    class: StringConcatenate,
    title: "Concatenate",
    desc: "Concatenates strings",
    type: "string/concatenate"
})

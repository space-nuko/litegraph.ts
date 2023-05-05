import { LGraphNode, LiteGraph, SlotLayout } from "@litegraph-ts/core";

export default class StringContains extends LGraphNode {
    static slotLayout: SlotLayout = {
        inputs: [
            { name: "A", type: "string" },
            { name: "B", type: "string" },
        ],
        outputs: [
            { name: "contains", type: "string" },
        ],
    }

    override onExecute() {
        const a = this.getInputData(0)
        const b = this.getInputData(1)
        if (a == null || b == null) {
            this.setOutputData(0, false)
        }
        else {
            const value = a.indexOf(b) !== -1;
            this.setOutputData(0, b)
        }
    };
}

LiteGraph.registerNodeType({
    class: StringContains,
    title: "Contains",
    desc: "Calls a.indexOf(b)",
    type: "string/contains"
})

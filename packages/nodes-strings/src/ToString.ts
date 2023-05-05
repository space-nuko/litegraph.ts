import { LGraphNode, LiteGraph, SlotLayout } from "@litegraph-ts/core";

export default class ToString extends LGraphNode {
    static slotLayout: SlotLayout = {
        inputs: [
            { name: "in", type: "" },
        ],
        outputs: [
            { name: "out", type: "string" },
        ],
    }

    override onExecute() {
        const a = this.getInputData(0);
        let b: string = ""

        if (a && a.constructor === Object) {
            try {
                b = JSON.stringify(a);
            }
            catch (err) {
                b = String(a);
            }
        }
        else {
            b = String(a);
        }

        this.setOutputData(0, b)
    };
}

LiteGraph.registerNodeType({
    class: ToString,
    title: "ToString",
    desc: "Calls .toString()",
    type: "string/toString"
})

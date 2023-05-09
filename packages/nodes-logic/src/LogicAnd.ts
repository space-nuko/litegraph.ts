import { LGraphNode, LiteGraph, SlotLayout } from "@litegraph-ts/core";

export default class LogicAnd extends LGraphNode {
    static slotLayout: SlotLayout = {
        inputs: [
            { name: "a", type: "boolean" },
            { name: "b", type: "boolean" },
        ],
        outputs: [
            { name: "out", type: "boolean" },
        ],
    }

    override onExecute() {
        let ret = true;
        for (let inX = 0; inX < this.inputs.length; inX++) {
            if (!this.getInputData(inX)) {
                ret = false;
                break;
            }
        }
        this.setOutputData(0, ret);
    };
}

LiteGraph.registerNodeType({
    class: LogicAnd,
    title: "AND",
    desc: "Return true if all inputs are true",
    type: "logic/AND"
})

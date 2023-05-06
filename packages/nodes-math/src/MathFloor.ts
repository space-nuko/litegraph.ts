import { LGraphNode, LiteGraph, SlotLayout, Vector2 } from "@litegraph-ts/core";

export default class MathFloor extends LGraphNode {
    static slotLayout: SlotLayout = {
        inputs: [
            { name: "in", type: "number" },
        ],
        outputs: [
            { name: "out", type: "number" },
        ],
    }

    override size: Vector2 = [80, 30];

    override onExecute() {
        var v = this.getInputData(0);
        if (v == null) {
            return;
        }
        this.setOutputData(0, Math.floor(v));
    };
}

LiteGraph.registerNodeType({
    class: MathFloor,
    title: "Floor",
    desc: "Floor number to remove fractional part",
    type: "math/floor"
})

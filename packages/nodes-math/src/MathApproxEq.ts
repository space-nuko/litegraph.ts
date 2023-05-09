import { LGraphNode, LiteGraph, SlotLayout, Vector2 } from "@litegraph-ts/core";

export interface MathOperationProperties extends Record<string, any> {
    epsilon: 0.001
}

export default class MathApproxEq extends LGraphNode {
    static slotLayout: SlotLayout = {
        inputs: [
            { name: "A", type: "number" },
            { name: "B", type: "number" },
            { name: "epsilon", type: "number" },
        ],
        outputs: [
            { name: "true", type: "boolean" },
            { name: "false", type: "boolean" },
        ],
    }

    override size: Vector2 = [80, 30];

    private static approxEq(a: number, b: number, epsilon: number) {
        if (epsilon == null) {
            epsilon = 0.001;
        }
        return Math.abs(a - b) < epsilon;
    };

    override onExecute() {
        const A = this.getInputData(0);
        const B = this.getInputData(1);
        if (A == null || B == null) {
            return;
        }
        const epsilon = this.getInputData(2) || this.properties.epsilon;
        const v = MathApproxEq.approxEq(A, B, epsilon)
        this.setOutputData(0, v);
        this.setOutputData(1, !v);
    };
}

LiteGraph.registerNodeType({
    class: MathApproxEq,
    title: "Approx. Eq",
    desc: "Check if two floating-point numbers are approximately equal",
    type: "math/approx_eq"
})

import { LGraphNode, LiteGraph, SlotLayout } from "@litegraph-ts/core";

export interface StringToFixedProperties extends Record<string, any> {
    precision: number
}

export default class StringToFixed extends LGraphNode {
    override properties: StringToFixedProperties = {
        precision: 0
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "in", type: "number" },
        ],
        outputs: [
            { name: "out", type: "string" },
        ],
    }

    override onExecute() {
        const a = this.getInputData(0)

        if (a != null && a.constructor === Number) {
            const value = a.toFixed(this.properties.precision);
            this.setOutputData(0, value)
        }
        else {
            this.setOutputData(0, `"${a}"`)
        }
    };
}

LiteGraph.registerNodeType({
    class: StringToFixed,
    title: "ToFixed",
    desc: "Calls in.toFixed()",
    type: "string/toFixed"
})

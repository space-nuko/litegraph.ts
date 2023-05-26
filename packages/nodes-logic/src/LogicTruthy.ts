import type { PropertyLayout, SlotLayout } from "@litegraph-ts/core"
import { LGraphNode, LiteGraph } from "@litegraph-ts/core"

export default class LogicTruthy extends LGraphNode {
    static slotLayout: SlotLayout = {
        inputs: [
            { name: "in", type: "*" },
        ],
        outputs: [
            { name: "truthy", type: "boolean" },
        ]
    }

    static propertyLayout: PropertyLayout = [
    ]

    override onExecute() {
        const input = this.getInputData(0)
        this.setOutputData(0, Boolean(input))
    }
}

LiteGraph.registerNodeType({
    class: LogicTruthy,
    title: "~= TRUE",
    desc: "Returns true if input is truthy",
    type: "logic/truthy"
})

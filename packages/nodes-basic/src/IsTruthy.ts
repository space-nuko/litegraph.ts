import type { PropertyLayout, SlotLayout } from "@litegraph-ts/core"
import { LGraphNode, LiteGraph } from "@litegraph-ts/core"

export default class IsTruthy extends LGraphNode {
    static slotLayout: SlotLayout = {
        inputs: [
            { name: "in", type: "*" },
        ],
        outputs: [
            { name: "is_truthy", type: "boolean" },
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
    class: IsTruthy,
    title: "~= true",
    desc: "Returns true if input is truthy",
    type: "basic/is_truthy"
})

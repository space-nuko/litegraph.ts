import type { PropertyLayout, SlotLayout } from "@litegraph-ts/core"
import { LGraphNode, LiteGraph } from "@litegraph-ts/core"

export interface IsNullProperties extends Record<string, any> {
    strictEquality: boolean
}

export default class IsNull extends LGraphNode {
    override properties: IsNonNullProperties = {
        strictEquality: true
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "in", type: "*" },
        ],
        outputs: [
            { name: "is_null", type: "boolean" },
        ]
    }

    static propertyLayout: PropertyLayout = [
    ]

    override onExecute() {
        const input = this.getInputData(0)
        const isNull = this.properties.strictEquality ? input === null : input == null;
        this.setOutputData(0, isNull)
    }
}

LiteGraph.registerNodeType({
    class: IsNull,
    title: "== Null",
    desc: "Returns true if input is null",
    type: "basic/is_null"
})

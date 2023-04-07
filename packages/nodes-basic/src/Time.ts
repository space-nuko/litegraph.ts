import type { PropertyLayout, SlotLayout } from "@litegraph-ts/core"
import { LGraphNode, LiteGraph } from "@litegraph-ts/core"

export interface TimeProperties extends Record<string, any> {
    enabled: boolean
}

export default class Time extends LGraphNode {
    override properties: TimeProperties = {
        enabled: true
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: [
            { name: "in ms", type: "number" },
            { name: "in sec", type: "number" }
        ]
    }

    static propertyLayout: PropertyLayout = [
        { name: "enabled", defaultValue: true }
    ]

    override onExecute() {
        this.setOutputData(0, this.graph.globaltime * 1000);
        this.setOutputData(1, this.graph.globaltime);
    }
}

LiteGraph.registerNodeType({
    class: Time,
    title: "Time",
    desc: "Current time",
    type: "basic/time"
})

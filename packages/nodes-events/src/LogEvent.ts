import { BuiltInSlotType, LGraphNode, LiteGraph, OptionalSlots, PropertyLayout, SlotLayout, Vector2 } from "@litegraph-ts/core"

export interface LogEventProperties extends Record<string, any> {
}

export default class LogEvent extends LGraphNode {
    override properties: LogEventProperties = {
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "event", type: BuiltInSlotType.ACTION },
        ],
    }

    static propertyLayout: PropertyLayout = [
    ]

    static optionalSlots: OptionalSlots = {
    }

    override size: Vector2 = [60, 30];

    override onAction(action: any, param: any, options: { action_call?: string }) {
        console.log("[LogEvent] Event received:", action, param, options);
    }
}

LiteGraph.registerNodeType({
    class: LogEvent,
    title: "Log Event",
    desc: "Log event in console",
    type: "events/log"
})

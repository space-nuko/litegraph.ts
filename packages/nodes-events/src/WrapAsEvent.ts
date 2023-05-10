import { BuiltInSlotType, LGraphNode, LiteGraph, SlotLayout, Vector2 } from "@litegraph-ts/core"

export interface WrapAsEventProperties extends Record<string, any> {
}

export default class WrapAsEvent extends LGraphNode {
    override properties: WrapAsEventProperties = {
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "trigger", type: BuiltInSlotType.ACTION },
            { name: "param", type: "" },
        ],
        outputs: [
            { name: "event", type: BuiltInSlotType.EVENT },
        ],
    }

    override onAction(action: any, param: any, options: { action_call?: string }) {
        var v = this.getInputData(1);
        this.triggerSlot(0, v, null, options);
    }
}

LiteGraph.registerNodeType({
    class: WrapAsEvent,
    title: "Wrap As Event",
    desc: "Triggers an event setting its parameter to the input value",
    type: "events/wrap_as_event"
})

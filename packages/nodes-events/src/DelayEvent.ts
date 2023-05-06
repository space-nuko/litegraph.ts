import { BuiltInSlotType, LGraphNode, LiteGraph, OptionalSlots, PropertyLayout, SlotLayout, Vector2 } from "@litegraph-ts/core"

export interface DelayEventProperties extends Record<string, any> {
    timeInMs: number
}

export default class DelayEvent extends LGraphNode {
    override properties: DelayEventProperties = {
        timeInMs: 1000
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "event", type: BuiltInSlotType.ACTION },
        ],
        outputs: [
            { name: "on_time", type: BuiltInSlotType.EVENT },
        ],
    }

    private _pending: [number, any][] = [];

    static propertyLayout: PropertyLayout = [
    ]

    static optionalSlots: OptionalSlots = {
    }

    override size: Vector2 = [60, 30];

    override onAction(action: any, param: any, options: { action_call?: string }) {
        var time = this.properties.timeInMs;
        if (time <= 0) {
            this.trigger(null, param, options);
        } else {
            this._pending.push([time, param]);
        }
    }

    override onExecute(param: any, options: object) {
        var dt = this.graph.elapsed_time * 1000; //in ms

        if (this.isInputConnected(1)) {
            this.properties.time_in_ms = this.getInputData(1);
        }

        for (var i = 0; i < this._pending.length; ++i) {
            var actionPass = this._pending[i];
            actionPass[0] -= dt;
            if (actionPass[0] > 0) {
                continue;
            }

            //remove
            this._pending.splice(i, 1);
            --i;

            //trigger
            this.trigger(null, actionPass[1], options);
        }
    }
}

LiteGraph.registerNodeType({
    class: DelayEvent,
    title: "Delay",
    desc: "Delays one event",
    type: "events/delay"
})

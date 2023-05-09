import { BuiltInSlotType, LGraphNode, LiteGraph, OptionalSlots, PropertyLayout, SlotLayout, IButtonWidget, Vector2, LConnectionKind, LLink, INodeInputSlot, INodeOutputSlot } from "@litegraph-ts/core"

export default class Sequence extends LGraphNode {
    static slotLayout: SlotLayout = {
        inputs: [
            { name: "", type: BuiltInSlotType.ACTION },
        ],
        outputs: [
            { name: "", type: BuiltInSlotType.EVENT },
        ],
    }

    override size: Vector2 = [90, 70];
    // override render_box = false

    constructor(title?: string) {
        super(title)
    }

    override getTitle(): string {
        if (this.horizontal)
            return "";
        else
            return this.title
    }

    override onAction(action: any, param: any, options: { action_call?: string }) {
        if (this.outputs) {
            options = options || {};
            for (var i = 0; i < this.outputs.length; ++i) {
                //needs more info about this...
                if (options.action_call) // CREATE A NEW ID FOR THE ACTION
                    options.action_call = options.action_call + "_seq_" + i;
                else
                    options.action_call = this.id + "_" + (action ? action : "action") + "_seq_" + i + "_" + Math.floor(Math.random() * 9999);
                this.triggerSlot(i, param, null, options);
            }
        }
    }

    override onConnectionsChange(
        type: LConnectionKind,
        slotIndex: number,
        isConnected: boolean,
        link: LLink,
        ioSlot: (INodeInputSlot | INodeOutputSlot)
    ) {
        const isInput = type === LConnectionKind.INPUT
        const slots = type === LConnectionKind.INPUT ? this.inputs : this.outputs;

        const getLinkCount = (i: number) => {
            if (isInput)
                return this.getInputLink(slots.length - 1) ? 1 : 0
            else
                return this.getOutputLinks(slots.length - 1).length
        }

        const addSlot = () => {
            if (isInput)
                this.addInput("", BuiltInSlotType.ACTION)
            else
                this.addOutput("", BuiltInSlotType.EVENT)
        }

        if (isConnected) {
            if (link != null && slotIndex === slots.length - 1) {
                addSlot()
            }
        }
        else {
            if (getLinkCount(slots.length - 1) > 0)
                return;

            // Remove empty inputs
            for (let i = slots.length - 1; i > 0; i--) {
                if (i <= 0)
                    break;

                if (getLinkCount(i) === 0) {
                    if (isInput)
                        this.removeInput(i)
                    else
                        this.removeOutput(i)
                }
                else {
                    break;
                }
            }

            // Readd extra to end
            if (getLinkCount(slots.length - 1) > 0) {
                addSlot()
            }
        }
    }
}

LiteGraph.registerNodeType({
    class: Sequence,
    title: "Sequence",
    desc: "Triggers a sequence of events when an event arrives",
    type: "events/sequence"
})

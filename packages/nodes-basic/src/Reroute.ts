import { LGraphNode, LiteGraph, SlotLayout, TitleMode } from "@litegraph-ts/core";

export default class Reroute extends LGraphNode {
    static slotLayout: SlotLayout = {
        inputs: [
            { name: "", type: "" },
        ],
        outputs: [
            { name: "", type: "" }
        ]
    }

    static overrideSize = [60, 30];
    override resizable: boolean = false;
    override titleMode: TitleMode = TitleMode.NO_TITLE;

    override onExecute() {
        this.setOutputData(0, this.getInputData(0));
    }
}

LiteGraph.registerNodeType({
    class: Reroute,
    title: "Reroute",
    desc: "Simple pass-through for organization",
    type: "basic/reroute"
})

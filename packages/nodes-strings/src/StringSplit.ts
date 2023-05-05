import { LGraphNode, LiteGraph, SlotLayout } from "@litegraph-ts/core";

export interface StringSplitProperties extends Record<string, any> {
    separator: string
}

export default class StringSplit extends LGraphNode {
    override properties: StringSplitProperties = {
        separator: ","
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "in", type: "string,array" },
            { name: "sep", type: "string" },
        ],
        outputs: [
            { name: "out", type: "array" },
        ],
    }

    override onExecute() {
        const str = this.getInputData(0)
        let separator = this.getInputData(1)

        if (separator == null)
            separator = this.properties.separator;

        let value: string[] = []

        if (str == null)
            value = [];
        else if (str.constructor === String)
            value = str.split(separator || " ");
        else if (str.constructor === Array) {
            var r = [];
            for (var i = 0; i < str.length; ++i) {
                if (typeof str[i] == "string")
                    r[i] = str[i].split(separator || " ");
            }
            value = r;
        }
        else
            value = null;

        this.setOutputData(0, value)
    };
}

LiteGraph.registerNodeType({
    class: StringSplit,
    title: "Split",
    desc: "Calls str.split(sep || \" \")",
    type: "string/split"
})

import { INodeInputSlot, INodeOutputSlot, ITextWidget, LConnectionKind, LGraphNode, LiteGraph, LLink, PropertyLayout, SlotLayout } from "@litegraph-ts/core";

export interface JSONParseProperties extends Record<string, any> {
}

export default class JSONParse extends LGraphNode {
    override properties: JSONParseProperties = {
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "in", type: "string" },
        ],
        outputs: [
            { name: "out", type: "*" },
            { name: "error", type: "string" },
        ],
    }

    private _value: string = null;
    private _str: string | null = null;
    private _error: string | null = null;

    override onExecute() {
        const inputData = this.getInputData(0)
        if (inputData != this._str && typeof inputData === "string") {
            this._error = null;
            this._value = null;
            this._str = inputData
            try {
                this._value = JSON.parse(this._str)
                this.boxcolor = "#AEA";
            }
            catch (err) {
                this._error = `${err}`
                this.boxcolor = "red";
            }
        }
        else if (inputData == null) {
            this._str = null;
            this._value = null;
            this._error = null;
            this.boxcolor = LiteGraph.NODE_DEFAULT_BOXCOLOR;
        }
        this.setOutputData(0, this._value)
        this.setOutputData(1, this._error)
    };

    override onConnectionsChange(
        type: LConnectionKind,
        slotIndex: number,
        isConnected: boolean,
        link: LLink,
        ioSlot: (INodeInputSlot | INodeOutputSlot)
    ) {
        // Invalidate cached value
        this._str = null
    }
}

LiteGraph.registerNodeType({
    class: JSONParse,
    title: "JSON Parse",
    desc: "Parses a string into a JavaScript object",
    type: "string/json_parse"
})

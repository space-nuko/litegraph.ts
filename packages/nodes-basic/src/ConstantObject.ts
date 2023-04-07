import { LGraphNode, LiteGraph, OptionalSlots, PropertyLayout, SlotLayout, Vector2 } from "@litegraph-ts/core"

export interface ConstantObjectProperties extends Record<string, any> {
    value: string,
}

export default class ConstantObject extends LGraphNode {
    override properties: ConstantObjectProperties = {
        value: ""
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: [
            { name: "obj", type: "object" }
        ]
    }

    static propertyLayout: PropertyLayout = [
    ]

    static optionalSlots: OptionalSlots = {
    }

    override size: Vector2 = [120, 30];

    private _object: object;

    constructor(title?: string) {
        super(title)
        this._object = {}
    }

    override onExecute() {
        this.setOutputData(0, this._object);
    }
}

LiteGraph.registerNodeType({
    class: ConstantObject,
    title: "Const Object",
    desc: "Constant object",
    type: "basic/object"
})

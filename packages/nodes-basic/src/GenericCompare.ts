import { BuiltInSlotType, IComboWidget, PropertyLayout, SlotLayout } from "@litegraph-ts/core"
import { LGraphNode, LiteGraph } from "@litegraph-ts/core"

export interface GenericCompareProperties extends Record<string, any> {
    A: any
    B: any
    OP: "==" | "!=" | ">" | "<" | ">=" | "<=" | "||" | "&&"
}

export default class GenericCompare extends LGraphNode {
    override properties: GenericCompareProperties = {
        A: 1,
        B: 1,
        OP: "=="
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "A", type: BuiltInSlotType.DEFAULT },
            { name: "B", type: BuiltInSlotType.DEFAULT }
        ],
        outputs: [
            { name: "true", type: "boolean" },
            { name: "false", type: "boolean" }

        ]
    }

    static propertyLayout: PropertyLayout = [
        { name: "enabled", defaultValue: true }
    ]

    opWidget: IComboWidget;

    static values = ["==", "!=", ">", "<", ">=", "<=", "||", "&&"]

    constructor(name?: string) {
        super(name)
        this.opWidget = this.addWidget("combo", "Op.", this.properties.OP, null, { property: "OP", values: GenericCompare.values })
    }

    override getTitle() {
        return "*A " + this.properties.OP + " *B";
    };

    override onExecute() {
        var A = this.getInputData(0);
        if (A === undefined) {
            A = this.properties.A;
        } else {
            this.properties.A = A;
        }

        var B = this.getInputData(1);
        if (B === undefined) {
            B = this.properties.B;
        } else {
            this.properties.B = B;
        }

        var result = false;
        if (typeof A == typeof B) {
            switch (this.properties.OP) {
                case "==":
                case "!=":
                    // traverse both objects.. consider that this is not a true deep check! consider underscore or other library for thath :: _isEqual()
                    result = true;
                    switch (typeof A) {
                        case "object":
                            var aProps = Object.getOwnPropertyNames(A);
                            var bProps = Object.getOwnPropertyNames(B);
                            if (aProps.length != bProps.length) {
                                result = false;
                                break;
                            }
                            for (var i = 0; i < aProps.length; i++) {
                                var propName = aProps[i];
                                if (A[propName] !== B[propName]) {
                                    result = false;
                                    break;
                                }
                            }
                            break;
                        default:
                            result = A == B;
                    }
                    if (this.properties.OP == "!=") result = !result;
                    break;
                case ">":
                    result = A > B;
                    break;
                case "<":
                    result = A < B;
                    break;
                case "<=":
                    result = A <= B;
                    break;
                case ">=":
                    result = A >= B;
                    break;
                case "||":
                    result = A || B;
                    break;
                case "&&":
                    result = A && B;
                    break;
            }
        }
        this.setOutputData(0, result);
        this.setOutputData(1, !result);
    }
}

LiteGraph.registerNodeType({
    class: GenericCompare,
    title: "GenericCompare",
    desc: "Compare *",
    type: "basic/CompareValues"
})

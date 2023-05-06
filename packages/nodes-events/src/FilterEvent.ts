import { BuiltInSlotType, IComboWidget, ITextWidget, LGraphNode, LiteGraph, SlotLayout, Vector2 } from "@litegraph-ts/core";

export interface FilterEventProperties extends Record<string, any> {
    propertyName: string,
    compareValue: any,
    mode: "param" | "property",
    operation: "==" | "!=" | ">" | "<" | ">=" | "<=" | "||" | "&&"
}

export default class FilterEvent extends LGraphNode {
    override properties: FilterEventProperties = {
        compareValue: null,
        propertyName: "",
        mode: "param",
        operation: "=="
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "event", type: BuiltInSlotType.ACTION },
            { name: "compare_value", type: "*" },
        ],
        outputs: [
            { name: "accept", type: BuiltInSlotType.EVENT },
            { name: "reject", type: BuiltInSlotType.EVENT },
        ],
    }

    override size: Vector2 = [60, 30];

    static values = ["==", "!=", ">", "<", ">=", "<=", "||", "&&"]

    modeWidget: IComboWidget;
    propertyNameWidget: ITextWidget;
    opWidget: IComboWidget;
    compareValueWidget: ITextWidget;

    constructor(name?: string) {
        super(name)
        this.modeWidget = this.addWidget("combo", "Mode", this.properties.mode, null, { property: "mode", values: ["param", "property"] })
        this.propertyNameWidget = this.addWidget("text", "Prop.", this.properties.propertyName, "propertyName")
        this.propertyNameWidget.disabled = true;
        this.opWidget = this.addWidget("combo", "Op.", this.properties.operation, null, { property: "operation", values: FilterEvent.values })
        this.compareValueWidget = this.addWidget("text", "Value", this.properties.compareValue, "compareValue")
    }

    override onPropertyChanged(property: any, value: any) {
        if (property === "mode") {
            this.propertyNameWidget.disabled = value === "param";
        }
    }

    private compare(A: any, B: any): boolean {
        if (typeof A !== typeof B) {
            return false;
        }

        let result = false;

        switch (this.properties.operation) {
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
                if (this.properties.operation == "!=") result = !result;
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

        return result;
    }

    private evaluate(param: any): boolean {
        if (this.properties.mode === "property") {
            if (!this.properties.propertyName) {
                console.warn("[FilterEvent] No property name supplied!", param)
                return false;
            }

            var prop = param[this.properties.propertyName];
            if (prop == null) {
                return false;
            }

            return this.compare(this.properties.compareValue, prop)
        }
        else {
            return this.compare(this.properties.compareValue, param)
        }
    }

    override onExecute() {
        const compareValue = this.getInputData(1);
        if (compareValue != null)
            this.setProperty("compareValue", compareValue)
        this.compareValueWidget.value = String(this.properties.compareValue)
    }

    override onAction(action: any, param: any, options: { action_call?: string }) {
        if (this.evaluate(param)) {
            this.triggerSlot(0, param, null, options);
        }
        else {
            this.triggerSlot(1, param, null, options);
        }
    }
}

LiteGraph.registerNodeType({
    class: FilterEvent,
    title: "Filter Event",
    desc: "Blocks events that do not match the filter",
    type: "events/filter"
})

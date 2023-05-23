import { BuiltInSlotType, INodeInputSlot, INodeOutputSlot, ITextWidget, LConnectionKind, LGraphNode, LiteGraph, LLink, PropertyLayout, SlotLayout } from "@litegraph-ts/core";

export interface StringTemplateProperties extends Record<string, any> {
    template: string,
    stringQuote: string,
    outputJSON: boolean
}

export default class StringTemplate extends LGraphNode {
    override properties: StringTemplateProperties = {
        template: "$1, $2, $3",
        stringQuote: "",
        outputJSON: false
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "", type: "string,array" },
            { name: "", type: "string" },
            { name: "update", type: BuiltInSlotType.ACTION },
        ],
        outputs: [
            { name: "out", type: "string" },
            { name: "changed", type: BuiltInSlotType.EVENT },
        ],
    }

    static propertyLayout: PropertyLayout = [
        { name: "template", defaultValue: "$1, $2, $3", options: { multiline: true } },
        { name: "stringQuote", defaultValue: "" }
    ]

    private _value: string = null;

    templateWidget: ITextWidget;

    constructor(title?: string) {
        super(title)
        this.templateWidget = this.addWidget("text", "Template", this.properties.template, "template", { multiline: true })
    }

    private formatTemplateValue(val: any): string {
        if (typeof val === "string") {
            const quote = this.properties.stringQuote
            return `${quote}${val}${quote}`
        }
        return JSON.stringify(val)
    }

    private substituteTemplate(templateString: string, arr: any[]): string | any {
        let val = templateString.replace(/\$(\d+)/g, (_, index) => this.formatTemplateValue(arr[index - 1]));
        if (this.properties.outputJSON)
            val = JSON.parse(val)
        return val;
    }

    override onPropertyChanged(property: any, value: any) {
        if (property === "outputJSON") {
            const isJSON = value == true;
            this.outputs[0].type = isJSON ? "*" : "string";
        }
        this._value = null;
    }

    override onExecute() {
        if (this._value == null) {
            const template = this.properties.template || ""
            let args: any[]
            if (this._args != null) {
                args = this._args
                this._args = null
            }
            else {
                const firstInput = this.getInputData(0)
                if (Array.isArray(firstInput)) {
                    args = firstInput
                }
                else {
                    args = []
                    for (let index = 0; index < this.inputs.length; index++) {
                        if (this.inputs[index].type !== BuiltInSlotType.ACTION) {
                            const data = this.getInputData(index);
                            args.push(data)
                        }
                    }
                }
            }
            try {
                this.boxcolor = "#AEA";
                this._value = this.substituteTemplate(template, args)
            }
            catch (error) {
                this.boxcolor = "red";
                this._value = ""
                console.error(error);
            }
            this.triggerSlot(1, this._value)
        }
        this.setOutputData(0, this._value)
    };

    private _args = null;

    override onAction(action: any, param: any) {
        if (action === "update") {
            if (param != null) {
                if (Array.isArray(param))
                    this._args = param
                else
                    this._args = [param]
            }
            else {
                this._args = null;
            }
            this._value = null;
            this.onExecute();
        }
    }

    override onConnectionsChange(
        type: LConnectionKind,
        slotIndex: number,
        isConnected: boolean,
        link: LLink,
        ioSlot: (INodeInputSlot | INodeOutputSlot)
    ) {
        // Invalidate cached value
        this._value = null

        if (type !== LConnectionKind.INPUT)
            return

        // Try to auto-add new input
        if (isConnected) {
            if (link != null && slotIndex === this.inputs.length - 2) {
                // Pop off update action input
                this.removeInput(this.inputs.length - 1);

                this.addInput("", "*")

                // Readd action input
                this.addInput("update", BuiltInSlotType.ACTION)
            }
        }
        else {
            if (this.getInputLink(this.inputs.length - 2) != null)
                return;

            // Pop off update action input
            this.removeInput(this.inputs.length - 1);

            // Remove empty inputs
            for (let i = this.inputs.length - 1; i > 1; i--) {
                if (this.getInputLink(i) == null)
                    this.removeInput(i)
                else
                    break;
            }

            // Readd extra to end
            if (this.getInputLink(this.inputs.length - 1) != null) {
                this.addInput("", "*")
            }
            this.addInput("update", BuiltInSlotType.ACTION)
        }
    }
}

LiteGraph.registerNodeType({
    class: StringTemplate,
    title: "Template",
    desc: "Substitutes an array of strings in a template like '$1, $2, $3'",
    type: "string/template"
})

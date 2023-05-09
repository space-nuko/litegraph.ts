import { INodeInputSlot, INodeOutputSlot, ITextWidget, LConnectionKind, LGraphNode, LiteGraph, LLink, PropertyLayout, SlotLayout } from "@litegraph-ts/core";

export interface StringTemplateProperties extends Record<string, any> {
    template: string
}

export default class StringTemplate extends LGraphNode {
    override properties: StringTemplateProperties = {
        template: "$1, $2, $3"
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "", type: "string,array" },
            { name: "", type: "string" },
        ],
        outputs: [
            { name: "out", type: "string" },
        ],
    }

    static propertyLayout: PropertyLayout = [
        { name: "template", defaultValue: "$1, $2, $3", options: { multiline: true } }
    ]

    private _value: string = null;

    templateWidget: ITextWidget;

    constructor(title?: string) {
        super(title)
        this.templateWidget = this.addWidget("text", "Template", this.properties.template, "template", { multiline: true })
    }

    static substituteTemplate(templateString: string, arr: any[]): string {
        return templateString.replace(/\$(\d+)/g, (_, index) => arr[index - 1]);
    }

    override onPropertyChanged(property: any, value: any) {
        if (property === "template") {
            this._value = null;
        }
    }

    override onExecute() {
        if (this._value == null) {
            const template = this.properties.template || ""
            const firstInput = this.getInputData(0)
            let args: any[]
            if (Array.isArray(firstInput)) {
                args = firstInput
            }
            else {
                args = []
                for (let index = 0; index < this.inputs.length; index++) {
                    const data = this.getInputData(index);
                    args.push(data)
                }
            }
            this._value = StringTemplate.substituteTemplate(template, args)
        }
        this.setOutputData(0, this._value)
    };

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
            if (link != null && slotIndex === this.inputs.length - 1) {
                this.addInput("", "*")
            }
        }
        else {
            if (this.getInputLink(this.inputs.length - 1) != null)
                return;

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
        }
    }
}

LiteGraph.registerNodeType({
    class: StringTemplate,
    title: "Template",
    desc: "Substitutes an array of strings in a template like '$1, $2, $3'",
    type: "string/template"
})

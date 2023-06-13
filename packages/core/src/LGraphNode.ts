import type { ContextMenuItem } from "./ContextMenu";
import type { MouseEventExt } from "./DragAndScale";
import type INodeConnection from "./INodeConnection";
import type { INodeInputSlot, INodeOutputSlot, default as INodeSlot, SlotInPosition, SlotIndex, SlotNameOrIndex } from "./INodeSlot";
import type { default as IProperty, IPropertyInfo } from "./IProperty";
import type { default as IWidget, WidgetCallback } from "./IWidget";
import LGraph, { LGraphRemoveNodeOptions } from "./LGraph";
import LGraphCanvas, { type INodePanel } from "./LGraphCanvas";
import LLink from "./LLink";
import LiteGraph from "./LiteGraph";
import { LinkID, NodeID, SlotShape, SlotType, TitleMode, Vector2 } from "./types";
import { BuiltInSlotShape, BuiltInSlotType, LConnectionKind, NodeMode } from "./types";
import { getStaticPropertyOnInstance } from "./utils";
import { UUID } from "./types";
import { v4 as uuidv4 } from "uuid";
import Subgraph, { GraphIDMapping } from "./nodes/Subgraph";

export type NodeTypeOpts = {
    node: string,
    title?: string,
    properties?: any,
    inputs?: [string, SlotType][],
    outputs?: [string, SlotType][],
    json?: SerializedLGraphNode<LGraphNode>;
}
export type NodeTypeSpec = string | NodeTypeOpts | "AUTO";
export type LCreateDefaultNodeForSlotOptions = {
    nodeFrom?: LGraphNode, // input
    slotFrom?: SlotNameOrIndex | INodeSlot, // input
    nodeTo?: LGraphNode,   // output
    slotTo?: SlotNameOrIndex | INodeSlot,   // output
    position?: Vector2,	// pass the event coords
    posAdd?: Vector2	// adjust x,y
    posSizeFix?: Vector2 // alpha, adjust the position x,y based on the new node size w,h
}

export type LGraphNodeCloneData = {
    forNode: Record<NodeID, any>
}

export type SearchboxExtra = {
    data: {
        title: string,
        properties?: any[],
        inputs?: [string, SlotType][],
        outputs?: [string, SlotType][],
        json?: SerializedLGraphNode<LGraphNode>;
    };
    desc: string;
    type: string;
}

export type InputSlotLayout = { name: string, type: SlotType, options?: Partial<INodeInputSlot> }
export type OutputSlotLayout = { name: string, type: SlotType, options?: Partial<INodeOutputSlot> }
export type SlotLayout = { inputs?: InputSlotLayout[], outputs?: OutputSlotLayout[] };
export type OptionalSlots = { inputs?: InputSlotLayout[], outputs?: OutputSlotLayout[] }

export type PropertyLayout = {
    name: string,
    defaultValue: any,
    type?: string,
    options?: Partial<IPropertyInfo>
}[];

export type LActionOptions = {
    action_call?: string,
    link?: LLink
    originNode?: LGraphNode
}

export type LGraphNodeConstructorFactory<T> = new (title?: string, ...restArgs: any[]) => T;

export interface LGraphNodeConstructor<T extends LGraphNode = LGraphNode> {
    class: LGraphNodeConstructorFactory<T>,
    title: string,
    title_color?: string,
    desc: string,
    category?: string,
    supported_extensions?: string[],
    /**
     * Type name used for serialization, like "graph/input".
     * Should be unique across all nodes.
     * The part before the final slash is the category, if it's not manually provided.
     */
    type: string,
    name?: string,
    filter?: string,
    /** If true, hide from the search box and Add Node menus */
    hide_in_node_lists?: boolean
}

export type SerializedLGraphNode<T extends LGraphNode = LGraphNode> = {
    id: T["id"];
    type: T["type"];
    pos: T["pos"];
    size: T["size"];
    flags: T["flags"];
    mode: T["mode"];
    order: T["mode"];
    inputs?: T["inputs"];
    outputs?: T["outputs"];
    title?: T["title"];
    color?: T["color"];
    bgcolor?: T["bgcolor"];
    boxcolor?: T["boxcolor"];
    shape?: T["shape"];
    properties?: T["properties"];
    widgets_values?: IWidget["value"][];
};

/** https://github.com/jagenjo/litegraph.js/blob/master/guides/README.md#lgraphnode */
export default class LGraphNode {
    get slotLayout(): SlotLayout {
        if ("slotLayout" in this.constructor) {
            return this.constructor.slotLayout as SlotLayout;
        }
        return null;
    }

    static title_color: string;
    static title: string;
    static type: null | string;
    static widgets_up: boolean;

    constructor(title?: string) {
        this.title = title || "Unnamed"
        this.size = [LiteGraph.NODE_WIDTH, 60];
        this.graph = null;

        this.pos = [10, 10];

        if (LiteGraph.use_uuids)
            this.id = uuidv4();
        else
            this.id = -1; //not know till not added
        this.type = null;

        //inputs available: array of inputs
        this.inputs = [];
        this.outputs = [];
        this.connections = [];

        //local data
        this.properties = {}; //for the values
        this.properties_info = []; //for the info

        this.flags = {};
    }

    title: string;
    desc: string = "";
    type: null | string;
    category: null | string;
    size: Vector2;
    pos: Vector2 = [0, 0]
    graph: null | LGraph;
    graph_version: number;
    subgraph: null | LGraph = null;
    skip_subgraph_button: boolean = false;
    is_selected: boolean;
    mouseOver: boolean;
    /** computeExecutionOrder sorts by priority first, then order if priorities are the same */
    priority: number = 0;
    order: number;
    redraw_on_mouse: boolean;
    removable: boolean = true;
    clonable: boolean = true;
    collapsable: boolean = true;
    titleMode: TitleMode = TitleMode.NORMAL_TITLE;
    class: new () => LGraphNode;

    id: NodeID;

    widgets: IWidget[] | null | undefined;
    widgets_values?: IWidget["value"][];

    //inputs available: array of inputs
    inputs: INodeInputSlot[];
    outputs: INodeOutputSlot[];
    connections: INodeConnection[];

    //local data
    properties: Record<string, any>;
    properties_info: IProperty[];

    flags: Partial<{
        collapsed: boolean,
        pinned: boolean,
        skip_repeated_outputs: boolean,
    }>;

    color: string;
    bgcolor: string;
    boxcolor: string;
    shape: SlotShape;

    serialize_widgets: boolean = false;
    hide_in_node_lists: boolean = false;
    block_delete: boolean = false;
    ignore_remove: boolean = false;

    last_serialization?: SerializedLGraphNode = null;

    _relative_id: NodeID | null = null;
    _level: number;

    /** Used in `LGraphCanvas.onMenuNodeMode` */
    mode?: NodeMode;

    /** If set to true widgets do not start after the slots */
    widgets_up: boolean;
    /** widgets start at y distance from the top of the node */
    widgets_start_y: number;
    /** if you render outside the node, it will be clipped */
    clip_area: boolean;
    /** if set to false it wont be resizable with the mouse */
    resizable: boolean;
    /** slots are distributed horizontally */
    horizontal: boolean;
    /** if true, the node will show the bgcolor as 'red'  */
    has_errors?: boolean;

    _collapsed_width?: number;
    exec_version: number = 0;
    action_call: string | null = null;
    /** the nFrames it will be used (-- each step), means "how old" is the event */
    execute_triggered: number = 0;
    /** the nFrames it will be used (-- each step), means "how old" is the event */
    action_triggered: number = 0;

    onNodeCreated?(): void;

    onDropFile?(file: File): void;
    onDropData?(data: ArrayBuffer | string, filename: string, file: File): void;
    onDropItem?(e: DragEvent): boolean | void;

    /** configure a node from an object containing the serialized info */
    configure(info: SerializedLGraphNode): void {
        if (this.graph) {
            (this.graph as any)._version++;
        }
        for (var j in info) {
            if (j == "properties") {
                //i don't want to clone properties, I want to reuse the old container
                for (var k in info.properties) {
                    this.properties[k] = info.properties[k];
                    if (this.onPropertyChanged) {
                        this.onPropertyChanged(k, info.properties[k]);
                    }
                }
                continue;
            }

            if (info[j] == null) {
                continue;
            } else if (typeof info[j] == "object") {
                //object
                //also detects node.subgraph
                if (this[j] && this[j].configure) {
                    this[j].configure(info[j]);
                } else {
                    this[j] = LiteGraph.cloneObject(info[j], this[j]);
                }
            } //value
            else {
                this[j] = info[j];
            }
        }

        if (!info.title) {
            this.title = getStaticPropertyOnInstance<string>(this, "title") || this.title;
        }

        // renamed field
        const bgColor = (info as any).bgColor
        if (bgColor != null)
            this.bgcolor ||= bgColor

        if (this.inputs) {
            for (let i = 0; i < this.inputs.length; ++i) {
                let input = this.inputs[i];
                let linkInfo = this.graph ? this.graph.links[input.link] : null;
                input.properties ||= {}

                if (this.onConnectionsChange)
                    this.onConnectionsChange(LConnectionKind.INPUT, i, true, linkInfo, input); //linkInfo has been created now, so its updated

                if (this.onInputAdded)
                    this.onInputAdded(input);
            }
        }

        if (this.outputs) {
            for (var i = 0; i < this.outputs.length; ++i) {
                let output = this.outputs[i];
                output.properties ||= {}

                if (!output.links) {
                    continue;
                }
                for (let j = 0; j < output.links.length; ++j) {
                    let linkInfo = this.graph ? this.graph.links[output.links[j]] : null;
                    if (this.onConnectionsChange)
                        this.onConnectionsChange(LConnectionKind.OUTPUT, i, true, linkInfo, output); //linkInfo has been created now, so its updated
                }

                if (this.onOutputAdded)
                    this.onOutputAdded(output);
            }
        }

        if (this.widgets) {
            for (var i = 0; i < this.widgets.length; ++i) {
                var w = this.widgets[i];
                if (!w)
                    continue;
                if (w.options && w.options.property && this.properties[w.options.property])
                    w.value = JSON.parse(JSON.stringify(this.properties[w.options.property]));
            }
            if (info.widgets_values) {
                for (var i = 0; i < info.widgets_values.length; ++i) {
                    if (this.widgets[i]) {
                        this.widgets[i].value = info.widgets_values[i];
                    }
                }
            }
        }

        if (this.onConfigure) {
            this.onConfigure(info);
        }
    }

    /** serialize the content */
    serialize(): SerializedLGraphNode {
        //create serialization object
        let o: SerializedLGraphNode = {
            id: this.id,
            type: this.type,
            pos: this.pos,
            size: this.size,
            flags: LiteGraph.cloneObject(this.flags),
            order: this.order,
            mode: this.mode,
        };

        //special case for when there were errors
        if (this.constructor === LGraphNode && this.last_serialization) {
            return this.last_serialization;
        }

        if (this.inputs) {
            o.inputs = this.inputs;
        }

        if (this.outputs) {
            //clear outputs last data (because data in connections is never serialized but stored inside the outputs info)
            for (var i = 0; i < this.outputs.length; i++) {
                delete this.outputs[i]._data;
            }
            o.outputs = this.outputs;
        }

        if (this.title && this.title != (this.constructor as any).title) {
            o.title = this.title;
        }

        if (this.properties) {
            o.properties = LiteGraph.cloneObject(this.properties);
        }

        if (this.widgets && this.serialize_widgets) {
            o.widgets_values = [];
            for (var i = 0; i < this.widgets.length; ++i) {
                if (this.widgets[i])
                    o.widgets_values[i] = this.widgets[i].value;
                else
                    o.widgets_values[i] = null;
            }
        }

        if (!o.type) {
            o.type = (this.constructor as any).type;
        }

        if (this.color) {
            o.color = this.color;
        }
        if (this.bgcolor) {
            o.bgcolor = this.bgcolor;
        }
        if (this.boxcolor) {
            o.boxcolor = this.boxcolor;
        }
        if (this.shape) {
            o.shape = this.shape;
        }

        if (this.onSerialize) {
            this.onSerialize(o);
        }

        return o;
    }

    /** Creates a clone of this node  */
    clone(cloneData: LGraphNodeCloneData = { forNode: {} }): LGraphNode {
        var node = LiteGraph.createNode(this.type);
        if (!node) {
            return null;
        }

        //we clone it because serialize returns shared containers
        var data = LiteGraph.cloneObject<SerializedLGraphNode<LGraphNode>>(this.serialize());

        //remove links
        if (data.inputs) {
            for (var i = 0; i < data.inputs.length; ++i) {
                data.inputs[i].link = null;
            }
        }

        if (data.outputs) {
            for (var i = 0; i < data.outputs.length; ++i) {
                if (data.outputs[i].links) {
                    data.outputs[i].links.length = 0;
                }
            }
        }

        delete data["id"];

        if (LiteGraph.use_uuids) {
            data["id"] = uuidv4()
        }

        //remove links
        node.configure(data);

        return node;
    }

    /** serialize and stringify */
    toString(): string {
        return JSON.stringify(this.serialize());
    }

    /** get the title string */
    getTitle(): string {
        return this.title || (this.constructor as any).title;
    }

    getRootGraph(): LGraph | null {
        let graph = this.graph;

        while (graph && graph._is_subgraph)
            graph = graph._subgraph_node?.graph

        if (graph == null || graph._is_subgraph)
            return null;

        return graph
    }

    *iterateParentSubgraphNodes(): Iterable<Subgraph> {
        let subgraph = this.graph._subgraph_node;
        while (subgraph) {
            yield subgraph;
            subgraph = subgraph.graph?._subgraph_node;
        }
    }

    /** sets the value of a property */
    setProperty(name: string, value: any): void {
        if (!this.properties) {
            this.properties = {};
        }
        if (value === this.properties[name])
            return;
        var prev_value = this.properties[name];
        this.properties[name] = value;
        if (this.graph) {
            this.graph._version++;
        }
        if (this.onPropertyChanged) {
            if (this.onPropertyChanged(name, value, prev_value) === false) //abort change
                this.properties[name] = prev_value;
        }
        if (this.widgets) //widgets could be linked to properties
            for (var i = 0; i < this.widgets.length; ++i) {
                var w = this.widgets[i];
                if (!w)
                    continue;
                if (w.options.property == name) {
                    w.value = value;
                    break;
                }
            }
    }

    getInputSlotProperty(slot: SlotIndex, name: string): any {
        if (!this.inputs || !this.graph) {
            return;
        }

        if (slot == -1 || slot >= this.inputs.length) {
            return;
        }

        var input_info = this.inputs[slot];
        if (!input_info) {
            return;
        }

        input_info.properties ||= {}
        return input_info.properties[name]
    }

    getOutputSlotProperty(slot: SlotIndex, name: string): any {
        if (!this.outputs || !this.graph) {
            return;
        }

        if (slot == -1 || slot >= this.outputs.length) {
            return;
        }

        var output_info = this.outputs[slot];
        if (!output_info) {
            return;
        }

        output_info.properties ||= {}
        return output_info.properties[name]
    }

    setInputSlotProperty(slot: SlotIndex, name: string, value: any) {
        if (!this.inputs || !this.graph) {
            return;
        }

        if (slot == -1 || slot >= this.inputs.length) {
            return;
        }

        var input_info = this.inputs[slot];
        if (!input_info) {
            return;
        }

        input_info.properties ||= {}

        if (value === input_info.properties[name])
            return;

        var prev_value = input_info.properties[name];
        input_info.properties[name] = value;

        if (this.graph)
            this.graph._version++;

        if (this.onSlotPropertyChanged) {
            if (this.onSlotPropertyChanged(LConnectionKind.INPUT, slot, input_info, name, value, prev_value) === false) //abort change
                input_info.properties[name] = prev_value;
        }
    }

    setOutputSlotProperty(slot: SlotIndex, name: string, value: any) {
        if (!this.outputs || !this.graph) {
            return;
        }

        if (slot == -1 || slot >= this.outputs.length) {
            return;
        }

        var output_info = this.outputs[slot];
        if (!output_info) {
            return;
        }

        output_info.properties ||= {}

        if (value === output_info.properties[name])
            return;

        var prev_value = output_info.properties[name];
        output_info.properties[name] = value;

        if (this.graph)
            this.graph._version++;

        if (this.onSlotPropertyChanged) {
            if (this.onSlotPropertyChanged(LConnectionKind.OUTPUT, slot, output_info, name, value, prev_value) === false) //abort change
                output_info.properties[name] = prev_value;
        }
    }

    /** sets the output data */
    setOutputData(slot: SlotIndex, data: any): void {
        if (!this.outputs || !this.graph) {
            return;
        }

        //this maybe slow and a niche case
        //if(slot && slot.constructor === String)
        //	slot = this.findOutputSlot(slot);

        if (slot == -1 || slot >= this.outputs.length) {
            return;
        }

        var output_info = this.outputs[slot];
        if (!output_info) {
            return;
        }

        if (LiteGraph.serialize_slot_data) {
            //store data in the output itself in case we want to debug
            output_info._data = data;
        }
        else {
            output_info._data = undefined;
        }

        //if there are connections, pass the data to the connections
        if (this.outputs[slot].links) {
            for (var i = 0; i < this.outputs[slot].links.length; i++) {
                var link_id = this.outputs[slot].links[i];
                var link = this.graph.links[link_id];
                if (link)
                    link.data = data;
            }
        }
    }

    /** sets the output data */
    setOutputDataType(slot: number, type: SlotType): void {
        if (!this.outputs) {
            return;
        }
        if (slot == -1 || slot >= this.outputs.length) {
            return;
        }
        var output_info = this.outputs[slot];
        if (!output_info) {
            return;
        }
        //store data in the output itself in case we want to debug
        output_info.type = type;

        //if there are connections, pass the data to the connections
        if (this.outputs[slot].links) {
            for (let i = this.outputs[slot].links.length - 1; i >= 0; i--) {
                const link_id = this.outputs[slot].links[i];
                const link = this.graph.links[link_id]
                if (link) {
                    link.type = type;
                    const outputNode = this.graph.getNodeById(link.target_id);
                    if (outputNode) {
                        const inputSlot = outputNode.getInputInfo(link.target_slot);
                        if (inputSlot && !LiteGraph.isValidConnection(type, inputSlot.type)) {
                            outputNode.disconnectInput(link.target_slot)
                        }
                    }
                }
            }
        }
    }

    *iterateInputInfo(): Iterable<INodeInputSlot> {
        for (let index = 0; index < this.inputs.length; index++)
            yield this.inputs[index];
    }

    /**
     * Retrieves the input data (data traveling through the connection) from one slot
     * @param slot
     * @param force_update if set to true it will force the connected node of this slot to output data into this link
     * @return data or if it is not connected returns undefined
     */
    getInputData<T = any>(slot: number, force_update?: boolean): T {
        if (!this.inputs || !this.graph) {
            return;
        }

        if (slot >= this.inputs.length || this.inputs[slot].link == null) {
            return;
        }

        var link_id = this.inputs[slot].link;
        var link = this.graph.links[link_id];
        if (!link) {
            //bug: weird case but it happens sometimes
            if (LiteGraph.debug)
                console.error(`Link not found in slot ${slot}!`, this, this.inputs[slot], link_id)
            return null;
        }

        if (!force_update) {
            return link.data;
        }

        //special case: used to extract data from the incoming connection before the graph has been executed
        var node = this.graph.getNodeById(link.origin_id);
        if (!node) {
            return link.data;
        }

        if (node.updateOutputData) {
            node.updateOutputData(link.origin_slot);
        } else if (node.onExecute) {
            node.onExecute(null, {});
        }

        return link.data;
    }

    /**
     * Retrieves the input data type (in case this supports multiple input types)
     * @param slot
     * @return datatype in string format
     */
    getInputDataType(slot: number): SlotType | null {
        if (!this.inputs) {
            return null;
        } //undefined;

        if (slot >= this.inputs.length || this.inputs[slot].link == null) {
            return null;
        }
        var link_id = this.inputs[slot].link;
        var link = this.graph.links[link_id];
        if (!link) {
            //bug: weird case but it happens sometimes
            if (LiteGraph.debug)
                console.error(`Link not found in slot ${slot}!`, this, this.inputs[slot], link_id)
            return null;
        }
        var node = this.graph.getNodeById(link.origin_id);
        if (!node) {
            return link.type;
        }
        var output_info = node.outputs[link.origin_slot];
        if (output_info && output_info.type != -1) {
            return output_info.type;
        }
        return null;
    }

    /**
     * Retrieves the input data from one slot using its name instead of slot number
     * @param slot_name
     * @param force_update if set to true it will force the connected node of this slot to output data into this link
     * @return data or if it is not connected returns null
     */
    getInputDataByName<T = any>(slot_name: string, force_update?: boolean): T {
        var slot = this.findInputSlotIndexByName(slot_name);
        if (slot == -1) {
            return null;
        }
        return this.getInputData(slot, force_update);
    }

    /** tells you if there is a connection in one input slot */
    isInputConnected(slot: SlotIndex): boolean {
        if (!this.inputs) {
            return false;
        }
        return slot < this.inputs.length && this.inputs[slot].link != null;
    }

    /** tells you info about an input connection (which node, type, etc) */
    getInputInfo(slot: SlotIndex): INodeInputSlot | null {
        if (!this.inputs) {
            return null;
        }
        if (slot < this.inputs.length) {
            return this.inputs[slot];
        }
        return null;
    }

    /**
     * Returns the link info in the connection of an input slot
     * @param {number} slot
     * @return {LLink} object or null
     */
    getInputLink(slot: SlotIndex): LLink | null {
        if (!this.inputs || !this.graph) {
            return null;
        }
        if (slot < this.inputs.length) {
            var slot_info = this.inputs[slot];
            return this.graph.links[slot_info.link];
        }
        return null;
    };

    /** returns the node connected in the input slot */
    getInputNode(slot: SlotIndex): LGraphNode | null {
        if (!this.inputs || !this.graph) {
            return null;
        }
        if (slot < this.inputs.length) {
            const link_id = this.inputs[slot].link;
            const link = this.graph.links[link_id];
            if (!link) {
                //bug: weird case but it happens sometimes
                if (LiteGraph.debug)
                    console.error(`Link not found in slot ${slot}!`, this, this.inputs[slot], link_id)
                return null;
            }
            var origin_node = this.graph.getNodeById(link.origin_id);
            if (origin_node) {
                return origin_node;
            }
        }
        return null;
    }

    /** returns the value of an input with this name, otherwise checks if there is a property with that name */
    getInputOrProperty<T = any>(name: string): T {
        if (!this.inputs || !this.inputs.length || !this.graph) {
            return this.properties ? this.properties[name] : null;
        }

        for (var i = 0, l = this.inputs.length; i < l; ++i) {
            var input_info = this.inputs[i];
            if (name == input_info.name && input_info.link != null) {
                var link = this.graph.links[input_info.link];
                if (link) {
                    return link.data;
                }
            }
        }
        return this.properties[name];
    }

    /** sets the input data type */
    setInputDataType(slot: number, type: SlotType): void {
        if (!this.inputs || !this.graph) {
            return;
        }
        if (slot == -1 || slot >= this.inputs.length) {
            return;
        }
        var input_info = this.inputs[slot];
        if (!input_info) {
            return;
        }
        //store data in the output itself in case we want to debug
        input_info.type = type;

        //if there are connections, pass the data to the connections
        if (input_info.link) {
            const link_id = input_info.link;
            const link = this.graph.links[link_id]
            link.type = type;
            const inputNode = this.graph.getNodeById(link.origin_id);
            if (inputNode) {
                const slot = inputNode.getOutputInfo(link.origin_slot);
                if (slot && !LiteGraph.isValidConnection(slot.type, type))
                    inputNode.disconnectOutput(link.origin_slot);
            }
        }
    }

    /**
     * Returns the output slot in another node that an input in this node is connected to.
     * @param {number} slot
     * @return {LLink} object or null
     */
    getOutputSlotConnectedTo(slot: SlotIndex): INodeOutputSlot | null {
        if (!this.outputs || !this.graph) {
            return null;
        }
        if (slot >= 0 && slot < this.outputs.length) {
            var slot_info = this.inputs[slot];
            if (slot_info.link) {
                const link = this.graph.links[slot_info.link]
                const node = this.graph.getNodeById(link.origin_id)
                return node.outputs[link.origin_slot]
            }
        }
        return null;
    };

    *iterateOutputInfo(): Iterable<INodeOutputSlot> {
        for (let index = 0; index < this.outputs.length; index++)
            yield this.outputs[index];
    }

    /** tells you the last output data that went in that slot */
    getOutputData<T = any>(slot: SlotIndex): T | null {
        if (!this.outputs || !this.graph) {
            return null;
        }
        if (slot >= this.outputs.length) {
            return null;
        }

        var info = this.outputs[slot];
        return info._data;
    }

    /**
     * Returns the link info in the connection of an output slot
     * @param {number} slot
     * @return {LLink} object or null
     */
    getOutputLinks(slot: SlotIndex): LLink[] {
        if (!this.outputs || !this.graph) {
            return [];
        }
        if (slot >= 0 && slot < this.outputs.length) {
            var slot_info = this.outputs[slot];
            if (slot_info.links) {
                var links: LLink[] = [];
                for (const linkID of slot_info.links)
                    links.push(this.graph.links[linkID]);
                return links;
            }
        }
        return [];
    };

    /**
     * Returns the input slots in other nodes that an output in this node is connected to.
     * @param {number} slot
     * @return {LLink} object or null
     */
    getInputSlotsConnectedTo(slot: SlotIndex): INodeInputSlot[] {
        if (!this.outputs || !this.graph) {
            return [];
        }
        if (slot >= 0 && slot < this.outputs.length) {
            var slot_info = this.outputs[slot];
            if (slot_info.links) {
                var inputs: INodeInputSlot[] = [];
                for (const linkID of slot_info.links) {
                    const link = this.graph.links[linkID]
                    const node = this.graph.getNodeById(link.target_id)
                    inputs.push(node.inputs[link.target_slot])
                }
                return inputs;
            }
        }
        return [];
    };

    /** tells you info about an output connection (which node, type, etc) */
    getOutputInfo(slot: SlotIndex): INodeOutputSlot | null {
        if (!this.outputs) {
            return null;
        }
        if (slot < this.outputs.length) {
            return this.outputs[slot];
        }
        return null;
    }

    /** tells you if there is a connection in one output slot */
    isOutputConnected(slot: SlotIndex): boolean {
        if (!this.outputs || !this.graph) {
            return false;
        }
        return (
            slot < this.outputs.length &&
            this.outputs[slot].links &&
            this.outputs[slot].links.length > 0
        );
    }

    /** tells you if there is any connection in the output slots */
    isAnyOutputConnected(): boolean {
        if (!this.outputs || !this.graph) {
            return false;
        }
        for (var i = 0; i < this.outputs.length; ++i) {
            if (this.outputs[i].links && this.outputs[i].links.length) {
                return true;
            }
        }
        return false;
    }

    /** retrieves all the nodes connected to this output slot */
    getOutputNodes(slot: SlotIndex): LGraphNode[] {
        if (!this.outputs || this.outputs.length == 0 || !this.graph) {
            return null;
        }

        if (slot >= this.outputs.length) {
            return null;
        }

        var output = this.outputs[slot];
        if (!output.links || output.links.length == 0) {
            return null;
        }

        var r = [];
        for (var i = 0; i < output.links.length; i++) {
            var link_id = output.links[i];
            var link = this.graph.links[link_id];
            if (link) {
                var targetNode = this.graph.getNodeById(link.target_id);
                if (targetNode) {
                    r.push(targetNode);
                }
            }
        }
        return r;
    }

    *iterateAllLinks(): Iterable<LLink> {
        if (!this.graph)
            return

        for (const input of this.iterateInputInfo()) {
            if (input.link) {
                const link = this.graph.links[input.link]
                if (link)
                    yield link
            }
        }
        for (const output of this.iterateOutputInfo()) {
            if (output.links != null) {
                for (const linkID of output.links) {
                    const link = this.graph.links[linkID]
                    if (link)
                        yield link
                }
            }
        }
    }

    addOnTriggerInput(): SlotIndex {
        var trigS = this.findInputSlotIndexByName("onTrigger");
        if (trigS == -1) { //!trigS ||
            this.addInput("onTrigger", BuiltInSlotType.EVENT, { optional: true, nameLocked: true });
            return this.findInputSlotIndexByName("onTrigger");
        }
        return trigS;
    }

    addOnExecutedOutput(): SlotIndex {
        var trigS = this.findOutputSlotIndexByName("onExecuted");
        if (trigS == -1) { //!trigS ||
            this.addOutput("onExecuted", BuiltInSlotType.ACTION, { optional: true, nameLocked: true });
            return this.findOutputSlotIndexByName("onExecuted");
        }
        return trigS;
    }

    onAfterExecuteNode(param: any, options?: object) {
        var trigS = this.findOutputSlotIndexByName("onExecuted");
        if (trigS != -1) {

            //console.debug(this.id+":"+this.order+" triggering slot onAfterExecute");
            //console.debug(param);
            //console.debug(options);
            this.triggerSlot(trigS, param, null, options);

        }
    }

    changeMode(modeTo: NodeMode): boolean {
        switch (modeTo) {
            case NodeMode.ON_EVENT:
                // this.addOnExecutedOutput();
                break;

            case NodeMode.ON_TRIGGER:
                this.addOnTriggerInput();
                this.addOnExecutedOutput();
                break;

            case NodeMode.NEVER:
                break;

            case NodeMode.ALWAYS:
                break;

            case NodeMode.ON_REQUEST:
                break;

            default:
                return false;
        }
        this.mode = modeTo;
        return true;
    }

    doExecute(param?: any, options: LActionOptions = {}): void {
        if (this.onExecute) {
            // enable this to give the event an ID
            if (!options.action_call) options.action_call = this.id + "_exec_" + Math.floor(Math.random() * 9999);

            this.graph.nodes_executing[this.id] = true; //.push(this.id);

            this.onExecute(param, options);

            this.graph.nodes_executing[this.id] = false; //.pop();

            // save execution/action ref
            this.exec_version = this.graph.iteration;
            if (options && options.action_call) {
                this.action_call = options.action_call; // if (param)
                this.graph.nodes_executedAction[this.id] = options.action_call;
            }
        }
        this.execute_triggered = 2; // the nFrames it will be used (-- each step), means "how old" is the event
        if (this.onAfterExecuteNode)
            this.onAfterExecuteNode(param, options); // callback
    }

    /**
     * Triggers an action, wrapped by logics to control execution flow
     * @method actionDo
     * @param {String} action name
     * @param {*} param
     */
    actionDo(action: any, param: any, options: LActionOptions = {}) {
        if (this.onAction) {

            // enable this to give the event an ID
            if (!options.action_call) options.action_call = this.id + "_" + (action ? action : "action") + "_" + Math.floor(Math.random() * 9999);

            this.graph.nodes_actioning[this.id] = (action ? action : "actioning"); //.push(this.id);

            this.onAction(action, param, options);

            this.graph.nodes_actioning[this.id] = false; //.pop();

            // save execution/action ref
            if (options && options.action_call) {
                this.action_call = options.action_call; // if (param)
                this.graph.nodes_executedAction[this.id] = options.action_call;
            }
        }
        this.action_triggered = 2; // the nFrames it will be used (-- each step), means "how old" is the event
        if (this.onAfterExecuteNode) this.onAfterExecuteNode(param, options);
    };

    /**  Triggers an event in this node, this will trigger any output with the same name */
    trigger(action: string, param: any, options?: LActionOptions): void {
        if (!this.outputs || !this.outputs.length) {
            return;
        }

        if (this.graph)
            this.graph._last_trigger_time = LiteGraph.getTime();

        for (var i = 0; i < this.outputs.length; ++i) {
            var output = this.outputs[i];
            if (!output || output.type !== BuiltInSlotType.EVENT || (action && output.name != action))
                continue;
            this.triggerSlot(i, param, null, options);
        }
    }

    /**
     * Triggers an slot event in this node
     * @param slot the index of the output slot
     * @param param
     * @param link_id in case you want to trigger and specific output link in a slot
     */
    triggerSlot(slot: SlotIndex, param?: any, link_id?: LinkID, options: LActionOptions = {}): void {
        if (!this.outputs) {
            return;
        }

        if (slot == null) {
            console.error("slot must be a number");
            return;
        }

        if (typeof slot !== "number")
            console.warn("slot must be a number, use node.trigger('name') if you want to use a string");

        var output = this.outputs[slot];
        if (!output) {
            return;
        }

        var links = output.links;
        if (!links || !links.length) {
            return;
        }

        if (this.graph) {
            this.graph._last_trigger_time = LiteGraph.getTime();
        }

        //for every link attached here
        for (var k = 0; k < links.length; ++k) {
            var id = links[k];
            if (link_id != null && link_id != id) {
                //to skip links
                continue;
            }
            var linkInfo = this.graph.links[links[k]];
            if (!linkInfo) {
                //not connected
                continue;
            }
            linkInfo._last_time = LiteGraph.getTime();
            var node = this.graph.getNodeById(linkInfo.target_id);
            if (!node) {
                //node not found?
                continue;
            }

            //used to mark events in graph
            const target_connection = node.inputs[linkInfo.target_slot];

            options.link = linkInfo;
            options.originNode = this;

            if (node.mode === NodeMode.ON_TRIGGER) {
                // generate unique trigger ID if not present
                if (!options.action_call)
                    options.action_call = this.id + "_trigg_" + Math.floor(Math.random() * 9999);
                if (node.onExecute) {
                    // -- wrapping node.onExecute(param); --
                    node.doExecute(param, options);
                }
            }
            else if (node.onAction) {
                // generate unique action ID if not present
                if (!options.action_call)
                    options.action_call = this.id + "_act_" + Math.floor(Math.random() * 9999);
                //pass the action name
                const target_connection = node.inputs[linkInfo.target_slot];
                // wrap node.onAction(target_connection.name, param);
                node.actionDo(target_connection.name, param, options);
            }
        }
    }

    /**
     * clears the trigger slot animation
     * @param slot the index of the output slot
     * @param link_id in case you want to trigger and specific output link in a slot
     */
    clearTriggeredSlot(slot: number, link_id?: LinkID): void {
        if (!this.outputs) {
            return;
        }

        var output = this.outputs[slot];
        if (!output) {
            return;
        }

        var links = output.links;
        if (!links || !links.length) {
            return;
        }

        //for every link attached here
        for (var k = 0; k < links.length; ++k) {
            var id = links[k];
            if (link_id != null && link_id != id) {
                //to skip links
                continue;
            }
            var linkInfo = this.graph.links[links[k]];
            if (!linkInfo) {
                //not connected
                continue;
            }
            linkInfo._last_time = 0;
        }
    }

    /**
     * changes node size and triggers callback
     * @method setSize
     * @param {vec2} size
     */
    setSize(size: Vector2) {
        this.size = size;
        if (this.onResize)
            this.onResize(this.size);
    }

    /**
     * add a new property to this node
     * @param name
     * @param default_value
     * @param type string defining the output type ("vec3","number",...)
     * @param extra_info this can be used to have special properties of the property (like values, etc)
     */
    addProperty(
        name: string,
        default_value: any,
        type?: string,
        extra_info?: Partial<IPropertyInfo>
    ): IProperty {
        var o: IProperty = { name: name, type: type, default_value: default_value };
        if (extra_info) {
            for (var i in extra_info) {
                o[i] = extra_info[i];
            }
        }
        if (!this.properties_info) {
            this.properties_info = [];
        }
        this.properties_info.push(o);
        if (!this.properties) {
            this.properties = {};
        }
        this.properties[name] = default_value;
        return o;
    }

    /**
     * add a new output slot to use in this node
     * @param name
     * @param type string defining the output type ("vec3","number",...)
     * @param extra_info this can be used to have special properties of an output (label, special color, position, etc)
     */
    addOutput(
        name: string,
        type: SlotType = BuiltInSlotType.DEFAULT,
        extra_info?: Partial<INodeOutputSlot>
    ): INodeOutputSlot {
        var output: INodeOutputSlot = { name: name, type: type, links: [], properties: {} };
        if (extra_info) {
            for (var i in extra_info) {
                output[i] = extra_info[i];
            }
        }

        if ((output.shape == null || output.shape == BuiltInSlotShape.DEFAULT)) {
            if (type == "array") {
                output.shape = BuiltInSlotShape.GRID_SHAPE;
            }
            else if (type === BuiltInSlotType.EVENT || type === BuiltInSlotType.ACTION) {
                output.shape = BuiltInSlotShape.BOX_SHAPE;
            }
        }

        if (type === BuiltInSlotType.EVENT || type === BuiltInSlotType.ACTION) {
            output.shape = BuiltInSlotShape.BOX_SHAPE;
        }

        if (!this.outputs) {
            this.outputs = [];
        }
        this.outputs.push(output);
        if (this.onOutputAdded) {
            this.onOutputAdded(output);
        }

        if (LiteGraph.auto_load_slot_types)
            LiteGraph.registerNodeAndSlotType(this, type, true);

        this.setSize(this.computeSize());
        this.setDirtyCanvas(true, true);
        return output;
    }

    /** remove an existing output slot */
    removeOutput(slot: number): void {
        const output = this.outputs[slot];

        this.disconnectOutput(slot);
        this.outputs.splice(slot, 1);
        for (var i = slot; i < this.outputs.length; ++i) {
            if (!this.outputs[i] || !this.outputs[i].links) {
                continue;
            }
            var links = this.outputs[i].links;
            for (var j = 0; j < links.length; ++j) {
                var link = this.graph.links[links[j]];
                if (!link) {
                    continue;
                }
                link.origin_slot -= 1;
            }
        }

        this.setSize(this.computeSize());
        if (this.onOutputRemoved) {
            this.onOutputRemoved(slot, output);
        }
        this.setDirtyCanvas(true, true);
    }

    moveOutput(slot: number, newSlot: number): void {
        const output = this.outputs[slot]
        if (output == null)
            return;

        if (newSlot < 0 || newSlot > this.outputs.length - 1)
            return;

        const otherOutput = this.outputs[newSlot];

        if (output.links) {
            for (const linkID of output.links) {
                const link = this.graph.links[linkID]
                link.origin_slot = newSlot
            }
        }

        if (otherOutput.links) {
            for (const linkID of otherOutput.links) {
                const otherLink = this.graph.links[linkID]
                otherLink.origin_slot = slot
            }
        }

        this.outputs[newSlot] = output;
        this.outputs[slot] = otherOutput;
    }

    /**
     * add a new input slot to use in this node
     * @param name
     * @param type string defining the input type ("vec3","number",...), it its a generic one use 0
     * @param extra_info this can be used to have special properties of an input (label, color, position, etc)
     */
    addInput(
        name: string,
        type: SlotType = BuiltInSlotType.DEFAULT,
        extra_info?: Partial<INodeInputSlot>
    ): INodeInputSlot {
        var input: INodeInputSlot = { name: name, type: type, link: null, properties: {} };
        if (extra_info) {
            for (var i in extra_info) {
                input[i] = extra_info[i];
            }
        }

        if ((input.shape == null || input.shape == BuiltInSlotShape.DEFAULT)) {
            if (type == "array") {
                input.shape = BuiltInSlotShape.GRID_SHAPE;
            }
            else if (type === BuiltInSlotType.EVENT || type === BuiltInSlotType.ACTION) {
                input.shape = BuiltInSlotShape.BOX_SHAPE;
            }
        }

        if (!this.inputs) {
            this.inputs = [];
        }

        this.inputs.push(input);
        this.setSize(this.computeSize());

        if (this.onInputAdded) {
            this.onInputAdded(input);
        }

        LiteGraph.registerNodeAndSlotType(this, type);

        this.setDirtyCanvas(true, true);
        return input;
    }

    /** remove an existing input slot */
    removeInput(slot: number): void {
        this.disconnectInput(slot);
        var slot_info = this.inputs.splice(slot, 1);
        for (var i = slot; i < this.inputs.length; ++i) {
            if (!this.inputs[i]) {
                continue;
            }
            var link = this.graph.links[this.inputs[i].link];
            if (!link) {
                continue;
            }
            link.target_slot -= 1;
        }
        this.setSize(this.computeSize());
        if (this.onInputRemoved) {
            this.onInputRemoved(slot, slot_info[0]);
        }
        this.setDirtyCanvas(true, true);
    }

    moveInput(slot: number, newSlot: number): void {
        const input = this.inputs[slot]
        if (input == null)
            return;

        if (newSlot < 0 || newSlot > this.inputs.length - 1)
            return;

        const otherInput = this.inputs[newSlot];

        if (input.link != null) {
            const link = this.graph.links[input.link]
            link.target_slot = newSlot
        }

        if (otherInput.link != null) {
            const otherLink = this.graph.links[otherInput.link]
            otherLink.target_slot = slot
        }

        this.inputs[newSlot] = input;
        this.inputs[slot] = otherInput;
    }

    /**
     * add an special connection to this node (used for special kinds of graphs)
     * @param name
     * @param type string defining the input type ("vec3","number",...)
     * @param pos position of the connection inside the node
     * @param direction if is input or output
     */
    addConnection(
        name: string,
        type: string,
        pos: Vector2,
        direction: string
    ): INodeConnection {
        let o = {
            name: name,
            type: type,
            pos: pos,
            direction: direction,
            links: null
        };
        this.connections.push(o);
        return o;
    }

    /** computes the size of a node according to its inputs and output slots */
    computeSize(out: Vector2 = [0, 0]): Vector2 {
        const overrideSize = getStaticPropertyOnInstance<Vector2>(this, "overrideSize");
        if (overrideSize) {
            return overrideSize.concat() as Vector2;
        }

        var rows = Math.max(
            this.inputs ? this.inputs.length : 1,
            this.outputs ? this.outputs.length : 1
        );
        var size = out;
        rows = Math.max(rows, 1);
        var font_size = LiteGraph.NODE_TEXT_SIZE; //although it should be graphcanvas.inner_text_font size

        var title_width = compute_text_size(this.title);
        var input_width = 0;
        var output_width = 0;

        if (this.inputs) {
            for (var i = 0, l = this.inputs.length; i < l; ++i) {
                var input = this.inputs[i];
                var text = input.label || input.name || "";
                var text_width = compute_text_size(text);
                if (input_width < text_width) {
                    input_width = text_width;
                }
            }
        }

        if (this.outputs) {
            for (var i = 0, l = this.outputs.length; i < l; ++i) {
                var output = this.outputs[i];
                var text = output.label || output.name || "";
                var text_width = compute_text_size(text);
                if (output_width < text_width) {
                    output_width = text_width;
                }
            }
        }

        size[0] = Math.max(input_width + output_width + 10, title_width);
        size[0] = Math.max(size[0], LiteGraph.NODE_WIDTH);
        if (this.widgets && this.widgets.length) {
            for (const widget of this.widgets) {
                size[0] = Math.max(size[0], widget.width || LiteGraph.NODE_WIDTH * 1.5);
            }
        }

        size[1] = ((this.constructor as any).slot_start_y || 0) + rows * LiteGraph.NODE_SLOT_HEIGHT;

        var widgets_height = 0;
        if (this.widgets && this.widgets.length) {
            for (var i = 0, l = this.widgets.length; i < l; ++i) {
                const w = this.widgets[i]
                if (w.hidden)
                    continue;
                else if (w.computeSize)
                    widgets_height += w.computeSize(size[0])[1] + 4;
                else
                    widgets_height += LiteGraph.NODE_WIDGET_HEIGHT + 4;
            }
            widgets_height += 8;
        }

        //compute height using widgets height
        if (this.widgets_up)
            size[1] = Math.max(size[1], widgets_height);
        else if (this.widgets_start_y != null)
            size[1] = Math.max(size[1], widgets_height + this.widgets_start_y);
        else
            size[1] += widgets_height;

        function compute_text_size(text) {
            if (!text) {
                return 0;
            }
            return font_size * text.length * 0.6;
        }

        if ((this.constructor as any).min_height && size[1] < (this.constructor as any).min_height) {
            size[1] = (this.constructor as any).min_height;
        }

        size[1] += 6; //margin

        return size;
    }

    /**
     * returns all the info available about a property of this node.
     *
     * @method getPropertyInfo
     * @param {String} property name of the property
     * @return {Object} the object with all the available info
    */
    getPropertyInfo(property: string): IPropertyInfo {
        var info = null;

        //there are several ways to define info about a property
        //legacy mode
        if (this.properties_info) {
            for (var i = 0; i < this.properties_info.length; ++i) {
                if (this.properties_info[i].name == property) {
                    info = this.properties_info[i];
                    break;
                }
            }
        }
        //litescene mode using the constructor
        if (this.constructor["@" + property])
            info = this.constructor["@" + property];

        if ((this.constructor as any).widgets_info && (this.constructor as any).widgets_info[property])
            info = (this.constructor as any).widgets_info[property];

        //litescene mode using the constructor
        if (!info && this.onGetPropertyInfo) {
            info = this.onGetPropertyInfo(property);
        }

        if (!info)
            info = {};
        if (!info.type)
            info.type = typeof this.properties[property];
        if (info.widget == "combo")
            info.type = "enum";

        return info;
    }

    /**
     * https://github.com/jagenjo/litegraph.js/blob/master/guides/README.md#node-widgets
     * @return created widget
     */
    addWidget<T extends IWidget>(
        type: T["type"],
        name: string,
        value: T["value"],
        callback?: WidgetCallback<T> | string,
        options?: T["options"]
    ): T {
        if (!this.widgets) {
            this.widgets = [];
        }

        if (!options && callback && callback.constructor === Object) {
            options = callback;
            callback = null;
        }

        if (options && options.constructor === String) //options can be the property name
            options = { property: options };

        if (callback && callback.constructor === String) //callback can be the property name
        {
            if (!options)
                options = {};
            options.property = callback;
            callback = null;
        }

        if (callback && callback.constructor !== Function) {
            console.warn("addWidget: callback must be a function");
            callback = null;
        }

        var w = {
            type: type.toLowerCase(),
            name: name,
            value: value,
            callback: callback,
            options: options || {}
        } as T;

        if ((w.options as any).y !== undefined) {
            w.y = (w.options as any).y;
        }

        if (!callback && !w.options.callback && !w.options.property) {
            console.warn("LiteGraph addWidget(...) without a callback or property assigned");
        }
        if (type == "combo" && !w.options.values) {
            throw "LiteGraph addWidget('combo',...) requires to pass values in options: { values:['red','blue'] }";
        }
        this.widgets.push(w);
        this.setSize(this.computeSize());
        return w;
    }

    addCustomWidget<T extends IWidget>(customWidget: T): T {
        if (!this.widgets) {
            this.widgets = [];
        }
        this.widgets.push(customWidget);
        this.setSize(this.computeSize());
        return customWidget;
    }

    setWidgetHidden(widget: IWidget, hidden: boolean) {
        widget.hidden = hidden;
        this.setSize(this.computeSize());
    }

    /**
     * returns the bounding of the object, used for rendering purposes
     * @return [x, y, width, height]
     */
    getBounding(out?: Float32Array): Float32Array {
        out = out || new Float32Array(4);
        out[0] = this.pos[0] - 4;
        out[1] = this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT;
        out[2] = this.size[0] + 4;
        out[3] = this.flags.collapsed ? LiteGraph.NODE_TITLE_HEIGHT : this.size[1] + LiteGraph.NODE_TITLE_HEIGHT;

        if (this.onBounding) {
            this.onBounding(out);
        }
        return out;
    }

    /** checks if a point is inside the shape of a node */
    isPointInside(
        x: number,
        y: number,
        margin: number = 0,
        skipTitle: boolean = false
    ): boolean {
        var margin_top = this.graph && this.graph.isLive() ? 0 : LiteGraph.NODE_TITLE_HEIGHT;
        if (skipTitle) {
            margin_top = 0;
        }
        if (this.flags && this.flags.collapsed) {
            //if ( distance([x,y], [this.pos[0] + this.size[0]*0.5, this.pos[1] + this.size[1]*0.5]) < LiteGraph.NODE_COLLAPSED_RADIUS)
            if (
                LiteGraph.isInsideRectangle(
                    x,
                    y,
                    this.pos[0] - margin,
                    this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT - margin,
                    (this._collapsed_width || LiteGraph.NODE_COLLAPSED_WIDTH) +
                    2 * margin,
                    LiteGraph.NODE_TITLE_HEIGHT + 2 * margin
                )
            ) {
                return true;
            }
        } else if (
            this.pos[0] - 4 - margin < x &&
            this.pos[0] + this.size[0] + 4 + margin > x &&
            this.pos[1] - margin_top - margin < y &&
            this.pos[1] + this.size[1] + margin > y
        ) {
            return true;
        }
        return false;
    }

    /** checks if a point is inside a node slot, and returns info about which slot */
    getSlotInPosition(
        x: number,
        y: number
    ): SlotInPosition | null {
        //search for inputs
        var link_pos: Vector2 = [0, 0]
        if (this.inputs) {
            for (var i = 0, l = this.inputs.length; i < l; ++i) {
                var input = this.inputs[i];
                this.getConnectionPos(true, i, link_pos);
                if (
                    LiteGraph.isInsideRectangle(
                        x,
                        y,
                        link_pos[0] - 10,
                        link_pos[1] - 5,
                        20,
                        10
                    )
                ) {
                    return { input: input, slot: i, link_pos: link_pos };
                }
            }
        }

        if (this.outputs) {
            for (var i = 0, l = this.outputs.length; i < l; ++i) {
                var output = this.outputs[i];
                this.getConnectionPos(false, i, link_pos);
                if (
                    LiteGraph.isInsideRectangle(
                        x,
                        y,
                        link_pos[0] - 10,
                        link_pos[1] - 5,
                        20,
                        10
                    )
                ) {
                    return { output: output, slot: i, link_pos: link_pos };
                }
            }
        }

        return null;
    }

    is<T extends LGraphNode>(ctor: new () => T): this is T {
        const lgType: string | null = (ctor as any).__LITEGRAPH_TYPE__
        return lgType != null && this.type === lgType;
    }

    /**
     * returns the input slot with a given name (used for dynamic slots), -1 if not found
     * @param name the name of the slot
     * @return the slot (-1 if not found)
     */
    findInputSlotIndexByName(name?: string, onlyFree: boolean = false, typesNotAccepted?: SlotType[]): number {
        if (!this.inputs) {
            return -1;
        }
        for (var i = 0, l = this.inputs.length; i < l; ++i) {
            if (onlyFree && this.inputs[i].link && this.inputs[i].link != null) {
                continue;
            }
            if (typesNotAccepted && typesNotAccepted.includes(this.inputs[i].type)) {
                continue;
            }
            if (!name || name == this.inputs[i].name) {
                return i;
            }
        }
        return -1;
    }

    findInputSlotByName(name?: string, onlyFree: boolean = false, typesNotAccepted?: SlotType[]): INodeInputSlot | null {
        if (!this.inputs) {
            return null;
        }
        for (var i = 0, l = this.inputs.length; i < l; ++i) {
            if (onlyFree && this.inputs[i].link && this.inputs[i].link != null) {
                continue;
            }
            if (typesNotAccepted && typesNotAccepted.includes(this.inputs[i].type)) {
                continue;
            }
            if (!name || name == this.inputs[i].name) {
                return this.inputs[i];
            }
        }
        return null;
    }

    /**
     * returns the output slot with a given name (used for dynamic slots), -1 if not found
     * @param name the name of the slot
     * @return  the slot (-1 if not found)
     */
    findOutputSlotIndexByName(name?: string, onlyFree: boolean = false, typesNotAccepted?: SlotType[]): number {
        if (!this.outputs) {
            return -1;
        }
        for (var i = 0, l = this.outputs.length; i < l; ++i) {
            if (onlyFree && this.outputs[i].links && this.outputs[i].links != null) {
                continue;
            }
            if (typesNotAccepted && typesNotAccepted.includes(this.outputs[i].type)) {
                continue;
            }
            if (!name || name == this.outputs[i].name) {
                return i;
            }
        }
        return -1;
    }

    findOutputSlotByName(name?: string, onlyFree: boolean = false, typesNotAccepted?: SlotType[]): INodeOutputSlot | null {
        if (!this.outputs) {
            return null;
        }
        for (var i = 0, l = this.outputs.length; i < l; ++i) {
            if (onlyFree && this.outputs[i].links && this.outputs[i].links != null) {
                continue;
            }
            if (typesNotAccepted && typesNotAccepted.includes(this.outputs[i].type)) {
                continue;
            }
            if (!name || name == this.outputs[i].name) {
                return this.outputs[i];
            }
        }
        return null;
    }

    /**
     * findSlotByType for INPUTS
     */
    findInputSlotIndexByType(type: SlotType, preferFreeSlot: boolean = false, doNotUseOccupied: boolean = false): number {
        return this.findSlotByType<INodeInputSlot>(true, type, false, preferFreeSlot, doNotUseOccupied) as number;
    }

    /**
     * findSlotByType for OUTPUTS
     */
    findOutputSlotIndexByType(type: SlotType, preferFreeSlot: boolean = false, doNotUseOccupied: boolean = false): number {
        return this.findSlotByType<INodeOutputSlot>(false, type, false, preferFreeSlot, doNotUseOccupied) as number;
    }

    /**
     * findSlotByType for INPUTS
     */
    findInputSlotByType(type: SlotType, preferFreeSlot: boolean = false, doNotUseOccupied: boolean = false): INodeInputSlot | null {
        return this.findSlotByType<INodeInputSlot>(true, type, false, preferFreeSlot, doNotUseOccupied) as INodeInputSlot | null;
    }

    /**
     * findSlotByType for OUTPUTS
     */
    findOutputSlotByType(type: SlotType, preferFreeSlot: boolean = false, doNotUseOccupied: boolean = false): INodeOutputSlot | null {
        return this.findSlotByType<INodeOutputSlot>(false, type, false, preferFreeSlot, doNotUseOccupied) as INodeOutputSlot | null;
    }

    /**
     * returns the output (or input) slot with a given type, -1 if not found
     * @method findSlotByType
     * @param {boolean} input uise inputs instead of outputs
     * @param {string} type the type of the slot
     * @param {boolean} preferFreeSlot if we want a free slot (if not found, will return the first of the type anyway)
     * @return {number_or_object} the slot (-1 if not found)
     */
    private findSlotByType<T extends INodeSlot>(input: boolean, type: SlotType, returnObj: boolean, preferFreeSlot: boolean = false, doNotUseOccupied: boolean = false): T | SlotIndex | null {
        preferFreeSlot = preferFreeSlot || false;
        doNotUseOccupied = doNotUseOccupied || false;
        var aSlots = input ? this.inputs : this.outputs;
        if (!aSlots) {
            return returnObj ? null : -1;
        }
        // !! empty string type is considered 0, * !!
        if (type == "" || type == "*") type = 0;
        for (var i = 0, l = aSlots.length; i < l; ++i) {
            var tFound = false;
            var aSource: SlotType[] = (type + "").toLowerCase().split(",");
            var aDests = (aSlots[i].type == "0" || aSlots[i].type == "*" ? "0" : aSlots[i].type) as string;
            let aDest: SlotType[] = (aDests + "").toLowerCase().split(",");
            for (let sI = 0; sI < aSource.length; sI++) {
                for (let dI = 0; dI < aDest.length; dI++) {
                    if (aSource[sI] == "_event_") aSource[sI] = BuiltInSlotType.EVENT;
                    if (aDest[sI] == "_event_") aDest[sI] = BuiltInSlotType.EVENT;
                    if (aSource[sI] == "*") aSource[sI] = BuiltInSlotType.DEFAULT;
                    if (aDest[sI] == "*") aDest[sI] = BuiltInSlotType.DEFAULT;
                    if (aSource[sI] == aDest[dI]) {
                        let slot = aSlots[i] as any;
                        if (preferFreeSlot
                            && (slot.links && slot.links !== null)
                            || (slot.link && slot.link !== null))
                            continue;
                        return returnObj ? slot as T : i;
                    }
                }
            }
        }
        // if didnt find some, stop checking for free slots
        if (preferFreeSlot && !doNotUseOccupied) {
            for (var i = 0, l = aSlots.length; i < l; ++i) {
                var tFound = false;
                var aSource: SlotType[] = (type + "").toLowerCase().split(",");
                var aDests = aSlots[i].type == "0" || aSlots[i].type == "*" ? "0" : aSlots[i].type as string;
                let aDest: SlotType[] = (aDests + "").toLowerCase().split(",");
                for (let sI = 0; sI < aSource.length; sI++) {
                    for (let dI = 0; dI < aDest.length; dI++) {
                        if (aSource[sI] == "*") aSource[sI] = BuiltInSlotType.DEFAULT;
                        if (aDest[sI] == "*") aDest[sI] = BuiltInSlotType.DEFAULT;
                        if (aSource[sI] == aDest[dI]) {
                            return returnObj ? (aSlots[i] as any) as T : i;
                        }
                    }
                }
            }
        }
        return returnObj ? null : -1;
    }

    /**
     * connect this node output to the input of another node BY TYPE
     * @method connectByType
     * @param {number_or_string} slot (could be the number of the slot or the string with the name of the slot)
     * @param {LGraphNode} node the target node
     * @param {string} target_type the input slot type of the target node
     * @return {Object} the link_info is created, otherwise null
     */
    connectByTypeInput(slot: SlotNameOrIndex, targetNode: LGraphNode, targetSlotType: SlotType, optsIn: {
        createEventInCase?: boolean,
        firstFreeIfOutputGeneralInCase?: boolean,
        generalTypeInCase?: boolean,
    } = {}) {
        var optsDef = {
            createEventInCase: true
            , firstFreeIfOutputGeneralInCase: true
            , generalTypeInCase: true
        };
        var opts = Object.assign(optsDef, optsIn);
        if (targetNode && targetNode.constructor === Number) {
            targetNode = this.graph.getNodeById(targetNode);
        }

        let sourceSlotType = targetSlotType;
        if (targetSlotType === BuiltInSlotType.EVENT)
            sourceSlotType = BuiltInSlotType.ACTION;
        else if (targetSlotType === BuiltInSlotType.ACTION)
            sourceSlotType = BuiltInSlotType.EVENT;

        let targetSlot = targetNode.findInputSlotIndexByType(sourceSlotType, true);
        if (targetSlot >= 0 && targetSlot !== null) {
            if (LiteGraph.debug)
                console.debug("CONNbyTYPE type " + targetSlotType + " for " + targetSlot)
            return this.connect(slot, targetNode, targetSlot);
        } else {
            if (LiteGraph.debug)
                console.log("type " + targetSlotType + " not found or not free?")
            if (opts.createEventInCase && targetSlotType == BuiltInSlotType.EVENT) {
                // WILL CREATE THE onTrigger IN SLOT
                if (LiteGraph.debug)
                    console.debug("connect WILL CREATE THE onTrigger " + targetSlotType + " to " + targetNode);
                return this.connect(slot, targetNode, -1);
            }
            // connect to the first general output slot if not found a specific type and
            if (opts.generalTypeInCase) {
                let targetSlot = targetNode.findInputSlotIndexByType(BuiltInSlotType.DEFAULT, true, true);
                if (LiteGraph.debug)
                    console.debug("connect TO a general type (*, 0), if not found the specific type ", targetSlotType, " to ", targetNode, "RES_SLOT:", targetSlot);
                if (targetSlot >= 0) {
                    return this.connect(slot, targetNode, targetSlot);
                }
            }
            // connect to the first free input slot if not found a specific type and this output is general
            if (opts.firstFreeIfOutputGeneralInCase && (targetSlotType == 0 || targetSlotType == "*" || targetSlotType == "")) {
                let targetSlot = targetNode.findInputSlotIndexByName(null, true, [BuiltInSlotType.EVENT]);
                if (LiteGraph.debug)
                    console.debug("connect TO TheFirstFREE ", targetSlotType, " to ", targetNode, "RES_SLOT:", targetSlot);
                if (targetSlot >= 0) {
                    return this.connect(slot, targetNode, targetSlot);
                }
            }

            if (LiteGraph.debug)
                console.error("no way to connect type: ", targetSlotType, " to targetNODE ", targetNode);
            //TODO filter

            return null;
        }
    }

    /**
     * connect this node input to the output of another node BY TYPE
     * @method connectByType
     * @param {number_or_string} slot (could be the number of the slot or the string with the name of the slot)
     * @param {LGraphNode} node the target node
     * @param {string} target_type the output slot type of the target node
     * @return {Object} the link_info is created, otherwise null
     */
    connectByTypeOutput(slot: SlotNameOrIndex, sourceNode: LGraphNode, sourceSlotType: SlotType, optsIn: {
        createEventInCase?: boolean,
        firstFreeIfOutputGeneralInCase?: boolean,
        generalTypeInCase?: boolean,
    } = {}) {
        var optsDef = {
            createEventInCase: true
            , firstFreeIfInputGeneralInCase: true
            , generalTypeInCase: true
        };
        var opts = Object.assign(optsDef, optsIn);
        if (sourceNode && sourceNode.constructor === Number) {
            sourceNode = this.graph.getNodeById(sourceNode);
        }

        let targetSlotType = sourceSlotType;
        if (sourceSlotType === BuiltInSlotType.EVENT)
            targetSlotType = BuiltInSlotType.ACTION;
        else if (sourceSlotType === BuiltInSlotType.ACTION)
            targetSlotType = BuiltInSlotType.EVENT;

        sourceSlot = sourceNode.findOutputSlotIndexByType(targetSlotType, true);
        if (sourceSlot >= 0 && sourceSlot !== null) {
            console.debug("CONNbyTYPE OUT! type " + sourceSlotType + " for " + sourceSlot + " to " + targetSlotType)
            return sourceNode.connect(sourceSlot, this, slot);
        } else {

            // connect to the first general output slot if not found a specific type and
            if (opts.generalTypeInCase) {
                var sourceSlot = sourceNode.findOutputSlotIndexByType(0, true, true);
                if (sourceSlot >= 0) {
                    return sourceNode.connect(sourceSlot, this, slot);
                }
            }

            if (opts.createEventInCase && sourceSlotType == BuiltInSlotType.EVENT || sourceSlotType == BuiltInSlotType.ACTION) {
                // WILL CREATE THE onExecuted OUT SLOT
                if (LiteGraph.do_add_triggers_slots) {
                    var sourceSlot = sourceNode.addOnExecutedOutput();
                    return sourceNode.connect(sourceSlot, this, slot);
                }
            }
            // connect to the first free output slot if not found a specific type and this input is general
            if (opts.firstFreeIfInputGeneralInCase && (sourceSlotType == 0 || sourceSlotType == "*" || sourceSlotType == "")) {
                let sourceSlot = sourceNode.findOutputSlotIndexByName(null, true, [BuiltInSlotType.EVENT, BuiltInSlotType.ACTION]);
                if (sourceSlot >= 0) {
                    return sourceNode.connect(sourceSlot, this, slot);
                }
            }

            console.error("no way to connect byOUT type: ", sourceSlotType, " to sourceNODE ", sourceNode);
            //TODO filter

            console.error("type OUT! " + sourceSlotType + " not found or not free?")
            return null;
        }
    }

    /**
     * connect this node output to the input of another node
     * @param slot (could be the number of the slot or the string with the name of the slot)
     * @param  targetNode the target node
     * @param  targetSlot the input slot of the target node (could be the number of the slot or the string with the name of the slot, or -1 to connect a trigger)
     * @return {Object} the linkInfo is created, otherwise null
     */
    connect<T = any>(
        slot: SlotNameOrIndex | BuiltInSlotType,
        targetNode: LGraphNode,
        targetSlot: number | string
    ): T | null {
        targetSlot = targetSlot || 0;

        if (!this.graph) {
            //could be connected before adding it to a graph
            throw new Error("Connect: Error, node doesn't belong to any graph. Nodes must be added first to a graph before connecting them.",)
            //due to link ids being associated with graphs
        }

        //seek for the output slot
        if (typeof slot === "string") {
            slot = this.findOutputSlotIndexByName(slot);
            if (slot == -1) {
                if (LiteGraph.debug) {
                    console.error("Connect: Error, no slot of name " + slot);
                }
                return null;
            }
        } else if (!this.outputs || slot >= this.outputs.length) {
            if (LiteGraph.debug) {
                console.error("Connect: Error, slot number not found");
            }
            return null;
        }

        if (targetNode && targetNode.constructor === Number) {
            targetNode = this.graph.getNodeById(targetNode);
        }
        if (!targetNode) {
            throw "target node is null";
        }

        //avoid loopback
        if (targetNode == this) {
            if (LiteGraph.debug) {
                console.error("Connect: Error, can't connect node to itself!");
            }
            return null;
        }

        if (!targetNode.graph) {
            throw new Error("Connect: Error, target node doesn't belong to any graph. Nodes must be added first to a graph before connecting them.")
        }

        //you can specify the slot by name
        if (typeof targetSlot === "string") {
            targetSlot = targetNode.findInputSlotIndexByName(targetSlot);
            if (targetSlot == -1) {
                if (LiteGraph.debug) {
                    console.error(
                        "Connect: Error, no slot of name " + targetSlot
                    );
                }
                return null;
            }
        } else if (targetSlot === BuiltInSlotType.EVENT) {
            if (LiteGraph.do_add_triggers_slots) {
                //search for first slot with event? :: NO this is done outside
                //console.log("Connect: Creating triggerEvent");
                // force mode
                targetNode.changeMode(NodeMode.ON_TRIGGER);
                targetSlot = targetNode.findInputSlotIndexByName("onTrigger");
            } else {
                if (LiteGraph.debug) {
                    console.error("Connect: Error, can't connect event target slot");
                }
                return null; // -- break --
            }
        } else if (
            !targetNode.inputs ||
            targetSlot >= targetNode.inputs.length
        ) {
            if (LiteGraph.debug) {
                console.error("Connect: Error, slot number not found");
            }
            return null;
        }

        var changed = false;

        var input = targetNode.inputs[targetSlot];
        var linkInfo = null;
        var output = this.outputs[slot];

        if (!this.outputs[slot]) {
            if (LiteGraph.debug) {
                console.warn("Connect: Invalid slot passed: " + slot);
                console.warn(this.outputs);
            }
            return null;
        }

        // allow target node to change slot
        if (targetNode.onBeforeConnectInput) {
            // This way node can choose another slot (or make a new one?)
            targetSlot = targetNode.onBeforeConnectInput(targetSlot); //callback
        }

        //check targetSlot and check connection types
        if (targetSlot === -1 || targetSlot === null || !LiteGraph.isValidConnection(output.type, input.type)) {
            this.setDirtyCanvas(false, true);
            if (changed)
                this.graph.connectionChange(this, linkInfo);
            console.warn("Connect: Invalid connection: ", targetSlot, output.type, input.type);
            return null;
        } else {
            if (LiteGraph.debug) {
                console.debug("valid connection", output.type, input.type);
            }
        }

        //allows nodes to block connection, callback
        if (targetNode.onConnectInput) {
            if (targetNode.onConnectInput(targetSlot, output.type, output, this, slot) === false) {
                if (LiteGraph.debug) {
                    console.debug("onConnectInput blocked", output.type, input.type);
                }
                return null;
            }
        }
        if (this.onConnectOutput) { // callback
            if (this.onConnectOutput(slot, input.type, input, targetNode, targetSlot) === false) {
                if (LiteGraph.debug) {
                    console.debug("onConnectOutput blocked", output.type, input.type);
                }
                return null;
            }
        }

        //if there is something already plugged there, disconnect
        if (targetNode.inputs[targetSlot] && targetNode.inputs[targetSlot].link != null) {
            this.graph.beforeChange();
            targetNode.disconnectInput(targetSlot, { doProcessChange: false });
            changed = true;
        }
        if (output.links !== null && output.links.length) {
            switch (output.type) {
                case BuiltInSlotType.EVENT:
                    if (!LiteGraph.allow_multi_output_for_events) {
                        this.graph.beforeChange();
                        this.disconnectOutput(slot, null, { doProcessChange: false }); // Input(targetSlot, {doProcessChange: false});
                        changed = true;
                    }
                    break;
                default:
                    break;
            }
        }

        let nextId: LinkID;
        if (LiteGraph.use_uuids)
            nextId = uuidv4();
        else
            nextId = ++this.graph.last_link_id;

        //create link class
        linkInfo = new LLink(
            nextId,
            input.type || output.type,
            this.id,
            slot,
            targetNode.id,
            targetSlot
        );

        if (this.graph.links[linkInfo.id]) {
            console.error("Link already exists in graph!", linkInfo.id, linkInfo, this.graph.links[linkInfo.id])
        }

        //add to graph links list
        this.graph.links[linkInfo.id] = linkInfo;

        //connect in output
        if (output.links == null) {
            output.links = [];
        }
        output.links.push(linkInfo.id);
        //connect in input
        targetNode.inputs[targetSlot].link = linkInfo.id;
        if (this.graph) {
            (this.graph as any)._version++;
        }
        if (this.onConnectionsChange) {
            this.onConnectionsChange(
                LConnectionKind.OUTPUT,
                slot,
                true,
                linkInfo,
                output
            );
        } //linkInfo has been created now, so its updated
        if (targetNode.onConnectionsChange) {
            targetNode.onConnectionsChange(
                LConnectionKind.INPUT,
                targetSlot,
                true,
                linkInfo,
                input
            );
        }
        if (this.graph && this.graph.onNodeConnectionChange) {
            this.graph.onNodeConnectionChange(
                LConnectionKind.INPUT,
                targetNode,
                targetSlot,
                this,
                slot
            );
            this.graph.onNodeConnectionChange(
                LConnectionKind.OUTPUT,
                this,
                slot,
                targetNode,
                targetSlot
            );
        }

        this.setDirtyCanvas(false, true);
        this.graph.afterChange();
        this.graph.connectionChange(this, linkInfo);

        return linkInfo;
    }

    /**
     * disconnect one output to an specific node
     * @param slot (could be the number of the slot or the string with the name of the slot)
     * @param targetNode the target node to which this slot is connected [Optional, if not targetNode is specified all nodes will be disconnected]
     * @return if it was disconnected successfully
     */
    disconnectOutput(slot: SlotNameOrIndex, targetNode?: LGraphNode, options?: object): boolean {
        if (typeof slot === "string") {
            slot = this.findOutputSlotIndexByName(slot);
            if (slot == -1) {
                if (LiteGraph.debug) {
                    console.error("Connect: Error, no slot of name " + slot);
                }
                return false;
            }
        } else if (!this.outputs || slot >= this.outputs.length) {
            if (LiteGraph.debug) {
                console.error("Connect: Error, slot number not found");
            }
            return false;
        }

        //get output slot
        var output = this.outputs[slot];
        if (!output || !output.links || output.links.length == 0) {
            return false;
        }

        //one of the output links in this slot
        if (targetNode) {
            if (targetNode.constructor === Number) {
                targetNode = this.graph.getNodeById(targetNode);
            }
            if (!targetNode) {
                throw "Target Node not found";
            }

            for (var i = 0, l = output.links.length; i < l; i++) {
                var link_id = output.links[i];
                var link_info = this.graph.links[link_id];

                //is the link we are searching for...
                if (link_info.target_id == targetNode.id) {
                    output.links.splice(i, 1); //remove here
                    var input = targetNode.inputs[link_info.target_slot];
                    input.link = null; //remove there
                    delete this.graph.links[link_id]; //remove the link from the links pool
                    if (this.graph) {
                        (this.graph as any)._version++;
                    }
                    if (targetNode.onConnectionsChange) {
                        targetNode.onConnectionsChange(
                            LConnectionKind.INPUT,
                            link_info.target_slot,
                            false,
                            link_info,
                            input
                        );
                    } //link_info hasn't been modified so its ok
                    if (this.onConnectionsChange) {
                        this.onConnectionsChange(
                            LConnectionKind.OUTPUT,
                            slot,
                            false,
                            link_info,
                            output
                        );
                    }
                    if (this.graph && this.graph.onNodeConnectionChange) {
                        this.graph.onNodeConnectionChange(
                            LConnectionKind.OUTPUT,
                            this,
                            slot
                        );
                    }
                    if (this.graph && this.graph.onNodeConnectionChange) {
                        this.graph.onNodeConnectionChange(
                            LConnectionKind.OUTPUT,
                            this,
                            slot
                        );
                        this.graph.onNodeConnectionChange(
                            LConnectionKind.INPUT,
                            targetNode,
                            link_info.target_slot
                        );
                    }
                    break;
                }
            }
        } //all the links in this output slot
        else {
            for (var i = 0, l = output.links.length; i < l; i++) {
                var link_id = output.links[i];
                var link_info = this.graph.links[link_id];
                if (!link_info) {
                    //bug: it happens sometimes
                    continue;
                }

                var targetNode = this.graph.getNodeById(link_info.target_id);
                var input: INodeInputSlot | null = null;
                if (this.graph) {
                    (this.graph as any)._version++;
                }
                if (targetNode) {
                    input = targetNode.inputs[link_info.target_slot];
                    input.link = null; //remove other side link
                    if (targetNode.onConnectionsChange) {
                        targetNode.onConnectionsChange(
                            LConnectionKind.INPUT,
                            link_info.target_slot,
                            false,
                            link_info,
                            input
                        );
                    } //link_info hasn't been modified so its ok
                    if (this.graph && this.graph.onNodeConnectionChange) {
                        this.graph.onNodeConnectionChange(
                            LConnectionKind.INPUT,
                            targetNode,
                            link_info.target_slot
                        );
                    }
                }
                delete this.graph.links[link_id]; //remove the link from the links pool
                if (this.onConnectionsChange) {
                    this.onConnectionsChange(
                        LConnectionKind.OUTPUT,
                        slot,
                        false,
                        link_info,
                        output
                    );
                }
                if (this.graph && this.graph.onNodeConnectionChange) {
                    this.graph.onNodeConnectionChange(
                        LConnectionKind.OUTPUT,
                        this,
                        slot
                    );
                    this.graph.onNodeConnectionChange(
                        LConnectionKind.INPUT,
                        targetNode,
                        link_info.target_slot
                    );
                }
            }
            output.links = null;
        }

        this.setDirtyCanvas(false, true);
        this.graph.connectionChange(this);
        return true;
    }

    /**
     * disconnect one input
     * @param slot (could be the number of the slot or the string with the name of the slot)
     * @return if it was disconnected successfully
     */
    disconnectInput(slot: SlotNameOrIndex, options: { doProcessChange?: boolean } = {}): boolean {
        //seek for the output slot
        if (typeof slot === "string") {
            slot = this.findInputSlotIndexByName(slot);
            if (slot == -1) {
                if (LiteGraph.debug) {
                    console.error("Connect: Error, no slot of name " + slot);
                }
                return false;
            }
        } else if (!this.inputs || slot >= this.inputs.length) {
            if (LiteGraph.debug) {
                console.error("Connect: Error, slot number not found");
            }
            return false;
        }

        var input = this.inputs[slot];
        if (!input) {
            return false;
        }

        var link_id = this.inputs[slot].link;
        if (link_id != null) {
            this.inputs[slot].link = null;

            //remove other side
            var link_info = this.graph.links[link_id];
            if (link_info) {
                var targetNode = this.graph.getNodeById(link_info.origin_id);
                if (!targetNode) {
                    return false;
                }

                var output = targetNode.outputs[link_info.origin_slot];
                if (!output || !output.links || output.links.length == 0) {
                    return false;
                }

                //search in the inputs list for this link
                for (var i = 0, l = output.links.length; i < l; i++) {
                    if (output.links[i] == link_id) {
                        output.links.splice(i, 1);
                        break;
                    }
                }

                delete this.graph.links[link_id]; //remove from the pool
                if (this.graph) {
                    (this.graph as any)._version++;
                }
                if (this.onConnectionsChange) {
                    this.onConnectionsChange(
                        LConnectionKind.INPUT,
                        slot,
                        false,
                        link_info,
                        input
                    );
                }
                if (targetNode.onConnectionsChange) {
                    targetNode.onConnectionsChange(
                        LConnectionKind.OUTPUT,
                        i,
                        false,
                        link_info,
                        output
                    );
                }
                if (this.graph && this.graph.onNodeConnectionChange) {
                    this.graph.onNodeConnectionChange(
                        LConnectionKind.OUTPUT,
                        targetNode,
                        i
                    );
                    this.graph.onNodeConnectionChange(LConnectionKind.INPUT, this, slot);
                }
            }
        } //link != null

        this.setDirtyCanvas(false, true);
        if (this.graph)
            this.graph.connectionChange(this);
        return true;
    }

    /**
     * returns the center of a connection point in canvas coords
     * @param is_input true if if a input slot, false if it is an output
     * @param slot (could be the number of the slot or the string with the name of the slot)
     * @param out a place to store the output, to free garbage
     * @return the position
     **/
    getConnectionPos(is_input: boolean, slotNumber: SlotIndex, out: Vector2 = [0, 0], ignore_collapsed: boolean = false): Vector2 {
        var num_slots = 0;
        if (is_input && this.inputs) {
            num_slots = this.inputs.length;
        }
        if (!is_input && this.outputs) {
            num_slots = this.outputs.length;
        }

        var offset = LiteGraph.NODE_SLOT_HEIGHT * 0.5;

        if (this.flags.collapsed && !ignore_collapsed) {
            var w = this._collapsed_width || LiteGraph.NODE_COLLAPSED_WIDTH;
            if (this.horizontal) {
                out[0] = this.pos[0] + w * 0.5;
                if (is_input) {
                    out[1] = this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT;
                } else {
                    out[1] = this.pos[1];
                }
            } else {
                if (is_input) {
                    out[0] = this.pos[0];
                } else {
                    out[0] = this.pos[0] + w;
                }
                out[1] = this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT * 0.5;
            }
            return out;
        }

        //weird feature that never got finished
        if (is_input && slotNumber == -1) {
            out[0] = this.pos[0] + LiteGraph.NODE_TITLE_HEIGHT * 0.5;
            out[1] = this.pos[1] + LiteGraph.NODE_TITLE_HEIGHT * 0.5;
            return out;
        }

        //hard-coded pos
        if (
            is_input &&
            num_slots > slotNumber &&
            this.inputs[slotNumber].pos
        ) {
            out[0] = this.pos[0] + this.inputs[slotNumber].pos[0];
            out[1] = this.pos[1] + this.inputs[slotNumber].pos[1];
            return out;
        } else if (
            !is_input &&
            num_slots > slotNumber &&
            this.outputs[slotNumber].pos
        ) {
            out[0] = this.pos[0] + this.outputs[slotNumber].pos[0];
            out[1] = this.pos[1] + this.outputs[slotNumber].pos[1];
            return out;
        }

        //horizontal distributed slots
        if (this.horizontal) {
            out[0] =
                this.pos[0] + (slotNumber + 0.5) * (this.size[0] / num_slots);
            if (is_input) {
                out[1] = this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT;
            } else {
                out[1] = this.pos[1] + this.size[1];
            }
            return out;
        }

        //default vertical slots
        if (is_input) {
            out[0] = this.pos[0] + offset;
        } else {
            out[0] = this.pos[0] + this.size[0] + 1 - offset;
        }
        out[1] =
            this.pos[1] +
            (slotNumber + 0.7) * LiteGraph.NODE_SLOT_HEIGHT +
            ((this.constructor as any).slot_start_y || 0);
        return out;
    }

    /** Force align to grid */
    alignToGrid(): void {
        this.pos[0] =
            LiteGraph.CANVAS_GRID_SIZE *
            Math.round(this.pos[0] / LiteGraph.CANVAS_GRID_SIZE);
        this.pos[1] =
            LiteGraph.CANVAS_GRID_SIZE *
            Math.round(this.pos[1] / LiteGraph.CANVAS_GRID_SIZE);
    }

    private console: string[] = []

    static MAX_CONSOLE: number = 100;

    /** Console output */
    trace(msg: string): void {
        if (!this.console) {
            this.console = [];
        }

        this.console.push(msg);
        if (this.console.length > LGraphNode.MAX_CONSOLE) {
            this.console.shift();
        }

        if (this.graph.onNodeTrace)
            this.graph.onNodeTrace(this, msg);
    }

    /** Forces to redraw or the main canvas (LGraphNode) or the bg canvas (links) */
    setDirtyCanvas(fg: boolean, bg: boolean = false): void {
        if (!this.graph) {
            return;
        }
        this.graph.sendActionToCanvas("setDirty", [fg, bg]);
    }

    loadImage(url: string): HTMLImageElement {
        var img = new Image();
        img.src = LiteGraph.node_images_path + url;

        var that = this;
        img.onload = function() {
            that.setDirtyCanvas(true);
        };
        return img;
    }

    /** Allows to get onMouseMove and onMouseUp events even if the mouse is out of focus */
    captureInput(v: any): void {
        if (!this.graph || !this.graph.list_of_graphcanvas) {
            return;
        }

        var list = this.graph.list_of_graphcanvas;

        for (var i = 0; i < list.length; ++i) {
            var c = list[i];
            //releasing somebody elses capture?!
            if (!v && c.node_capturing_input != this) {
                continue;
            }

            //change
            c.node_capturing_input = v ? this : null;
        }
    }

    isShowingTitle(mouseOver: boolean): boolean {
        if (this.titleMode == TitleMode.TRANSPARENT_TITLE || this.titleMode == TitleMode.NO_TITLE) {
            return false;
        } else if (this.titleMode == TitleMode.AUTOHIDE_TITLE && mouseOver) {
            return true;
        }
        return true
    }

    /** Collapse the node to make it smaller on the canvas */
    collapse(force: boolean = false): void {
        (this.graph as any)._version++;
        if (this.collapsable === false && !force) {
            return;
        }
        if (!this.flags.collapsed) {
            this.flags.collapsed = true;
        } else {
            this.flags.collapsed = false;
        }
        this.setDirtyCanvas(true, true);
    }

    /** Forces the node to do not move or realign on Z */
    pin(v?: boolean): void {
        (this.graph as any)._version++;
        if (v === undefined) {
            this.flags.pinned = !this.flags.pinned;
        } else {
            this.flags.pinned = v;
        }
    }

    localToScreen(x: number, y: number, graphCanvas: LGraphCanvas): Vector2 {
        return [
            (x + this.pos[0]) * graphCanvas.ds.scale + graphCanvas.ds.offset[0],
            (y + this.pos[1]) * graphCanvas.ds.scale + graphCanvas.ds.offset[1]
        ];
    }


    // https://github.com/jagenjo/litegraph.js/blob/master/guides/README.md#custom-node-appearance
    onDrawBackground?(
        ctx: CanvasRenderingContext2D,
        graphCanvas: LGraphCanvas,
        canvas: HTMLCanvasElement,
        pos: Vector2
    ): void;

    onDrawForeground?(
        ctx: CanvasRenderingContext2D,
        graphCanvas: LGraphCanvas,
        canvas: HTMLCanvasElement
    ): void;

    onDrawCollapsed?(
        ctx: CanvasRenderingContext2D,
        graphCanvas: LGraphCanvas
    ): boolean;

    onDrawTitleBar?(
        ctx: CanvasRenderingContext2D,
        graphCanvas: LGraphCanvas,
        title_height: number,
        size: Vector2,
        scale: number,
        fgColor: string
    ): boolean;

    onDrawTitleBox?(
        ctx: CanvasRenderingContext2D,
        graphCanvas: LGraphCanvas,
        title_height: number,
        size: Vector2,
        scale: number
    ): boolean;

    onDrawTitleText?(
        ctx: CanvasRenderingContext2D,
        graphCanvas: LGraphCanvas,
        title_height: number,
        size: Vector2,
        scale: number,
        font: string,
        selected: boolean
    ): boolean;

    onDrawTitle?(
        ctx: CanvasRenderingContext2D,
        graphCanvas: LGraphCanvas
    ): boolean;

    onBounding?(area: Float32Array): boolean;


    // https://github.com/jagenjo/litegraph.js/blob/master/guides/README.md#custom-node-behaviour
    onMouseDown?(
        event: MouseEventExt,
        pos: Vector2,
        graphCanvas: LGraphCanvas
    ): boolean | void;

    onMouseMove?(
        event: MouseEventExt,
        pos: Vector2,
        graphCanvas: LGraphCanvas
    ): void;

    onMouseUp?(
        event: MouseEventExt,
        pos: Vector2,
        graphCanvas: LGraphCanvas
    ): void;

    onMouseEnter?(
        event: MouseEventExt,
        pos: Vector2,
        graphCanvas: LGraphCanvas
    ): void;

    onMouseLeave?(
        event: MouseEventExt,
        pos: Vector2,
        graphCanvas: LGraphCanvas
    ): void;

    onDblClick?(
        event: MouseEventExt,
        pos: Vector2,
        graphCanvas: LGraphCanvas
    ): void;

    onKey?(event: KeyboardEvent, pos: Vector2, graphCanvas: LGraphCanvas): void;
    onKeyDown?(event: KeyboardEvent): void;
    onKeyUp?(event: KeyboardEvent): void;

    onResize?(size: Vector2): void;


    /** Called by `LGraphCanvas.selectNodes` */
    onSelected?(): void;

    /** Called by `LGraphCanvas.deselectNode` */
    onDeselected?(): void;

    /** Called by `LGraph.runStep` `LGraphNode.getInputData` */
    onExecute?(param: any, options: object): void;

    onAction?(action: any, param: any, options: LActionOptions): void;

    /** Called by `LGraph.serialize` */
    onSerialize?(o: SerializedLGraphNode): void;

    /** Called by `LGraph.configure` */
    onConfigure?(o: SerializedLGraphNode): void;

    /**
     * when added to graph (warning: this is called BEFORE the node is configured when loading)
     * Called by `LGraph.add`
     */
    onAdded?(graph: LGraph): void;

    /**
     * when removed from graph
     * Called by `LGraph.remove` `LGraph.clear`
     */
    onRemoved?(options?: LGraphRemoveNodeOptions): void;

    /**
     * if returns false the incoming connection will be canceled
     * Called by `LGraph.connect`
     * @param inputIndex target input slot number
     * @param outputType type of output slot
     * @param outputSlot output slot object
     * @param outputNode node containing the output
     * @param outputIndex index of output slot
     */
    onConnectInput?(
        inputIndex: number,
        outputType: INodeOutputSlot["type"],
        outputSlot: INodeOutputSlot,
        outputNode: LGraphNode,
        outputIndex: number
    ): boolean;

    /**
     * if returns false the incoming connection will be canceled
     * Called by `LGraph.connect`
     * @param outputIndex target output slot number
     * @param inputType type of input slot
     * @param inputSlot input slot object
     * @param inputNode node containing the input
     * @param inputIndex index of input slot
     */
    onConnectOutput?(
        outputIndex: number,
        inputType: INodeInputSlot["type"],
        inputSlot: INodeInputSlot,
        inputNode: LGraphNode,
        inputIndex: number
    ): boolean;


    /**
     * Called just before connection (or disconnect - if input is linked).
     * A convenient place to switch to another input, or create new one.
     * This allow for ability to automatically add slots if needed
     * @param inputIndex
     * @return selected input slot index, can differ from parameter value
     */
    onBeforeConnectInput?(
        inputIndex: number
    ): number;


    /** a connection changed (new one or removed) (LiteGraph.INPUT or LiteGraph.OUTPUT, slot, true if connected, linkInfo, input_info or output_info ) */
    onConnectionsChange?(
        type: LConnectionKind,
        slotIndex: number,
        isConnected: boolean,
        link: LLink,
        ioSlot: (INodeInputSlot | INodeOutputSlot)
    ): void;


    /**
     * if returns false, will abort the `LGraphNode.setProperty`
     * Called when a property is changed
     * @param property
     * @param value
     * @param prevValue
     */
    onPropertyChanged?(property: string, value: any, prevValue?: any): void | boolean;

    /**
     * Called when the node's title or other JS property changes
     */
    onJSPropertyChanged?(property: string, value: any, prevValue?: any): void | boolean;

    onGetPropertyInfo?(property: string): IPropertyInfo;

    onAddPropertyToPanel?(name: string, panel: INodePanel): boolean;
    onShowCustomPanelInfo?(panel: INodePanel): void;

    onWidgetChanged?(widget: IWidget, oldValue?: any): void;

    onMenuNodeInputs?(item: ContextMenuItem[]): ContextMenuItem[];

    onNodeOptionalInputAdd?(value: any): void;

    onInputAdded?(input: INodeInputSlot): void;

    onInputRemoved?(slot: SlotIndex, input: INodeInputSlot): void;

    onInputClick?(slot: SlotIndex, event: MouseEventExt): void;

    onInputDblClick?(slot: SlotIndex, event: MouseEventExt): void;

    onMenuNodeOutputs?(item: ContextMenuItem[]): ContextMenuItem[];

    onNodeOptionalOutputAdd?(value: any): void;

    updateOutputData?(slot: SlotIndex): void;

    onOutputAdded?(output: INodeOutputSlot): void;

    onOutputRemoved?(slot: SlotIndex, output: INodeOutputSlot): void;

    onOutputClick?(slot: SlotIndex, event: MouseEventExt): void;

    onOutputDblClick?(slot: SlotIndex, event: MouseEventExt): void;

    getOptionalSlots(): OptionalSlots | null {
        return getStaticPropertyOnInstance<OptionalSlots>(this, "optionalSlots");
    }

    onSlotPropertyChanged?(kind: LConnectionKind, slot: SlotIndex, slotInfo: INodeInputSlot | INodeOutputSlot, name: string, value: any, prev_value?: any): boolean;

    onReassignID?(idMap: GraphIDMapping): void;

    /** Called by `LGraphCanvas.processContextMenu` */
    getMenuOptions?(graphCanvas: LGraphCanvas): ContextMenuItem[];
    getExtraMenuOptions?(graphCanvas: LGraphCanvas, options: ContextMenuItem[]): ContextMenuItem[];
    getExtraLinkOptions?(graphCanvas: LGraphCanvas, link: LLink, linkType: LConnectionKind, options: ContextMenuItem[]): ContextMenuItem[];
    getSlotMenuOptions?(slot: SlotInPosition): ContextMenuItem[];
}

import type { ContextMenuItem } from "../ContextMenu";
import type { MouseEventExt } from "../DragAndScale";
import { INodeInputSlot, INodeOutputSlot } from "../INodeSlot";
import LGraph, { LGraphAddNodeOptions, LGraphRemoveNodeOptions, SerializedLGraph } from "../LGraph";
import type LGraphCanvas from "../LGraphCanvas";
import type { LActionOptions, LGraphNodeCloneData, OptionalSlots, PropertyLayout, SerializedLGraphNode, SlotLayout } from "../LGraphNode";
import LGraphNode from "../LGraphNode";
import LLink from "../LLink";
import LiteGraph from "../LiteGraph";
import { BuiltInSlotShape, SlotType, type NodeMode, type Vector2, LinkID, NodeID, BuiltInSlotType } from "../types";
import { UUID } from "../types";
import { toHashMap } from "../utils";
import GraphInput from "./GraphInput";
import GraphOutput from "./GraphOutput";
import { v4 as uuidv4 } from "uuid"

export interface SubgraphProperties extends Record<string, any> {
    enabled: boolean
}

export type SubgraphInputPair = {
    innerNode: GraphInput,
    outerInput: INodeInputSlot,
    outerInputIndex: number
}

export type SubgraphOutputPair = {
    innerNode: GraphOutput,
    outerOutput: INodeOutputSlot,
    outerOutputIndex: number
}

/*
 * Two-directional mappings from old -> new *and* new -> old for replaced
 * node/link IDs.
 */
export type GraphIDMapping = {
    nodeIDs: Record<NodeID, NodeID>,
    linkIDs: Record<LinkID, LinkID>,
}

export function reassignGraphIDs(graph: SerializedLGraph): GraphIDMapping {
    const idMap: GraphIDMapping = { nodeIDs: {}, linkIDs: {} }

    for (const node of graph.nodes) {
        const oldID = node.id
        const newID = uuidv4()
        node.id = newID

        if (idMap.nodeIDs[oldID] || idMap.nodeIDs[newID]) {
            throw new Error(`New/old node UUID wasn't unique in changed map! ${oldID} ${newID}`)
        }

        idMap.nodeIDs[oldID] = newID
        idMap.nodeIDs[newID] = oldID
    }

    for (const link of graph.links) {
        const oldID = link[0]
        const newID = uuidv4();
        link[0] = newID

        if (idMap.linkIDs[oldID] || idMap.linkIDs[newID]) {
            throw new Error(`New/old link UUID wasn't unique in changed map! ${oldID} ${newID}`)
        }

        idMap.linkIDs[oldID] = newID
        idMap.linkIDs[newID] = oldID

        const nodeFrom = link[1]
        const nodeTo = link[3]

        if (!idMap.nodeIDs[nodeFrom]) {
            throw new Error(`Old node UUID not found in mapping! ${nodeFrom}`)
        }

        link[1] = idMap.nodeIDs[nodeFrom]

        if (!idMap.nodeIDs[nodeTo]) {
            throw new Error(`Old node UUID not found in mapping! ${nodeTo}`)
        }

        link[3] = idMap.nodeIDs[nodeTo]
    }

    // Reconnect links
    for (const node of graph.nodes) {
        for (const input of node.inputs) {
            if (input.link) {
                input.link = idMap.linkIDs[input.link]
            }
        }
        for (const output of node.outputs) {
            if (output.links) {
                output.links = output.links.map(l => idMap.linkIDs[l]);
            }
        }
    }

    // Recurse!
    for (const node of graph.nodes) {
        if (node.type === "graph/subgraph") {
            const merge = reassignGraphIDs((node as any).subgraph as SerializedLGraph)
            idMap.nodeIDs = { ...idMap.nodeIDs, ...merge.nodeIDs }
            idMap.linkIDs = { ...idMap.linkIDs, ...merge.linkIDs }
        }
    }

    return idMap
}

function notifyReassignedIDs(subgraph: LGraph, mapping: GraphIDMapping) {
    for (const node of subgraph.iterateNodesInOrderRecursive()) {
        if (node.onReassignID)
            node.onReassignID(mapping);
    }
}

export default class Subgraph extends LGraphNode {
    // default constructor to use for new subgraphs created from the right-click context menu
    static default_lgraph_factory: () => LGraph = () => new LGraph;

    override properties: SubgraphProperties = {
        enabled: true
    }

    static slotLayout: SlotLayout = {
        inputs: [],
        outputs: []
    }

    static propertyLayout: PropertyLayout = [
        { name: "enabled", defaultValue: true }
    ]

    static optionalSlots: OptionalSlots = {
        outputs: [
            { name: "enabled", type: "boolean" }
        ]
    }

    override size: Vector2 = [140, 80];

    enabled: boolean = true;
    subgraph: LGraph;

    constructor(title?: string, graphFactory?: () => LGraph) {
        super(title)
        this.subgraph = (graphFactory || Subgraph.default_lgraph_factory)();
        this.subgraph._subgraph_node = this;
        this.subgraph._is_subgraph = true;

        // Support hooking into subclasses of LGraph with the subgraph lifecycle methods
        const wrap = <T extends Function>(origFn: T, ours: Function): T => {
            const oursBound = ours.bind(this);
            return function(this: LGraph, ...args) {
                origFn?.apply(this, args)
                oursBound(...args)
            } as any
        }

        this.subgraph.onTrigger = wrap(this.subgraph.onTrigger, this.onSubgraphTrigger);

        this.subgraph.onNodeAdded = wrap(this.subgraph.onNodeAdded, this.onSubgraphNodeAdded);
        this.subgraph.onNodeRemoved = wrap(this.subgraph.onNodeRemoved, this.onSubgraphNodeRemoved);

        //nodes input node added inside
        this.subgraph.onInputAdded = wrap(this.subgraph.onInputAdded, this.onSubgraphNewInput);
        this.subgraph.onInputRenamed = wrap(this.subgraph.onInputRenamed, this.onSubgraphRenamedInput);
        this.subgraph.onInputTypeChanged = wrap(this.subgraph.onInputTypeChanged, this.onSubgraphTypeChangeInput);
        this.subgraph.onInputRemoved = wrap(this.subgraph.onInputRemoved, this.onSubgraphRemovedInput);

        this.subgraph.onOutputAdded = wrap(this.subgraph.onOutputAdded, this.onSubgraphNewOutput);
        this.subgraph.onOutputRenamed = wrap(this.subgraph.onOutputRenamed, this.onSubgraphRenamedOutput);
        this.subgraph.onOutputTypeChanged = wrap(this.subgraph.onOutputTypeChanged, this.onSubgraphTypeChangeOutput);
        this.subgraph.onOutputRemoved = wrap(this.subgraph.onOutputRemoved, this.onSubgraphRemovedOutput);
    }

    // getRootGraph(): LGraph | null {
    //     const graphs = Array.from(this.iterateParentGraphs());
    //     const graph = graphs[graphs.length - 1]
    //     // console.warn(graph._is_subgraph)
    //     if (graph._is_subgraph)
    //         return null;
    //     return graph;
    // }

    *iterateParentGraphs(): Iterable<LGraph> {
        let graph = this.graph;
        while (graph) {
            yield graph;
            graph = graph._subgraph_node?.graph;
        }
    }

    override onDblClick(e: MouseEventExt, pos: Vector2, graphCanvas: LGraphCanvas) {
        var that = this;
        setTimeout(function() {
            graphCanvas.openSubgraph(that.subgraph);
        }, 10);
    };

    override onAction(action: any, param: any, options: LActionOptions) {
        // this.subgraph.onAction(action, param);

        const { originNode, link } = options;

        if (!originNode || !link)
            return;

        const targetSlot = link.target_slot;

        const graphInput = this.getInnerGraphInputByIndex(targetSlot)
        // console.debug("[Subgraph] Trigger slot!", graphInput, targetSlot, link, originNode, action, param);
        graphInput.triggerSlot(0, param);
    };

    override onExecute() {
        this.enabled = this.getInputOrProperty("enabled");
        if (!this.enabled) {
            return;
        }

        //send inputs to subgraph global inputs
        if (this.inputs) {
            for (var i = 0; i < this.inputs.length; i++) {
                var input = this.inputs[i];
                var value = this.getInputData(i);
                this.subgraph.setInputData(input.name, value);
            }
        }

        //execute
        this.subgraph.runStep();

        //send subgraph global outputs to outputs
        if (this.outputs) {
            for (var i = 0; i < this.outputs.length; i++) {
                var output = this.outputs[i];
                var value = this.subgraph.getOutputData(output.name);
                this.setOutputData(i, value);
            }
        }
    };

    sendEventToAllNodes(eventname: string, param: any, mode: NodeMode) {
        if (this.enabled) {
            this.subgraph.sendEventToAllNodes(eventname, param, mode);
        }
    };

    override onDrawBackground(ctx: CanvasRenderingContext2D, graphcanvas: LGraphCanvas, canvas: HTMLCanvasElement, pos: Vector2) {
        // if (this.flags.collapsed)
        //     return;
        // var y = this.size[1] - LiteGraph.NODE_TITLE_HEIGHT + 0.5;
        // const can_interact = graphcanvas.allow_interaction && !graphcanvas.read_only;
        // // button
        // var over = LiteGraph.isInsideRectangle(pos[0], pos[1], this.pos[0], this.pos[1] + y, this.size[0], LiteGraph.NODE_TITLE_HEIGHT) && can_interact;
        // let overleft = LiteGraph.isInsideRectangle(pos[0], pos[1], this.pos[0], this.pos[1] + y, this.size[0] / 2, LiteGraph.NODE_TITLE_HEIGHT)
        // ctx.fillStyle = over ? "#555" : "#222";
        // ctx.beginPath();
        // if (this.shape == BuiltInSlotShape.BOX_SHAPE) {
        //     if (overleft) {
        //         ctx.rect(0, y, this.size[0] / 2 + 1, LiteGraph.NODE_TITLE_HEIGHT);
        //     } else {
        //         ctx.rect(this.size[0] / 2, y, this.size[0] / 2 + 1, LiteGraph.NODE_TITLE_HEIGHT);
        //     }
        // }
        // else {
        //     if (overleft) {
        //         ctx.roundRect(0, y, this.size[0] / 2 + 1, LiteGraph.NODE_TITLE_HEIGHT, [0, 0, 8, 8]);
        //     } else {
        //         ctx.roundRect(this.size[0] / 2, y, this.size[0] / 2 + 1, LiteGraph.NODE_TITLE_HEIGHT, [0, 0, 8, 8]);
        //     }
        // }
        // if (over) {
        //     ctx.fill();
        // } else {
        //     ctx.fillRect(0, y, this.size[0] + 1, LiteGraph.NODE_TITLE_HEIGHT);
        // }

        // button
        // ctx.textAlign = "center";
        // ctx.font = "24px Arial";
        // ctx.fillStyle = over ? "#DDD" : "#999";
        // ctx.fillText("+", this.size[0] * 0.25, y + 24);
        // ctx.fillText("+", this.size[0] * 0.75, y + 24);
    }

    // override onMouseDown(e, localpos, graphcanvas)
    // {
    // 	var y = this.size[1] - LiteGraph.NODE_TITLE_HEIGHT + 0.5;
    // 	if(localpos[1] > y)
    // 	{
    // 		graphcanvas.showSubgraphPropertiesDialog(this);
    // 	}
    // }

    // override onMouseDown(e: MouseEventExt, localpos: Vector2, graphcanvas: LGraphCanvas): boolean | undefined {
    //     var y = this.size[1] - LiteGraph.NODE_TITLE_HEIGHT + 0.5;
    //     console.log(0)
    //     if (localpos[1] > y) {
    //         if (localpos[0] < this.size[0] / 2) {
    //             console.log(1)
    //             graphcanvas.showSubgraphPropertiesDialog(this);
    //         } else {
    //             console.log(2)
    //             graphcanvas.showSubgraphPropertiesDialogRight(this);
    //         }
    //     }
    //     return false;
    // }

    override computeSize(): Vector2 {
        var num_inputs = this.inputs ? this.inputs.length : 0;
        var num_outputs = this.outputs ? this.outputs.length : 0;
        return [200, Math.max(num_inputs, num_outputs) * LiteGraph.NODE_SLOT_HEIGHT + LiteGraph.NODE_SLOT_HEIGHT * 0.5];
    }

    //**** INPUTS ***********************************
    private onSubgraphTrigger(event: string, param: string) {
        // var slot = this.findOutputSlotIndexByName(event);
        // if (slot != -1) {
        //     this.triggerSlot(slot);
        // }
    };

    private onSubgraphNodeAdded(node: LGraphNode, options: LGraphAddNodeOptions) {
        // console.debug("onSubgraphNodeAdded", node.id, options.subgraphs?.length)
        if (this.graph?.onNodeAdded) {
            options.subgraphs ||= []
            options.subgraphs.push(this)
            this.graph?.onNodeAdded(node, options)
        }
    };

    private onSubgraphNodeRemoved(node: LGraphNode, options: LGraphRemoveNodeOptions) {
        // console.debug("onSubgraphNodeRemoved", node.id, options.subgraphs?.length)
        if (this.graph?.onNodeRemoved) {
            options.subgraphs ||= []
            options.subgraphs.push(this)
            this.graph?.onNodeRemoved(node, options)
        }
    };

    private onSubgraphNewInput(name: string, type: string) {
        // console.warn("onSubgraphNewInput", name, type)
        var slot = this.findInputSlotIndexByName(name);
        if (slot == -1) {
            //add input to the node
            this.addInput(name, type);
        }
    };

    private onSubgraphRenamedInput(oldname: string, name: string) {
        var slot = this.findInputSlotIndexByName(oldname);
        if (slot == -1) {
            return;
        }
        var info = this.getInputInfo(slot);
        info.name = name;
    };

    private onSubgraphTypeChangeInput(name: string, oldType: string, type: string) {
        var slot = this.findInputSlotIndexByName(name);
        if (slot == -1) {
            return;
        }
        var info = this.getInputInfo(slot);
        // console.warn("CHANGEINPUT!", info.type, oldType, "=>", type)
        info.type = type;
    };

    private onSubgraphRemovedInput(name: string) {
        var slot = this.findInputSlotIndexByName(name);
        if (slot == -1) {
            return;
        }
        this.removeInput(slot);
    };

    //**** OUTPUTS ***********************************
    private onSubgraphNewOutput(name: string, type: string) {
        // console.warn("onSubgraphNewOutput", name, type)
        var slot = this.findOutputSlotIndexByName(name);
        if (slot == -1) {
            this.addOutput(name, type);
        }
    };

    private onSubgraphRenamedOutput(oldname: string, name: string) {
        var slot = this.findOutputSlotIndexByName(oldname);
        if (slot == -1) {
            return;
        }
        var info = this.getOutputInfo(slot);
        info.name = name;
    };

    private onSubgraphTypeChangeOutput(name: string, oldType: string, type: string) {
        var slot = this.findOutputSlotIndexByName(name);
        if (slot == -1) {
            return;
        }
        var info = this.getOutputInfo(slot);
        // console.warn("CHANGEOUTPUT!", info.type, oldType, "=>", type)
        info.type = type;
    };

    private onSubgraphRemovedOutput(name: string) {
        var slot = this.findOutputSlotIndexByName(name);
        if (slot == -1) {
            return;
        }
        this.removeOutput(slot);
    };
    // *****************************************************

    override getExtraMenuOptions(graphCanvas: LGraphCanvas, options: ContextMenuItem[]): ContextMenuItem[] {
        var that = this;
        return [
            {
                content: "Open",
                callback: function() {
                    graphCanvas.openSubgraph(that.subgraph);
                }
            }
        ];
    };

    override onResize(size: Vector2) {
        console.error("TEST subgraph resize");
        // size[1] += 20;
    };

    override serialize<T extends SerializedLGraphNode>(): T {
        var data = LGraphNode.prototype.serialize.call(this);
        data.subgraph = this.subgraph.serialize();
        return data;
    };
    //no need to define node.configure, the default method detects node.subgraph and passes the object to node.subgraph.configure()

    override onConfigure(o: SerializedLGraphNode) {
        if (super.onConfigure)
            super.onConfigure(o);
        this.subgraph._is_subgraph = true
        this.subgraph._subgraph_node = this;

        for (const node of this.subgraph.iterateNodesInOrder()) {
            if (node.is(GraphInput) || node.is(GraphOutput))
                node.properties.subgraphID = this.id;
        }
    }

    override onReassignID() {
        for (const node of this.subgraph.iterateNodesInOrder()) {
            if (node.is(GraphInput) || node.is(GraphOutput))
                node.properties.subgraphID = this.id;
        }
    }

    override clone(cloneData: LGraphNodeCloneData = { forNode: {} }) {
        var node = LiteGraph.createNode(this.type);
        var data = this.serialize();

        let mapping: GraphIDMapping | null = null
        if (LiteGraph.use_uuids) {
            // LGraph.serialize() seems to reuse objects in the original graph. But we
            // need to change node IDs here, so clone it first.
            const subgraph = LiteGraph.cloneObject((data as any).subgraph)
            mapping = reassignGraphIDs(subgraph);
            (data as any).subgraph = subgraph;
        }

        delete data["id"];
        delete data["inputs"];
        delete data["outputs"];
        node.configure(data);

        // At this point the subgraph is instantiated, so notify child nodes of
        // their new IDs.
        if (LiteGraph.use_uuids)
            notifyReassignedIDs(node.subgraph, mapping);

        cloneData.forNode[this.id] ||= {}
        cloneData.forNode[this.id].subgraphNewIDMapping = mapping
        cloneData.forNode[node.id] ||= {}
        cloneData.forNode[node.id].subgraphNewIDMapping = mapping

        return node;
    };

    buildFromNodes(nodes: LGraphNode[]) {
        nodes = nodes.filter(n => !n.is(GraphInput) && !n.is(GraphOutput))
        if (nodes.length === 0)
            return;

        // { linkID => [link, connectionPos, slotName] }
        const linksIn: Record<LinkID, [LLink, Vector2, string]> = {}
        const linksOut: Record<LinkID, [LLink, Vector2, string]> = {}

        // Links internal to the subgraph
        // { linkID => [link, connectionPos] }
        const innerLinks: Record<LinkID, [LLink, Vector2]> = {}

        const containedNodes = nodes.reduce((result, node) => { result[node.id] = node; return result }, {})

        let min_x = Number.MAX_SAFE_INTEGER;
        let max_x = 0;
        let min_y = Number.MAX_SAFE_INTEGER;
        let max_y = 0;

        for (const node of Object.values(nodes)) {
            min_x = Math.min(node.pos[0], min_x);
            max_x = Math.max(node.pos[0] + node.size[0], max_x);
            min_y = Math.min(node.pos[1], min_y);
            max_y = Math.max(node.pos[1] + node.size[1], max_y);
        }

        const nodeIdToNewNode: Record<NodeID, LGraphNode> = {}

        // detect inputs and outputs
        for (const node of nodes) {
            nodeIdToNewNode[node.id] = node;

            for (let index = 0; index < node.inputs.length; index++) {
                const link = node.getInputLink(index)

                if (link) {
                    const pos = node.getConnectionPos(true, index);
                    const input = node.getInputInfo(index);
                    const inputNode = node.getInputNode(index);

                    if (inputNode)
                        nodeIdToNewNode[inputNode.id] = inputNode;

                    const isSelected = containedNodes[link.origin_id] != null;
                    if (isSelected) {
                        innerLinks[link.id] = [link, pos];
                    }
                    else {
                        linksIn[link.id] = [link, pos, input.name];
                    }
                }
            }

            for (let index = 0; index < node.outputs.length; index++) {
                const links = node.getOutputLinks(index)

                for (const link of links) {
                    const pos = node.getConnectionPos(false, index);
                    const output = node.getOutputInfo(index);
                    const outputNode = node.graph.getNodeById(link.target_id)

                    if (outputNode)
                        nodeIdToNewNode[outputNode.id] = outputNode;

                    const isSelected = containedNodes[link.target_id] != null;
                    if (isSelected) {
                        innerLinks[link.id] = [link, pos];
                    }
                    else {
                        linksOut[link.id] = [link, pos, output.name];
                    }
                }
            }
        }

        // Sort links in order from highest to lowest
        const sortedLinksIn = Object.values(linksIn);
        const sortedLinksOut = Object.values(linksOut);
        sortedLinksIn.sort((a, b) => a[1][1] - b[1][1])
        sortedLinksOut.sort((a, b) => a[1][1] - b[1][1])

        if (LiteGraph.debug) {
            console.debug("NODES", Object.keys(nodes))
            console.debug("IN", Object.keys(linksIn))
            console.debug("OUT", Object.keys(linksOut))
            console.debug("INNER", Object.keys(innerLinks))
        }

        // { nodeId => { slotId => outputSlotOnSubgraphNode } }
        const inputSlotsCreated: Record<number, Record<number, SubgraphInputPair>> = {}
        const outputSlotsCreated: Record<number, Record<number, SubgraphOutputPair>> = {}

        // Add nodes into the subgraph
        for (const node of nodes) {
            const newPos: Vector2 = [node.pos[0] - min_x, node.pos[1] - min_y]
            const prevNodeID = node.id;
            node.graph.remove(node, { removedBy: "moveIntoSubgraph" })
            this.subgraph.add(node, { addedBy: "moveIntoSubgraph", prevNodeID });
            node.pos = newPos
            nodeIdToNewNode[prevNodeID] = node;
            nodeIdToNewNode[node.id] = node;
        }

        let i = 0;
        let inputNodeY = 0
        let outputNodeY = 0

        // Reconnect links from outside the subgraph -> inside
        for (const [linkIn, _pos, inputName] of sortedLinksIn) {
            let pair = null;
            if (inputSlotsCreated[linkIn.origin_id])
                pair = inputSlotsCreated[linkIn.origin_id][linkIn.origin_slot]
            if (!pair) {
                pair = this.addGraphInput(inputName, linkIn.type, [-200, inputNodeY])
                inputNodeY += pair.innerNode.size[1] + LiteGraph.NODE_SLOT_HEIGHT
                if (!pair) {
                    console.error("Failed creating subgraph output pair!", linkIn);
                    continue
                }
            }

            const fromNode = nodeIdToNewNode[linkIn.origin_id]
            const toNode = nodeIdToNewNode[linkIn.target_id]

            // console.warn("CONNECT", fromNode, linkIn.origin_slot, this, pair.outerInputIndex)

            fromNode.connect(linkIn.origin_slot, this, pair.outerInputIndex)
            pair.innerNode.connect(0, toNode, linkIn.target_slot)

            inputSlotsCreated[linkIn.origin_id] ||= {}
            inputSlotsCreated[linkIn.origin_id][linkIn.origin_slot] = pair
        }

        i = 0;

        // Reconnect links from inside the subgraph -> outside
        for (const [linkOut, _pos, outputName] of sortedLinksOut) {
            let pair = null;
            if (outputSlotsCreated[linkOut.target_id])
                pair = outputSlotsCreated[linkOut.target_id][linkOut.target_slot]
            if (!pair) {
                pair = this.addGraphOutput(outputName, linkOut.type, [max_x - min_x + 200, outputNodeY])
                outputNodeY += pair.innerNode.size[1] + LiteGraph.NODE_SLOT_HEIGHT
                if (!pair) {
                    console.error("Failed creating subgraph output pair!", linkOut);
                    continue
                }
            }

            const fromNode = nodeIdToNewNode[linkOut.origin_id]
            const toNode = nodeIdToNewNode[linkOut.target_id]

            fromNode.connect(linkOut.origin_slot, pair.innerNode, 0)
            this.connect(pair.outerOutputIndex, toNode, linkOut.target_slot)

            outputSlotsCreated[linkOut.target_id] ||= {}
            outputSlotsCreated[linkOut.target_id][linkOut.origin_slot] = pair
        }

        // Reconnect internal links
        for (const [innerLink, _pos] of Object.values(innerLinks)) {
            const fromNode = nodeIdToNewNode[innerLink.origin_id]
            const toNode = nodeIdToNewNode[innerLink.target_id]

            fromNode.connect(innerLink.origin_slot, toNode, innerLink.target_slot)
        }
    }

    addGraphInput(name: string, type: SlotType, pos?: Vector2): SubgraphInputPair | null {
        name = this.getValidGraphInputName(name)

        const innerNode = LiteGraph.createNode(GraphInput);
        if (innerNode == null)
            return null;

        let outerType = type;
        if (type === BuiltInSlotType.EVENT)
            outerType = BuiltInSlotType.ACTION
        else if (type === BuiltInSlotType.ACTION)
            type = BuiltInSlotType.EVENT;

        console.warn("[Subgraph] addGraphInput", name, type, outerType, pos)

        // These will run onPropertyChanged.
        innerNode.setProperty("name", name)
        innerNode.setProperty("type", type)

        innerNode.properties.subgraphID = this.id

        this.subgraph.add(innerNode);
        const nodeSize = innerNode.computeSize();
        if (pos)
            innerNode.pos = [pos[0] - nodeSize[0] * 0.5, pos[1] - nodeSize[1] * 0.5];

        // The following call will add an input slot to this node automatically from onSubgraphNewInput.
        this.subgraph.addInput(name, outerType, null);

        const outerInputIndex = this.inputs.length - 1;
        const outerInput = this.inputs[outerInputIndex]

        return { innerNode, outerInput, outerInputIndex }
    }

    addGraphOutput(name: string, type: SlotType, pos?: Vector2): SubgraphOutputPair | null {
        name = this.getValidGraphOutputName(name)

        const innerNode = LiteGraph.createNode(GraphOutput);
        if (innerNode == null)
            return null;

        let outerType = type;
        if (type === BuiltInSlotType.EVENT)
            type = BuiltInSlotType.ACTION
        else if (type === BuiltInSlotType.ACTION)
            outerType = BuiltInSlotType.EVENT;

        console.warn("[Subgraph] addGraphOutput", name, type, outerType, pos)

        // These will run onPropertyChanged.
        innerNode.setProperty("name", name)
        innerNode.setProperty("type", type)

        innerNode.properties.subgraphID = this.id

        this.subgraph.add(innerNode);
        const nodeSize = innerNode.computeSize();
        if (pos)
            innerNode.pos = [pos[0], pos[1] - nodeSize[1] * 0.5];

        // The following call will add an output slot to this node automatically from onSubgraphNewOutput.
        this.subgraph.addOutput(name, outerType, null);

        const outerOutputIndex = this.outputs.length - 1;
        const outerOutput = this.outputs[outerOutputIndex]

        return { innerNode, outerOutput, outerOutputIndex }
    }

    removeGraphInput(inputName: string) {
        const inputSlot = this.findInputSlotIndexByName(inputName);
        if (inputSlot == null) {
            console.error("[Subgraph] No input in slot!", inputName)
            return;
        }

        const innerNodes = this.subgraph.findNodesByClass(GraphInput).filter(n => n.properties.name === inputName);

        if (innerNodes.length > 0) {
            // Removing the nodes will also trigger removeInput from subgraph hooks
            for (const node of innerNodes) {
                this.subgraph.remove(node);
            }
        }
        else {
            console.warn("[Subgraph] No GraphInputs found on input removal", inputName)

            // remove the input ourselves since no subgraph hook was triggered
            const index = this.findInputSlotIndexByName(inputName)
            if (index !== -1)
                this.removeInput(index);
        }
    }

    removeGraphOutput(outputName: string) {
        const outputSlot = this.findOutputSlotIndexByName(outputName);
        if (outputSlot == null) {
            console.error("[Subgraph] No output in slot!", outputName)
            return;
        }

        const innerNodes = this.subgraph.findNodesByClass(GraphOutput).filter(n => n.properties.name === outputName);

        if (innerNodes.length > 0) {
            // Removing the nodes will also trigger removeOutput from subgraph hooks
            for (const node of innerNodes) {
                this.subgraph.remove(node);
            }
        }
        else {
            console.warn("[Subgraph] No GraphOutputs found on output removal", outputName)

            // remove the output ourselves since no subgraph hook was triggered
            const index = this.findOutputSlotIndexByName(outputName)
            if (index !== -1)
                this.removeOutput(index);
        }
    }

    getValidGraphInputName(baseName: string): string {
        baseName ||= "newInput"
        let name = baseName
        let existing = this.getInnerGraphInput(name)
        let i = 1;
        while (existing != null) {
            name = `${baseName}_${i++}`
            existing = this.getInnerGraphInput(name)
        }
        return name;
    }

    getValidGraphOutputName(baseName: string): string {
        baseName ||= "newOutput"
        let name = baseName
        let existing = this.getInnerGraphOutput(name)
        let i = 1;
        while (existing != null) {
            name = `${baseName}_${i++}`
            existing = this.getInnerGraphOutput(name)
        }
        return name;
    }

    getInnerGraphOutput(outerOutputName: string): GraphOutput | null {
        const graphOutput = this.subgraph._nodes.find(n => {
            return n.is(GraphOutput)
                && n.properties.name === outerOutputName
        }) as GraphOutput

        return graphOutput || null;
    }

    getInnerGraphInput(outerInputName: string): GraphInput | null {
        const graphInput = this.subgraph._nodes.find(n => {
            return n.is(GraphInput)
                && n.properties.name === outerInputName
        }) as GraphInput

        return graphInput || null;
    }

    getInnerGraphOutputByIndex(outerOutputIndex: number): GraphOutput | null {
        const outputSlot = this.getOutputInfo(outerOutputIndex)
        if (!outputSlot)
            return null;
        return this.getInnerGraphOutput(outputSlot.name);
    }

    getInnerGraphInputByIndex(outerInputIndex: number): GraphInput | null {
        const inputSlot = this.getInputInfo(outerInputIndex)
        if (!inputSlot)
            return null;
        return this.getInnerGraphInput(inputSlot.name);
    }

    moveNodesToParentGraph(nodes: LGraphNode[]): Record<NodeID, LGraphNode> {
        nodes = nodes.filter(n => !n.is(GraphInput) && !n.is(GraphOutput))
        if (nodes.length === 0)
            return;

        const subgraphNode = this;
        const parentGraph = subgraphNode.graph;

        let min_x = Number.MAX_SAFE_INTEGER;
        let max_x = 0;
        let min_y = Number.MAX_SAFE_INTEGER;
        let max_y = 0;

        for (const node of Object.values(nodes)) {
            min_x = Math.min(node.pos[0], min_x);
            max_x = Math.max(node.pos[0] + node.size[0], max_x);
            min_y = Math.min(node.pos[1], min_y);
            max_y = Math.max(node.pos[1] + node.size[1], max_y);
        }

        const width = max_x - min_x
        const height = max_y - min_y

        const place_x = (subgraphNode.pos[0] + subgraphNode.size[0] / 2) - (width / 2)
        const place_y = (subgraphNode.pos[1] + subgraphNode.size[1] / 2) - (height / 2)

        const innerLinks: Record<LinkID, [LLink, Vector2]> = {}

        const nodeIdToNode: Record<NodeID, LGraphNode> = {}
        for (const [index, node] of nodes.entries()) {
            nodeIdToNode[node.id] = node;
        }

        for (const node of nodes) {
            for (const link of node.iterateAllLinks()) {
                const isInputLink = link.target_id === node.id;
                const pos = node.getConnectionPos(isInputLink, isInputLink ? link.target_slot : link.origin_slot);
                if (nodeIdToNode[link.origin_id] != null && nodeIdToNode[link.target_id] != null) {
                    innerLinks[link.id] = [link, pos];
                }
            }
        }

        const prevNodeIDtoNewNode = {}

        for (const [index, node] of nodes.entries()) {
            const newPos: Vector2 = [node.pos[0] - min_x + place_x, node.pos[1] - min_y + place_y]
            const prevNodeID = node.id;
            node.graph.remove(node, { removedBy: "moveOutOfSubgraph" })
            parentGraph.add(node, { addedBy: "moveOutOfSubgraph", prevNodeID });
            node.pos = newPos
            prevNodeIDtoNewNode[prevNodeID] = node
        }

        for (const [link, pos] of Object.values(innerLinks)) {
            const originNode = nodeIdToNode[link.origin_id]
            const targetNode = nodeIdToNode[link.target_id]
            originNode.connect(link.origin_slot, targetNode, link.target_slot)
        }

        return prevNodeIDtoNewNode;
    }

    convertNodesToSubgraphInputs(nodes: LGraphNode[]) {
        nodes = nodes.filter(n => !n.is(GraphInput) && !n.is(GraphOutput))
        if (nodes.length === 0)
            return;

        const containedIds = toHashMap(nodes, (node) => node.id);
        const parentIntoSubgraphLinks: LLink[] = [];
        const prevPositions: Record<NodeID, [Vector2, Vector2]> = {} // pos, slot pos

        const innerGraph = this.subgraph;

        for (const node of nodes) {
            for (const link of node.iterateAllLinks()) {
                // The selected nodes shouldn't have any origin links leading
                // out of the selection
                if (containedIds[link.origin_id] == null) {
                    throw new Error("Can't convert to input with an origin link outward")
                }
                else if (containedIds[link.target_id] == null) {
                    parentIntoSubgraphLinks.push(link);
                    const connPos: Vector2 = [0, 0]
                    node.getConnectionPos(false, link.target_slot, connPos)
                    prevPositions[node.id] = [[node.pos[0], node.pos[1]], connPos]
                }
            }
        }

        const oldIdsToNodes = this.moveNodesToParentGraph(nodes);

        const innerNodeSlotToGraphInput: Record<NodeID, Record<number, SubgraphInputPair>> = {}

        for (const link of parentIntoSubgraphLinks) {
            const innerNode = innerGraph.getNodeById(link.target_id);
            const innerInput = innerNode.getInputInfo(link.target_slot)

            innerNodeSlotToGraphInput[link.origin_id] ||= {}
            let pair = innerNodeSlotToGraphInput[link.origin_id][link.origin_slot]
            if (pair == null) {
                const name = this.getValidGraphInputName(innerInput.name)
                pair = this.addGraphInput(name, innerInput.type)
                innerNodeSlotToGraphInput[link.origin_id][link.origin_slot] = pair

                // Align graph input's slot over previous slot position
                const [pos, connPos] = prevPositions[link.origin_id];
                const newPos = pair.innerNode.pos;
                const newSize = pair.innerNode.computeSize();
                const newConnPos = pair.innerNode.getConnectionPos(true, 0);
                const offset = [pair.innerNode.pos[0] - newConnPos[0], pair.innerNode.pos[1] - newConnPos[1]]
                const placePos: Vector2 = [connPos[0] + offset[0] - newSize[0], connPos[1] + offset[1]]
                console.warn("newPos", newPos, "size", pair.innerNode.size, "connPos", connPos, "newConPos", newConnPos, "offset", offset);
                pair.innerNode.pos = placePos;
            }

            const outerNode = oldIdsToNodes[link.origin_id];
            outerNode.connect(link.origin_slot, this, pair.outerInputIndex)
            pair.innerNode.connect(0, innerNode, link.target_slot)
        }
    }

    convertNodesToSubgraphOutputs(nodes: LGraphNode[]) {
        nodes = nodes.filter(n => !n.is(GraphInput) && !n.is(GraphOutput))
        if (nodes.length === 0)
            return;

        const containedIds = toHashMap(nodes, (node) => node.id);
        const parentIntoSubgraphLinks: LLink[] = [];
        const prevPositions: Record<NodeID, [Vector2, Vector2]> = {} // pos, slot pos

        const innerGraph = this.subgraph;

        for (const node of nodes) {
            for (const link of node.iterateAllLinks()) {
                if (containedIds[link.origin_id] == null) {
                    parentIntoSubgraphLinks.push(link);
                    const connPos: Vector2 = [0, 0]
                    node.getConnectionPos(true, link.origin_slot, connPos)
                    prevPositions[node.id] = [[node.pos[0], node.pos[1]], connPos]
                }
                else if (containedIds[link.target_id] == null) {
                    throw new Error("Can't convert to input with an origin link outward")
                }
            }
        }

        const oldIdsToNodes = this.moveNodesToParentGraph(nodes);

        const innerNodeSlotToGraphOutput: Record<NodeID, Record<number, SubgraphOutputPair>> = {}

        for (const link of parentIntoSubgraphLinks) {
            const innerNode = innerGraph.getNodeById(link.origin_id);
            const innerOutput = innerNode.getOutputInfo(link.origin_slot)

            innerNodeSlotToGraphOutput[link.target_id] ||= {}
            let pair = innerNodeSlotToGraphOutput[link.target_id][link.target_slot]
            if (pair == null) {
                pair = this.addGraphOutput(name, innerOutput.type)
                innerNodeSlotToGraphOutput[link.target_id][link.target_slot] = pair

                // Align graph output's slot over previous slot position
                const [pos, connPos] = prevPositions[link.target_id];
                const newConnPos = pair.innerNode.getConnectionPos(true, 0);
                const offset = [pair.innerNode.pos[0] - newConnPos[0], pair.innerNode.pos[1] - newConnPos[1]]
                const placePos: Vector2 = [connPos[0] + offset[0], connPos[1] + offset[1]]
                pair.innerNode.pos = placePos;
            }

            const outerNode = oldIdsToNodes[link.target_id];
            innerNode.connect(link.origin_slot, pair.innerNode, 0)
            this.connect(pair.outerOutputIndex, outerNode, link.target_slot)
        }
    }
}

LiteGraph.registerNodeType({
    class: Subgraph,
    title: "Subgraph",
    desc: "Graph inside a node",
    title_color: "#334",
    type: "graph/subgraph"
})

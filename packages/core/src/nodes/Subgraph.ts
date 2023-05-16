import type { ContextMenuItem } from "../ContextMenu";
import type { MouseEventExt } from "../DragAndScale";
import { INodeInputSlot, INodeOutputSlot } from "../INodeSlot";
import LGraph, { LGraphAddNodeOptions, LGraphRemoveNodeOptions } from "../LGraph";
import type LGraphCanvas from "../LGraphCanvas";
import type { OptionalSlots, PropertyLayout, SerializedLGraphNode, SlotLayout } from "../LGraphNode";
import LGraphNode from "../LGraphNode";
import LLink from "../LLink";
import LiteGraph from "../LiteGraph";
import { BuiltInSlotShape, SlotType, type NodeMode, type Vector2, LinkID, NodeID } from "../types";
import { UUID } from "../types";
import GraphInput from "./GraphInput";
import GraphOutput from "./GraphOutput";

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

    getRootGraph(): LGraph | null {
        const graphs = Array.from(this.iterateParentGraphs());
        const graph = graphs[graphs.length - 1]
        console.warn(graph._is_subgraph)
        if (graph._is_subgraph)
            return null;
        return graph;
    }

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

    override onAction(action: any, param: any) {
        this.subgraph.onAction(action, param);
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
        return [200, Math.max(num_inputs, num_outputs) * LiteGraph.NODE_SLOT_HEIGHT + LiteGraph.NODE_TITLE_HEIGHT];
    }

    //**** INPUTS ***********************************
    private onSubgraphTrigger(event: string, param: string) {
        var slot = this.findOutputSlotIndexByName(event);
        if (slot != -1) {
            this.triggerSlot(slot);
        }
    };

    private onSubgraphNodeAdded(node: LGraphNode, options: LGraphAddNodeOptions) {
        console.debug("onSubgraphNodeAdded", node.id, options.subgraphs?.length)
        if (this.graph?.onNodeAdded) {
            options.subgraphs ||= []
            options.subgraphs.push(this)
            this.graph?.onNodeAdded(node, options)
        }
    };

    private onSubgraphNodeRemoved(node: LGraphNode, options: LGraphRemoveNodeOptions) {
        console.debug("onSubgraphNodeRemoved", node.id, options.subgraphs?.length)
        if (this.graph?.onNodeRemoved) {
            options.subgraphs ||= []
            options.subgraphs.push(this)
            this.graph?.onNodeRemoved(node, options)
        }
    };

    private onSubgraphNewInput(name: string, type: string) {
        console.warn("onSubgraphNewInput", name, type)
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
        console.warn("CHANGEINPUT!", info.type, oldType, "=>", type)
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
        console.warn("onSubgraphNewOutput", name, type)
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
        console.warn("CHANGEOUTPUT!", info.type, oldType, "=>", type)
        info.type = type;
    };

    private onSubgraphRemovedOutput(name: string) {
        var slot = this.findInputSlotIndexByName(name);
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
        size[1] += 20;
    };

    override serialize() {
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

    override clone() {
        var node = LiteGraph.createNode(this.type);
        var data = this.serialize();
        delete data["id"];
        delete data["inputs"];
        delete data["outputs"];
        node.configure(data);
        return node;
    };

    buildFromNodes(nodes: LGraphNode[]) {
        // Nodes that connect data between parent graph and subgraph
        // Since the nodes will reparented to a new graph causing the node ID
        // to be changed, we can't rely on node IDs to reference the reinserted
        // nodes. So the new nodes are referred to by index into the nodes array instead
        // { linkID => [fromIndex, toIndex, connectionPos] }
        const linksIn: Record<LinkID, [LLink, number, number, Vector2]> = {}
        const linksOut: Record<LinkID, [LLink, number, number, Vector2]> = {}

        // Links internal to the subgraph
        // { linkID => [LLink, fromIndex, toIndex, connectionPos] }
        const innerLinks: Record<LinkID, [LLink, number, number, Vector2]> = {}

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

        const indexToNode: Record<number, LGraphNode> = {}
        const nodeIdToIndex: Record<NodeID, number> = {}
        for (const [index, node] of nodes.entries()) {
            indexToNode[index] = node;
            nodeIdToIndex[node.id] = index;
        }

        let nextIndex = nodes.length;

        // detect inputs and outputs
        for (const node of nodes) {
            for (let index = 0; index < node.inputs.length; index++) {
                const link = node.getInputLink(index)

                if (link) {
                    const pos = node.getConnectionPos(true, index);

                    let indexFrom = nodeIdToIndex[link.origin_id]
                    if (indexFrom == null) {
                        // Found a node outside the selected nodes
                        indexFrom = nextIndex;
                        nextIndex += 1;
                        nodeIdToIndex[link.origin_id] = indexFrom
                        indexToNode[indexFrom] = node.graph.getNodeById(link.origin_id)
                    }

                    let indexTo = nodeIdToIndex[link.target_id]
                    if (indexTo == null) {
                        indexTo = nextIndex;
                        nextIndex += 1;
                        nodeIdToIndex[link.target_id] = indexTo
                        indexToNode[indexTo] = node.graph.getNodeById(link.target_id)
                    }

                    console.warn("S", link.origin_id, containedNodes[link.origin_id])
                    const isSelected = containedNodes[link.origin_id] != null;
                    if (isSelected) {
                        innerLinks[link.id] = [link, indexFrom, indexTo, pos];
                    }
                    else {
                        linksIn[link.id] = [link, indexFrom, indexTo, pos];
                    }
                }
            }

            for (let index = 0; index < node.outputs.length; index++) {
                const links = node.getOutputLinks(index)

                for (const link of links) {
                    const pos = node.getConnectionPos(false, index);
                    let indexFrom = nodeIdToIndex[link.origin_id]
                    if (indexFrom == null) {
                        // Found a node outside the selected nodes
                        indexFrom = nextIndex;
                        nextIndex += 1;
                        nodeIdToIndex[link.origin_id] = indexFrom
                        indexToNode[indexFrom] = node.graph.getNodeById(link.origin_id)
                    }

                    let indexTo = nodeIdToIndex[link.target_id]
                    if (indexTo == null) {
                        indexTo = nextIndex;
                        nextIndex += 1;
                        nodeIdToIndex[link.target_id] = indexTo
                        indexToNode[indexTo] = node.graph.getNodeById(link.target_id)
                    }

                    const isSelected = containedNodes[link.target_id] != null;
                    if (isSelected) {
                        innerLinks[link.id] = [link, indexFrom, indexTo, pos];
                    }
                    else {
                        linksOut[link.id] = [link, indexFrom, indexTo, pos];
                    }
                }
            }
        }

        // Sort links in order from highest to lowest
        const sortedLinksIn = Object.values(linksIn);
        const sortedLinksOut = Object.values(linksOut);
        sortedLinksIn.sort((a, b) => a[3][1] - b[3][1])
        sortedLinksOut.sort((a, b) => a[3][1] - b[3][1])

        if (LiteGraph.debug) {
            console.debug("NODES", Object.keys(nodes))
            console.debug("IN", Object.keys(linksIn))
            console.debug("OUT", Object.keys(linksOut))
            console.debug("INNER", Object.keys(innerLinks))
        }

        // { nodeId => { slotId => outputSlotOnSubgraphNode } }
        const inputSlotsCreated: Record<number, Record<number, SubgraphInputPair>> = {}
        // { slotId => outputSlotOnSubgraphNode }
        const outputSlotsCreated: Record<number, SubgraphOutputPair> = {}

        // Add nodes into the subgraph
        for (const [index, node] of nodes.entries()) {
            const newPos: Vector2 = [node.pos[0] - min_x, node.pos[1] - min_y]
            const prevNodeId = node.id;
            node.graph.remove(node, { removedBy: "moveIntoSubgraph" })
            this.subgraph.add(node, { addedBy: "moveIntoSubgraph", prevNodeId });
            node.pos = newPos
        }

        let i = 0;
        let inputNodeY = 0
        let outputNodeY = 0

        // Reconnect links from outside the subgraph -> inside
        for (const [linkIn, fromIndex, toIndex, _pos] of sortedLinksIn) {
            let pair = null;
            if (inputSlotsCreated[linkIn.origin_id])
                pair = inputSlotsCreated[linkIn.origin_id][linkIn.origin_slot]
            if (!pair) {
                pair = this.addGraphInput(`${i++}`, linkIn.type, [-200, inputNodeY])
                inputNodeY += pair.innerNode.size[1] + LiteGraph.NODE_SLOT_HEIGHT
                if (!pair) {
                    console.error("Failed creating subgraph output pair!", linkIn);
                    continue
                }
            }

            const fromNode = indexToNode[fromIndex]
            const toNode = indexToNode[toIndex]

            console.warn("CONNECT", fromNode, linkIn.origin_slot, this, pair.outerInputIndex)

            fromNode.connect(linkIn.origin_slot, this, pair.outerInputIndex)
            pair.innerNode.connect(0, toNode, linkIn.target_slot)

            inputSlotsCreated[linkIn.origin_id] ||= {}
            inputSlotsCreated[linkIn.origin_id][linkIn.origin_slot] = pair
        }

        i = 0;

        // Reconnect links from inside the subgraph -> outside
        for (const [linkOut, fromIndex, toIndex, _pos] of sortedLinksOut) {
            let pair = outputSlotsCreated[linkOut.target_slot];
            if (!pair) {
                pair = this.addGraphOutput(`${i++}`, linkOut.type, [max_x - min_x, outputNodeY])
                outputNodeY += pair.innerNode.size[1] + LiteGraph.NODE_SLOT_HEIGHT
                if (!pair) {
                    console.error("Failed creating subgraph output pair!", linkOut);
                    continue
                }
            }

            const fromNode = indexToNode[fromIndex]
            const toNode = indexToNode[toIndex]

            fromNode.connect(linkOut.origin_slot, pair.innerNode, 0)
            this.connect(pair.outerOutputIndex, toNode, linkOut.target_slot)

            outputSlotsCreated[linkOut.target_slot] = pair
        }

        // Reconnect internal links
        for (const [innerLink, fromIndex, toIndex, _pos] of Object.values(innerLinks)) {
            const fromNode = indexToNode[fromIndex]
            const toNode = indexToNode[toIndex]

            fromNode.connect(innerLink.origin_slot, toNode, innerLink.target_slot)
        }
    }

    addGraphInput(name: string, type: SlotType, pos?: Vector2): SubgraphInputPair | null {
        const innerNode = LiteGraph.createNode(GraphInput);
        if (innerNode == null)
            return null;

        console.warn("[Subgraph] addGraphInput", name, type, pos)

        // These will run onPropertyChanged.
        innerNode.setProperty("name", name)
        innerNode.setProperty("type", type)

        innerNode.properties.subgraphID = this.id

        this.subgraph.add(innerNode);
        const nodeSize = innerNode.computeSize();
        if (pos)
            innerNode.pos = [pos[0] - nodeSize[0] * 0.5, pos[1] - nodeSize[1] * 0.5];

        // The following call will add an input slot to this node automatically from onSubgraphNewInput.
        this.subgraph.addInput(name, "" + type, null);

        const outerInputIndex = this.inputs.length - 1;
        const outerInput = this.inputs[outerInputIndex]

        return { innerNode, outerInput, outerInputIndex }
    }

    addGraphOutput(name: string, type: SlotType, pos?: Vector2): SubgraphOutputPair | null {
        const innerNode = LiteGraph.createNode(GraphOutput);
        if (innerNode == null)
            return null;

        console.warn("[Subgraph] addGraphOutput", name, type, pos)

        // These will run onPropertyChanged.
        innerNode.setProperty("name", name)
        innerNode.setProperty("type", type)

        innerNode.properties.subgraphID = this.id

        this.subgraph.add(innerNode);
        const nodeSize = innerNode.computeSize();
        if (pos)
            innerNode.pos = [pos[0] + nodeSize[0] * 0.5, pos[1] - nodeSize[1] * 0.5];

        // The following call will add an output slot to this node automatically from onSubgraphNewOutput.
        this.subgraph.addOutput(name, "" + type, null);

        const outerOutputIndex = this.outputs.length - 1;
        const outerOutput = this.outputs[outerOutputIndex]

        return { innerNode, outerOutput, outerOutputIndex }
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
}

LiteGraph.registerNodeType({
    class: Subgraph,
    title: "Subgraph",
    desc: "Graph inside a node",
    title_color: "#334",
    type: "graph/subgraph"
})

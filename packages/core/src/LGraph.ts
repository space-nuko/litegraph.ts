import type { ContextMenuItem, IContextMenuItem } from "./ContextMenu";
import type { SlotIndex } from "./INodeSlot";
import LGraphCanvas from "./LGraphCanvas";
import LGraphGroup from "./LGraphGroup";
import LGraphNode, { LGraphNodeCloneData, LGraphNodeConstructor } from "./LGraphNode";
import type { SerializedLLink } from "./LLink";
import LLink from "./LLink";
import LiteGraph from "./LiteGraph";
import GraphInput from "./nodes/GraphInput";
import Subgraph from "./nodes/Subgraph";
import { LConnectionKind, LinkID, NodeID, SlotType, TitleMode, Vector2, Version } from "./types";
import { LayoutDirection, NodeMode } from "./types";
import { v4 as uuidv4 } from "uuid";
import { UUID } from "./types";

export type LGraphAddNodeMode = "configure" | "cloneSelection" | "paste" | "moveIntoSubgraph" | "moveOutOfSubgraph" | null
export type LGraphAddNodeOptions = {
    skipComputeOrder?: boolean,
    doCalcSize?: boolean,
    doProcessChange?: boolean,
    addedBy?: LGraphAddNodeMode,
    prevNodeID?: NodeID,
    prevNode?: LGraphNode,
    cloneData?: LGraphNodeCloneData,
    subgraphs?: Subgraph[],
    pos?: Vector2
}

export type LGraphRemoveNodeMode = "moveIntoSubgraph" | "moveOutOfSubgraph" | null;
export type LGraphRemoveNodeOptions = {
    removedBy?: LGraphRemoveNodeMode,
    subgraphs?: Subgraph[]
}

export interface LGraphConfig {
    align_to_grid?: boolean;
    links_ontop?: boolean;
}

export type LGraphInput = {
    name: string,
    type: SlotType,
    value: any
}

export type LGraphOutput = {
    name: string,
    type: SlotType,
    value: any
}

export type SerializedLGraph<
    TNode = ReturnType<LGraphNode["serialize"]>,
    // https://github.com/jagenjo/litegraph.js/issues/74
    TLink = SerializedLLink,
    TGroup = ReturnType<LGraphGroup["serialize"]>
> = {
    last_node_id: LGraph["last_node_id"];
    last_link_id: LGraph["last_link_id"];
    nodes: TNode[];
    links: TLink[];
    groups: TGroup[];
    config: LGraph["config"];
    extra: LGraph["extra"];
    version: Version;
};

export enum LGraphStatus {
    STATUS_STOPPED = 1,
    STATUS_RUNNING
}

export type LGraphNodeExecutable = (LGraphNode & { onExecute: NonNullable<LGraphNode["onExecute"]> });

export default class LGraph {
    static DEFAULT_SUPPORTED_TYPES: string[] = ["number", "string", "boolean"];
    supported_types: string[] | null = null;

    constructor(o?: SerializedLGraph) {
        if (LiteGraph.debug) {
            console.log("Graph created");
        }
        this.list_of_graphcanvas = null;
        this.clear();

        if (o) {
            this.configure(o);
        }
    }

    filter: string;
    catch_errors: boolean;
    /** custom data */
    config: LGraphConfig;
    vars: Record<string, any> = {}
    /** to store custom data */
    extra: Record<string, any> = {}
    elapsed_time: number;
    fixedtime: number;
    fixedtime_lapse: number;
    globaltime: number;
    inputs: Record<string, LGraphInput> = {}
    outputs: Record<string, LGraphOutput> = {}
    iteration: number;
    last_link_id: number;
    last_node_id: number;
    last_update_time: number;
    links: Record<LinkID, LLink> = {};
    list_of_graphcanvas: LGraphCanvas[] = [];
    runningtime: number;
    starttime: number;
    status: LGraphStatus;

    _nodes: LGraphNode[] = [];
    _groups: LGraphGroup[] = [];
    _nodes_by_id: Record<NodeID, LGraphNode> = {};
    /** nodes that are executable sorted in execution order */
    _nodes_executable:
        | LGraphNodeExecutable[]
        | null = null;
    /** nodes that contain onExecute */
    _nodes_in_order: LGraphNode[] = [];
    /** used to detect changes */
    _version: number = -1;
    _last_trigger_time: number = 0;
    _is_subgraph: boolean = false;
    _subgraph_node: Subgraph | null = null;

    nodes_executing: boolean[] = [];
    nodes_actioning: boolean[] = [];
    nodes_executedAction: string[] = [];

    execution_timer_id: ReturnType<typeof setInterval> | -1 = -1;
    execution_time: number = 0;
    errors_in_execution: boolean = false;

    getSupportedTypes(): string[] {
        return this.supported_types || LGraph.DEFAULT_SUPPORTED_TYPES;
    }

    /*
     * Gets the root graph above any subgraphs.
     */
    getRootGraph(): LGraph | null {
        const graphs = Array.from(this.iterateParentGraphs());
        const graph = graphs[graphs.length - 1]
        if (graph._is_subgraph)
            return null;
        return graph;
    }

    *iterateParentGraphs(): Iterable<LGraph> {
        let graph: LGraph | null = this;
        while (graph) {
            yield graph;
            graph = graph._subgraph_node?.graph;
        }
    }

    /** Removes all nodes from this graph */
    clear(): void {
        this.stop();
        this.status = LGraphStatus.STATUS_STOPPED;

        this.last_node_id = 0;
        this.last_link_id = 0;

        this._version = -1; //used to detect changes

        //safe clear
        if (this._nodes) {
            for (var i = 0; i < this._nodes.length; ++i) {
                var node = this._nodes[i];
                if (node.onRemoved) {
                    node.onRemoved();
                }
            }
        }

        //nodes
        this._nodes = [];
        this._nodes_by_id = {};
        this._nodes_in_order = []; //nodes sorted in execution order
        this._nodes_executable = null; //nodes that contain onExecute sorted in execution order

        //other scene stuff
        this._groups = [];

        //links
        this.links = {}; //container with all the links

        //iterations
        this.iteration = 0;

        //custom data
        this.config = {};
        this.vars = {};
        this.extra = {}; //to store custom data

        //timing
        this.globaltime = 0;
        this.runningtime = 0;
        this.fixedtime = 0;
        this.fixedtime_lapse = 0.01;
        this.elapsed_time = 0.01;
        this.last_update_time = 0;
        this.starttime = 0;

        this.catch_errors = true;

        this.nodes_executing = [];
        this.nodes_actioning = [];
        this.nodes_executedAction = [];

        //subgraph_data
        this.inputs = {};
        this.outputs = {};

        //notify canvas to redraw
        this.change();

        this.sendActionToCanvas("clear");
    }

    /** Attach Canvas to this graph */
    attachCanvas(graphCanvas: LGraphCanvas): void {
        if (!(graphCanvas instanceof LGraphCanvas)) {
            throw "attachCanvas expects a LGraphCanvas instance";
        }
        if (graphCanvas.graph && graphCanvas.graph != this) {
            graphCanvas.graph.detachCanvas(graphCanvas);
        }

        graphCanvas.graph = this;

        if (!this.list_of_graphcanvas) {
            this.list_of_graphcanvas = [];
        }
        this.list_of_graphcanvas.push(graphCanvas);
    }

    /** Detach Canvas to this graph */
    detachCanvas(graphCanvas: LGraphCanvas): void {
        if (!this.list_of_graphcanvas) {
            return;
        }

        var pos = this.list_of_graphcanvas.indexOf(graphCanvas);
        if (pos == -1) {
            return;
        }
        graphCanvas.graph = null;
        this.list_of_graphcanvas.splice(pos, 1);
    }

    /**
     * Starts running this graph every interval milliseconds.
     * @param interval amount of milliseconds between executions, if 0 then it renders to the monitor refresh rate
     */
    start(interval?: number): void {
        if (this.status == LGraphStatus.STATUS_RUNNING) {
            return;
        }
        this.status = LGraphStatus.STATUS_RUNNING;

        if (this.onPlayEvent) {
            this.onPlayEvent();
        }

        this.sendEventToAllNodes("onStart");

        //launch
        this.starttime = LiteGraph.getTime();
        this.last_update_time = this.starttime;
        interval = interval || 0;
        var that = this;

        //execute once per frame
        if (interval == 0 && typeof window != "undefined" && window.requestAnimationFrame) {
            function on_frame() {
                if (that.execution_timer_id != -1) {
                    return;
                }
                window.requestAnimationFrame(on_frame);
                if (that.onBeforeStep)
                    that.onBeforeStep();
                that.runStep(1, !that.catch_errors);
                if (that.onAfterStep)
                    that.onAfterStep();
            }
            this.execution_timer_id = -1;
            on_frame();
        } else { //execute every 'interval' ms
            this.execution_timer_id = setInterval(function() {
                //execute
                if (that.onBeforeStep)
                    that.onBeforeStep();
                that.runStep(1, !that.catch_errors);
                if (that.onAfterStep)
                    that.onAfterStep();
            }, interval);
        }
    }

    /** Stops the execution loop of the graph */
    stop(): void {
        if (this.status == LGraphStatus.STATUS_STOPPED) {
            return;
        }

        this.status = LGraphStatus.STATUS_STOPPED;

        if (this.onStopEvent) {
            this.onStopEvent();
        }

        if (this.execution_timer_id != null) {
            if (this.execution_timer_id != -1) {
                clearInterval(this.execution_timer_id);
            }
            this.execution_timer_id = null;
        }

        this.sendEventToAllNodes("onStop");
    }

    /**
     * Run N steps (cycles) of the graph
     * @param num number of steps to run, default is 1
     * @param do_not_catch_errors if you want to try/catch errors
     */
    runStep(num: number = 1, do_not_catch_errors: boolean = false, limit?: number): void {
        var start = LiteGraph.getTime();
        this.globaltime = 0.001 * (start - this.starttime);

        let nodes: LGraphNode[] | null = (this._nodes_executable
            ? this._nodes_executable
            : this._nodes) as LGraphNode[] | null;

        if (!nodes) {
            return;
        }

        limit = limit || nodes.length;

        if (do_not_catch_errors) {
            //iterations
            for (var i = 0; i < num; i++) {
                for (var j = 0; j < limit; ++j) {
                    var node = nodes[j];
                    if (node.mode == NodeMode.ALWAYS && node.onExecute) {
                        //wrap node.onExecute();
                        node.doExecute();
                    }
                }

                this.fixedtime += this.fixedtime_lapse;
                if (this.onExecuteStep) {
                    this.onExecuteStep();
                }
            }

            if (this.onAfterExecute) {
                this.onAfterExecute();
            }
        } else {
            try {
                //iterations
                for (var i = 0; i < num; i++) {
                    for (var j = 0; j < limit; ++j) {
                        var node = nodes[j];
                        if (node.mode == NodeMode.ALWAYS && node.onExecute) {
                            node.onExecute(null, {});
                        }
                    }

                    this.fixedtime += this.fixedtime_lapse;
                    if (this.onExecuteStep) {
                        this.onExecuteStep();
                    }
                }

                if (this.onAfterExecute) {
                    this.onAfterExecute();
                }
                this.errors_in_execution = false;
            } catch (err) {
                this.errors_in_execution = true;
                if (LiteGraph.throw_errors) {
                    throw err;
                }
                if (LiteGraph.debug) {
                    console.log("Error during execution: " + err);
                }
                this.stop();
            }
        }

        var now = LiteGraph.getTime();
        var elapsed = now - start;
        if (elapsed == 0) {
            elapsed = 1;
        }
        this.execution_time = 0.001 * elapsed;
        this.globaltime += 0.001 * elapsed;
        this.iteration += 1;
        this.elapsed_time = (now - this.last_update_time) * 0.001;
        this.last_update_time = now;
        this.nodes_executing = [];
        this.nodes_actioning = [];
        this.nodes_executedAction = [];
    }

    /**
     * Updates the graph execution order according to relevance of the nodes (nodes with only outputs have more relevance than
     * nodes with only inputs.
     */
    updateExecutionOrder(): void {
        this._nodes_in_order = this.computeExecutionOrder(false);
        this._nodes_executable = [];
        for (var i = 0; i < this._nodes_in_order.length; ++i) {
            if (this._nodes_in_order[i].onExecute) {
                let node = this._nodes_in_order[i] as LGraphNodeExecutable;
                this._nodes_executable.push(node);
            }
        }
    }

    *computeExecutionOrderRecursive<T extends LGraphNode>(only_onExecute: boolean = false, set_level?: any): Iterable<T> {
        for (const node of this.computeExecutionOrder<T>(only_onExecute, set_level)) {
            yield node;
            if (node.is(Subgraph)) {
                for (const innerNode of node.subgraph.computeExecutionOrderRecursive<T>(only_onExecute, set_level)) {
                    yield innerNode;
                }
            }
        }
    }

    /** This is more internal, it computes the executable nodes in order and returns it */
    computeExecutionOrder<T extends LGraphNode>(only_onExecute: boolean = false, set_level?: any): T[] {
        var L: T[] = [];
        var S = [];
        var M = {};
        var visited_links = {}; //to avoid repeating links
        var remaining_links = {};

        //search for the nodes without inputs (starting nodes)
        for (var i = 0, l = this._nodes.length; i < l; ++i) {
            var node = this._nodes[i];
            if (only_onExecute && !node.onExecute) {
                continue;
            }

            M[node.id] = node; //add to pending nodes

            var num = 0; //num of input connections
            if (node.inputs) {
                for (var j = 0, l2 = node.inputs.length; j < l2; j++) {
                    if (node.inputs[j] && node.inputs[j].link != null) {
                        num += 1;
                    }
                }
            }

            if (num == 0) {
                //is a starting node
                S.push(node);
                if (set_level) {
                    node._level = 1;
                }
            } //num of input links
            else {
                if (set_level) {
                    node._level = 0;
                }
                remaining_links[node.id] = num;
            }
        }

        while (true) {
            if (S.length == 0) {
                break;
            }

            //get an starting node
            let node = S.shift();
            L.push(node); //add to ordered list
            delete M[node.id]; //remove from the pending nodes

            if (!node.outputs) {
                continue;
            }

            //for every output
            for (var i = 0; i < node.outputs.length; i++) {
                var output = node.outputs[i];
                //not connected
                if (
                    output == null ||
                    output.links == null ||
                    output.links.length == 0
                ) {
                    continue;
                }

                //for every connection
                for (var j = 0; j < output.links.length; j++) {
                    var linkId = output.links[j];
                    var link = this.links[linkId];
                    if (!link) {
                        continue;
                    }

                    //already visited link (ignore it)
                    if (visited_links[link.id]) {
                        continue;
                    }

                    var target_node = this.getNodeById(link.target_id);
                    if (target_node == null) {
                        visited_links[link.id] = true;
                        continue;
                    }

                    if (
                        set_level &&
                        (!target_node._level ||
                            target_node._level <= node._level)
                    ) {
                        target_node._level = node._level + 1;
                    }

                    visited_links[link.id] = true; //mark as visited
                    remaining_links[target_node.id] -= 1; //reduce the number of links remaining
                    if (remaining_links[target_node.id] == 0) {
                        S.push(target_node);
                    } //if no more links, then add to starters array
                }
            }
        }

        //the remaining ones (loops)
        for (let i of Object.keys(M).sort()) {
            L.push(M[i]);
        }

        if (L.length != this._nodes.length && LiteGraph.debug) {
            console.warn("something went wrong, nodes missing");
        }

        var l = L.length;

        //save order number in the node
        for (var i = 0; i < l; ++i) {
            L[i].order = i;
        }

        //sort now by priority
        L = L.sort(function(A, B) {
            var Ap = (A.constructor as any).priority || A.priority || 0;
            var Bp = (B.constructor as any).priority || B.priority || 0;
            if (Ap == Bp) {
                //if same priority, sort by order
                return A.order - B.order;
            }
            return Ap - Bp; //sort by priority
        });

        //save order number in the node, again...
        for (var i = 0; i < l; ++i) {
            L[i].order = i;
        }

        return L;
    }

    /**
     * Returns all the nodes that could affect this one (ancestors) by crawling all the inputs recursively.
     * It doesn't include the node itself
     * @return an array with all the LGraphNodes that affect this node, in order of execution
     */
    getAncestors(node: LGraphNode): LGraphNode[] {
        var ancestors = [];
        var pending = [node];
        var visited = {};

        while (pending.length) {
            var current = pending.shift();
            if (!current.inputs) {
                continue;
            }
            if (!visited[current.id] && current != node) {
                visited[current.id] = true;
                ancestors.push(current);
            }

            for (var i = 0; i < current.inputs.length; ++i) {
                var input = current.getInputNode(i);
                if (input && ancestors.indexOf(input) == -1) {
                    pending.push(input);
                }
            }
        }

        ancestors.sort(function(a, b) {
            return a.order - b.order;
        });
        return ancestors;
    }

    /**
     * Positions every node in a more readable manner
     */
    arrange(margin: number = 100, layout: LayoutDirection = LayoutDirection.HORIZONTAL_LAYOUT): void {
        const nodes = this.computeExecutionOrder(false, true);
        const columns = [];
        for (let i = 0; i < nodes.length; ++i) {
            const node = nodes[i];
            const col = node._level || 1;
            if (!columns[col]) {
                columns[col] = [];
            }
            columns[col].push(node);
        }

        let x = margin;

        for (let i = 0; i < columns.length; ++i) {
            const column = columns[i];
            if (!column) {
                continue;
            }
            let max_size = 100;
            let y = margin + LiteGraph.NODE_TITLE_HEIGHT;
            for (let j = 0; j < column.length; ++j) {
                const node = column[j];
                node.pos[0] = (layout == LayoutDirection.VERTICAL_LAYOUT) ? y : x;
                node.pos[1] = (layout == LayoutDirection.VERTICAL_LAYOUT) ? x : y;
                const max_size_index = (layout == LayoutDirection.VERTICAL_LAYOUT) ? 1 : 0;
                if (node.size[max_size_index] > max_size) {
                    max_size = node.size[max_size_index];
                }
                const node_size_index = (layout == LayoutDirection.VERTICAL_LAYOUT) ? 0 : 1;
                y += node.size[node_size_index] + margin + LiteGraph.NODE_TITLE_HEIGHT;
            }
            x += max_size + margin;
        }

        this.setDirtyCanvas(true, true);
    }

    /**
     * Returns the amount of time the graph has been running in milliseconds
     * @return number of milliseconds the graph has been running
     */
    getTime(): number {
        return this.globaltime;
    }


    /**
     * Returns the amount of time accumulated using the fixedtime_lapse var. This is used in context where the time increments should be constant
     * @return number of milliseconds the graph has been running
     */
    getFixedTime(): number {
        return this.fixedtime;
    }


    /**
     * Returns the amount of time it took to compute the latest iteration. Take into account that this number could be not correct
     * if the nodes are using graphical actions
     * @return number of milliseconds it took the last cycle
     */
    getElapsedTime(): number {
        return this.elapsed_time;
    }

    /**
     * Iterates all nodes in this graph *excluding* subgraphs.
     */
    *iterateNodesInOrder(): Iterable<LGraphNode> {
        const nodes = this._nodes_in_order ? this._nodes_in_order : this._nodes || [];
        for (const node of nodes) {
            yield node;
        }
    }

    /**
     * Iterates all nodes in this graph and subgraphs.
     */
    *iterateNodesInOrderRecursive(): Iterable<LGraphNode> {
        const nodes = this._nodes_in_order ? this._nodes_in_order : this._nodes || [];
        for (const node of nodes) {
            yield node;
            if (node.subgraph != null) {
                for (const childNode of node.subgraph.iterateNodesInOrderRecursive()) {
                    yield childNode;
                }
            }
        }
    }

    /**
     * Iterates all nodes in this graph *excluding* subgraphs.
     */
    *iterateNodesOfClass<T extends LGraphNode>(ctor: new () => T): Iterable<T> {
        const litegraphType = (ctor as any).__LITEGRAPH_TYPE__
        if (litegraphType == null)
            return;

        for (const node of this.iterateNodesInOrder()) {
            if (node.type === litegraphType)
                yield node as T;
        }
    }

    /**
     * Iterates all nodes in this graph *excluding* subgraphs.
     */
    *iterateNodesOfClassRecursive<T extends LGraphNode>(ctor: new () => T): Iterable<T> {
        const litegraphType = (ctor as any).__LITEGRAPH_TYPE__
        if (litegraphType == null)
            return;

        for (const node of this.iterateNodesInOrderRecursive()) {
            if (node.type === litegraphType)
                yield node as T;
        }
    }

    /**
     * Iterates all nodes in this graph *excluding* subgraphs.
     */
    *iterateNodesOfTypeRecursive<T extends LGraphNode>(type: string): Iterable<T> {
        for (const node of this.iterateNodesInOrderRecursive()) {
            if (node.type === type)
                yield node as T;
        }
    }

    /**
     * Sends an event to all the nodes, useful to trigger stuff
     * @param eventName the name of the event (function to be called)
     * @param params parameters in array format
     */
    sendEventToAllNodes(eventName: string, params: any[] = [], mode: NodeMode = NodeMode.ALWAYS): void {
        var nodes = this._nodes_in_order ? this._nodes_in_order : this._nodes;
        if (!nodes) {
            return;
        }

        for (const node of this.iterateNodesInOrder()) {
            if (node.type === "basic/subgraph" && eventName != "onExecute") {
                if (node.mode == mode) {
                    (node as Subgraph).sendEventToAllNodes(eventName, params, mode);
                }
                continue;
            }

            if (!node[eventName] || node.mode != mode) {
                continue;
            }
            if (params === undefined) {
                node[eventName]();
            } else if (params && params.constructor === Array) {
                node[eventName].apply(node, params);
            } else {
                node[eventName](params);
            }
        }
    }


    sendActionToCanvas(action: any, params: any[] = []): void {
        if (!this.list_of_graphcanvas) {
            return;
        }

        for (var i = 0; i < this.list_of_graphcanvas.length; ++i) {
            var c = this.list_of_graphcanvas[i];
            if (c[action]) {
                c[action].apply(c, params);
            }
        }
    }

    addGroup(group: LGraphGroup): LGraphGroup {
        this._groups.push(group);
        this.setDirtyCanvas(true);
        this.change();
        group.graph = this;
        this._version++;
        return group;
    }

    /**
     * Adds a new node instance to this graph
     * @param node the instance of the node
     */
    add(node: LGraphNode, options: LGraphAddNodeOptions = {}): LGraphNode | null {
        //nodes
        if (node.id != -1 && this._nodes_by_id[node.id] != null) {
            console.warn(
                "LiteGraph: there is already a node with this ID, changing it", node.id,
            );
            if (LiteGraph.use_uuids) {
                node.id = uuidv4();
            }
            else {
                node.id = ++this.last_node_id;
            }
        }

        if (options.pos) {
            if (isNaN(options.pos[0]) || isNaN(options.pos[1])) {
                throw "LiteGraph: Node position contained NaN(s)!"
            }
        }

        if (this._nodes.length >= LiteGraph.MAX_NUMBER_OF_NODES) {
            throw "LiteGraph: max number of nodes in a graph reached";
        }

        //give him an id
        if (LiteGraph.use_uuids) {
            if (!node.id)
                node.id = uuidv4();
        }
        else {
            if (node.id == null || node.id == -1) {
                node.id = ++this.last_node_id;
            } else if (this.last_node_id < (node.id as number)) {
                this.last_node_id = node.id as number;
            }
        }

        node.graph = this;
        this._version++;

        this._nodes.push(node);
        this._nodes_by_id[node.id] = node;

        if (options.pos) {
            node.pos = options.pos
        }

        if (node.onAdded) {
            node.onAdded(this);
        }

        if (this.config.align_to_grid) {
            node.alignToGrid();
        }

        if (!options.skipComputeOrder) {
            this.updateExecutionOrder();
        }

        if (this.onNodeAdded) {
            this.onNodeAdded(node, options);
        }

        this.setDirtyCanvas(true);
        this.change();

        return node; //to chain actions
    }

    /**
     * Called before the graph is changed
     */
    onBeforeChange?(graph: LGraph, info: any): void;

    /**
     * Called after the graph is changed
     */
    onAfterChange?(graph: LGraph, info: any): void;

    /**
     * Called when a new node is added
     * @param node the instance of the node
     */
    onNodeAdded?(node: LGraphNode, options: LGraphAddNodeOptions): void;

    /**
     * Called when a node is removed
     * @param node the instance of the node
     */
    onNodeRemoved?(node: LGraphNode, options: LGraphRemoveNodeOptions): void;

    onPlayEvent?(): void;
    onStopEvent?(): void;
    onBeforeStep?(): void;
    onAfterStep?(): void;
    onExecuteStep?(): void;
    onAfterExecute?(): void;

    onGetNodeMenuOptions?(options: ContextMenuItem[], node: LGraphNode): ContextMenuItem[];
    onGetLinkMenuOptions?(options: ContextMenuItem[], link: LLink): ContextMenuItem[];

    /**
     * Called when a node's connection is changed
     * @param node the instance of the node
     */
    onNodeConnectionChange?(kind: LConnectionKind,
        node: LGraphNode,
        slot: SlotIndex,
        target_node?: LGraphNode,
        target_slot?: SlotIndex): void;

    /** Called by `LGraph.configure` */
    onConfigure?(data: SerializedLGraph): void;

    onNodeTrace?(node: LGraphNode, message: string)

    /** Removes a node from the graph */
    remove(node: LGraphNode, options: LGraphRemoveNodeOptions = {}): void {
        if (node instanceof LGraphGroup) {
            var index = this._groups.indexOf(node);
            if (index != -1) {
                this._groups.splice(index, 1);
            }
            node.graph = null;
            this._version++;
            this.setDirtyCanvas(true, true);
            this.change();
            return;
        }

        if (this._nodes_by_id[node.id] == null) {
            return;
        } //not found

        if (node.ignore_remove) {
            return;
        } //cannot be removed

        this.beforeChange(); //sure? - almost sure is wrong

        //disconnect inputs
        if (node.inputs) {
            for (var i = 0; i < node.inputs.length; i++) {
                var slot = node.inputs[i];
                if (slot.link != null) {
                    node.disconnectInput(i);
                }
            }
        }

        //disconnect outputs
        if (node.outputs) {
            for (var i = 0; i < node.outputs.length; i++) {
                let slot = node.outputs[i];
                if (slot.links != null && slot.links.length) {
                    node.disconnectOutput(i);
                }
            }
        }

        //node.id = -1; //why?

        //callback
        if (node.onRemoved) {
            node.onRemoved(options);
        }

        node.graph = null;
        this._version++;

        //remove from canvas render
        if (this.list_of_graphcanvas) {
            for (var i = 0; i < this.list_of_graphcanvas.length; ++i) {
                var canvas = this.list_of_graphcanvas[i];
                if (canvas.selected_nodes[node.id]) {
                    delete canvas.selected_nodes[node.id];
                }
                if (canvas.node_dragged == node) {
                    canvas.node_dragged = null;
                }
            }
        }

        //remove from containers
        var pos = this._nodes.indexOf(node);
        if (pos != -1) {
            this._nodes.splice(pos, 1);
        }
        delete this._nodes_by_id[node.id];

        if (this.onNodeRemoved) {
            this.onNodeRemoved(node, options);
        }

        //close panels
        this.sendActionToCanvas("checkPanels");

        this.setDirtyCanvas(true, true);
        this.afterChange(); //sure? - almost sure is wrong
        this.change();

        this.updateExecutionOrder();
    }

    /** Returns a node by its id. */
    getNodeById<T extends LGraphNode = LGraphNode>(id: NodeID): T | null {
        if (id == null) {
            return null;
        }
        return this._nodes_by_id[id] as T;
    }

    /** Returns a node by its id. */
    getNodeByIdRecursive<T extends LGraphNode = LGraphNode>(id: NodeID): T | null {
        const found = this.getNodeById<T>(id);
        if (found != null)
            return found;

        for (const node of this.iterateNodesOfClass(Subgraph)) {
            const found = node.subgraph.getNodeByIdRecursive<T>(id);
            if (found)
                return found;
        }

        return null;
    }

    /**
     * Returns a list of nodes that matches a class
     * @param classObject the class itself (not an string)
     * @return a list with all the nodes of this type
     */
    findNodesByClass<T extends LGraphNode>(type: new () => T, result: T[] = []): T[] {
        result.length = 0;
        for (const node of this.iterateNodesOfClass(type)) {
            result.push(node);
        }
        return result;
    }

    /**
     * Returns a list of nodes that matches a type
     * @param type the name of the node type
     * @return a list with all the nodes of this type
     */
    findNodesByType(type: string, result: LGraphNode[] = []): LGraphNode[] {
        var type = type.toLowerCase();
        result.length = 0;
        for (var i = 0, l = this._nodes.length; i < l; ++i) {
            if (this._nodes[i].type.toLowerCase() == type) {
                result.push(this._nodes[i] as LGraphNode);
            }
        }
        return result;
    }

    /**
     * Returns a list of nodes that matches a class
     * @param classObject the class itself (not an string)
     * @return a list with all the nodes of this type
     */
    findNodesByClassRecursive<T extends LGraphNode>(type: new () => T, result: T[] = []): T[] {
        result.length = 0;
        for (const node of this.iterateNodesOfClassRecursive(type)) {
            result.push(node);
        }
        return result;
    }

    /**
     * Returns a list of nodes that matches a type
     * @param type the name of the node type
     * @return a list with all the nodes of this type
     */
    findNodesByTypeRecursive(type: string, result: LGraphNode[] = []): LGraphNode[] {
        var type = type.toLowerCase();
        result.length = 0;
        for (const node of this.iterateNodesOfTypeRecursive(type)) {
            result.push(node);
        }
        return result;
    }

    /**
     * Returns the first node that matches a name in its title
     * @param title the name of the node to search
     * @return the node or null
     */
    findNodeByTitle(title: string): LGraphNode | null {
        for (var i = 0, l = this._nodes.length; i < l; ++i) {
            if (this._nodes[i].title == title) {
                return this._nodes[i];
            }
        }
        return null;
    }

    /**
     * Returns a list of nodes that matches a name
     * @param title the name of the node to search
     * @return a list with all the nodes with this name
     */
    findNodesByTitle(title: string): LGraphNode[] {
        var result = [];
        for (var i = 0, l = this._nodes.length; i < l; ++i) {
            if (this._nodes[i].title == title) {
                result.push(this._nodes[i]);
            }
        }
        return result;
    }

    /**
     * Returns the top-most node in this position of the canvas
     * @param x the x coordinate in canvas space
     * @param y the y coordinate in canvas space
     * @param nodesList a list with all the nodes to search from, by default is all the nodes in the graph
     * @return the node at this position or null
     */
    getNodeOnPos(x: number, y: number, nodesList?: LGraphNode[], margin?: number): LGraphNode | null {
        nodesList = nodesList || this._nodes;
        var nRet = null;
        for (var i = nodesList.length - 1; i >= 0; i--) {
            var n = nodesList[i];
            var skip_title = n.titleMode == TitleMode.NO_TITLE;
            if (n.isPointInside(x, y, margin, skip_title)) {
                // check for lesser interest nodes (TODO check for overlapping, use the top)
                /*if (typeof n == "LGraphGroup"){
                    nRet = n;
                }else{*/
                return n;
                /*}*/
            }
        }
        return nRet;
    }

    /**
     * Returns the top-most group in that position
     * @param x the x coordinate in canvas space
     * @param y the y coordinate in canvas space
     * @return the group or null
     */
    getGroupOnPos(x: number, y: number): LGraphGroup | null {
        for (var i = this._groups.length - 1; i >= 0; i--) {
            var g = this._groups[i];
            if (g.isPointInside(x, y, 2, true)) {
                return g;
            }
        }
        return null;
    }

    /**
     * Checks that the node type matches the node type registered, used when replacing a nodetype by a newer version during execution
     * this replaces the ones using the old version with the new version
     * @method checkNodeTypes
     */
    checkNodeTypes(): boolean {
        var changes = false;
        for (var i = 0; i < this._nodes.length; i++) {
            var node = this._nodes[i];
            var config = LiteGraph.registered_node_types[node.type];
            if (node.constructor == config.class) {
                continue;
            }
            console.log("node being replaced by newer version: " + node.type);
            var newnode = LiteGraph.createNode(node.type);
            changes = true;
            this._nodes[i] = newnode;
            newnode.configure(node.serialize());
            newnode.graph = this;
            this._nodes_by_id[newnode.id] = newnode;
            if (node.inputs) {
                newnode.inputs = node.inputs.concat();
            }
            if (node.outputs) {
                newnode.outputs = node.outputs.concat();
            }
        }
        this.updateExecutionOrder();
        return changes
    }

    // ********** GLOBALS *****************

    onAction(action: any, param: any, options: { action_call?: string } = {}): void {
        for (const node of this.iterateNodesOfClass(GraphInput)) {
            if (node.properties.name != action) {
                continue;
            }
            //wrap node.onAction(action, param);
            node.actionDo(action, param, options);
            break;
        }
    }

    onTrigger?(action: any, param: any): void;
    onInputsOutputsChange?(): void;

    trigger(action: any, param: any): void {
        if (this.onTrigger) {
            this.onTrigger(action, param);
        }
    }

    triggerSlot(action: any, param: any): void {
        if (this.onTrigger) {
            this.onTrigger(action, param);
        }
    }

    /** Tell this graph it has a global graph input of this type */
    addInput(name: string, type: SlotType, value?: any): void {
        var input = this.inputs[name];
        if (input) {
            //already exist
            return;
        }

        this.beforeChange();
        this.inputs[name] = { name: name, type: type, value: value };
        this._version++;
        this.afterChange();

        if (this.onInputAdded) {
            this.onInputAdded(name, type, value);
        }

        if (this.onInputsOutputsChange) {
            this.onInputsOutputsChange();
        }
    }

    onInputAdded?(name: string, type: SlotType, value: any): void;

    /** Assign a data to the global graph input */
    setInputData(name: string, data: any): void {
        var input = this.inputs[name];
        if (!input) {
            return;
        }
        input.value = data;
    }

    /** Returns the current value of a global graph input */
    getInputData<T = any>(name: string): T | null {
        var input = this.inputs[name];
        if (!input) {
            return null;
        }
        return input.value;
    }

    onInputRenamed?(oldName: string, newName: string): void;

    /** Changes the name of a global graph input */
    renameInput(old_name: string, name: string): boolean | undefined {
        if (name == old_name) {
            return;
        }

        if (!this.inputs[old_name]) {
            return false;
        }

        if (this.inputs[name]) {
            console.error("there is already one input with that name");
            return false;
        }

        this.inputs[name] = this.inputs[old_name];
        delete this.inputs[old_name];
        this._version++;

        if (this.onInputRenamed) {
            this.onInputRenamed(old_name, name);
        }

        if (this.onInputsOutputsChange) {
            this.onInputsOutputsChange();
        }

        return true;
    }

    onInputTypeChanged?(name: string, oldType: SlotType, newType: SlotType): void;

    /** Changes the type of a global graph input */
    changeInputType(name: string, type: SlotType): boolean | undefined {
        if (!this.inputs[name]) {
            return false;
        }

        if (
            this.inputs[name].type &&
            String(this.inputs[name].type).toLowerCase() ==
            String(type).toLowerCase()
        ) {
            return;
        }

        const oldType = this.inputs[name].type;
        this.inputs[name].type = type;
        this._version++;
        if (this.onInputTypeChanged) {
            this.onInputTypeChanged(name, oldType, type);
        }

        return true;
    }

    onInputRemoved?(name: string): void;

    /** Removes a global graph input */
    removeInput(name: string): boolean {
        if (!this.inputs[name]) {
            return false;
        }

        delete this.inputs[name];
        this._version++;

        if (this.onInputRemoved) {
            this.onInputRemoved(name);
        }

        if (this.onInputsOutputsChange) {
            this.onInputsOutputsChange();
        }
        return true;
    }

    onOutputAdded?(name: string, type: SlotType, value: any)

    /** Creates a global graph output */
    addOutput(name: string, type: SlotType, value: any): void {
        this.outputs[name] = { name: name, type: type, value: value };
        this._version++;

        if (this.onOutputAdded) {
            this.onOutputAdded(name, type, value);
        }

        if (this.onInputsOutputsChange) {
            this.onInputsOutputsChange();
        }
    }

    /** Assign a data to the global output */
    setOutputData(name: string, value: string): void {
        var output = this.outputs[name];
        if (!output) {
            return;
        }
        output.value = value;
    }

    /** Returns the current value of a global graph output */
    getOutputData<T = any>(name: string): T | null {
        var output = this.outputs[name];
        if (!output) {
            return null;
        }
        return output.value;
    }

    onOutputRenamed?(oldName: string, newName: string): void;

    /** Renames a global graph output */
    renameOutput(old_name: string, name: string): boolean | undefined {
        if (!this.outputs[old_name]) {
            return false;
        }

        if (this.outputs[name]) {
            console.error("there is already one output with that name");
            return false;
        }

        this.outputs[name] = this.outputs[old_name];
        delete this.outputs[old_name];
        this._version++;

        if (this.onOutputRenamed) {
            this.onOutputRenamed(old_name, name);
        }

        if (this.onInputsOutputsChange) {
            this.onInputsOutputsChange();
        }

        return true;
    }

    onOutputTypeChanged?(name: string, oldType: SlotType, newType: SlotType)

    /** Changes the type of a global graph output */
    changeOutputType(name: string, type: SlotType): boolean | undefined {
        if (!this.outputs[name]) {
            return false;
        }

        if (
            this.outputs[name].type &&
            String(this.outputs[name].type).toLowerCase() ==
            String(type).toLowerCase()
        ) {
            return;
        }

        const oldType = this.outputs[name].type
        this.outputs[name].type = type;
        this._version++;
        if (this.onOutputTypeChanged) {
            this.onOutputTypeChanged(name, oldType, type);
        }

        return true;
    }

    onOutputRemoved?(name: string): void;

    /** Removes a global graph output */
    removeOutput(name: string): boolean {
        if (!this.outputs[name]) {
            return false;
        }
        delete this.outputs[name];
        this._version++;

        if (this.onOutputRemoved) {
            this.onOutputRemoved(name);
        }

        if (this.onInputsOutputsChange) {
            this.onInputsOutputsChange();
        }
        return true;
    }

    /* TODO implement
    triggerInput(name: string, value: any): void {
        var nodes = this.findNodesByTitle(name);
        for (var i = 0; i < nodes.length; ++i) {
            nodes[i].onTrigger(value);
        }
    }

    setCallback(name: string, func: (...args: any[]) => any): void {
        var nodes = this.findNodesByTitle(name);
        for (var i = 0; i < nodes.length; ++i) {
            nodes[i].setTrigger(func);
        }
    }
    */

    /** used for undo, called before any change is made to the graph */
    beforeChange(info?: LGraphNode): void {
        if (this.onBeforeChange) {
            this.onBeforeChange(this, info);
        }
        this.sendActionToCanvas("onBeforeChange", [this]);
    }

    /** used to resend actions, called after any change is made to the graph */
    afterChange(info?: LGraphNode): void {
        if (this.onAfterChange) {
            this.onAfterChange(this, info);
        }
        this.sendActionToCanvas("onAfterChange", [this]);
    }

    onConnectionChange?(node: LGraphNode): void;

    connectionChange(node: LGraphNode, linkInfo?: LLink): void {
        this.updateExecutionOrder();
        if (this.onConnectionChange) {
            this.onConnectionChange(node);
        }
        this._version++;
        this.sendActionToCanvas("onConnectionChange");
    }

    /** returns if the graph is in live mode */
    isLive(): boolean {
        if (!this.list_of_graphcanvas) {
            return false;
        }

        for (var i = 0; i < this.list_of_graphcanvas.length; ++i) {
            var c = this.list_of_graphcanvas[i];
            if (c.live_mode) {
                return true;
            }
        }
        return false;
    }

    /** clears the triggered slot animation in all links (stop visual animation) */
    clearTriggeredSlots(): void {
        for (var i in this.links) {
            var link_info = this.links[i];
            if (!link_info) {
                continue;
            }
            if (link_info._last_time) {
                link_info._last_time = 0;
            }
        }
    }

    onChange?(graph: LGraph): void;

    /* Called when something visually changed (not the graph!) */
    change(): void {
        if (LiteGraph.debug) {
            console.log("Graph changed");
        }
        this.sendActionToCanvas("setDirty", [true, true]);
        if (this.onChange) {
            this.onChange(this);
        }
    }

    setDirtyCanvas(fg: boolean = false, bg: boolean = false): void {
        this.sendActionToCanvas("setDirty", [fg, bg]);
    }

    /** Destroys a link */
    removeLink(linkId: LinkID): void {
        var link = this.links[linkId];
        if (!link) {
            return;
        }
        var node = this.getNodeById(link.target_id);
        if (node) {
            node.disconnectInput(link.target_slot);
        }
    }

    onSerialize?(data: SerializedLGraph): void;

    /** Creates a Object containing all the info about this graph, it can be serialized */
    serialize<T extends SerializedLGraph>(): T {
        var nodes_info = [];
        for (var i = 0, l = this._nodes.length; i < l; ++i) {
            nodes_info.push(this._nodes[i].serialize());
        }

        //pack link info into a non-verbose format
        var links = [];
        for (const i in this.links) {
            //links is an OBJECT
            var link = this.links[i];
            if (!link.serialize) {
                //weird bug I havent solved yet
                console.error(
                    "weird LLink bug, link info is not a LLink but a regular object",
                    link
                );
                var link2 = LLink.configure(link);
                for (var j in link) {
                    link2[j] = link[j];
                }
                this.links[i] = link2;
                link = link2;
            }

            links.push(link.serialize());
        }

        var groups_info = [];
        for (var i = 0; i < this._groups.length; ++i) {
            groups_info.push(this._groups[i].serialize());
        }

        var data: SerializedLGraph = {
            last_node_id: this.last_node_id,
            last_link_id: this.last_link_id,
            nodes: nodes_info,
            links: links,
            groups: groups_info,
            config: this.config,
            extra: this.extra,
            version: LiteGraph.VERSION
        };

        if (this.onSerialize)
            this.onSerialize(data);

        return data as T;
    }

    /**
     * Configure a graph from a JSON string
     * @param data configure a graph from a JSON string
     * @returns if there was any error parsing
     */
    configure(data: SerializedLGraph, keep_old?: boolean): boolean | undefined {
        if (!data) {
            return;
        }

        if (!keep_old) {
            this.clear();
        }

        var nodes = data.nodes;

        //decode links info (they are very verbose)
        if (data.links && data.links.constructor === Array) {
            var links = [];
            for (var i = 0; i < data.links.length; ++i) {
                var link_data = data.links[i];
                if (!link_data) //weird bug
                {
                    console.warn("serialized graph link data contains errors, skipping.");
                    continue;
                }
                var link = LLink.configure(link_data);
                links[link.id] = link;
            }
            data.links = links;
        }

        //copy all stored fields
        for (const i in data) {
            if (i == "nodes" || i == "groups") //links must be accepted
                continue;
            this[i] = data[i];
        }

        var error = false;

        //create nodes
        this._nodes = [];
        if (nodes) {
            for (var i = 0, l = nodes.length; i < l; ++i) {
                var n_info = nodes[i]; //stored info
                var node = LiteGraph.createNode(n_info.type, n_info.title);
                if (!node) {
                    console.error(
                        "Node not found or has errors: " + n_info.type
                    );

                    //in case of error we create a replacement node to avoid losing info
                    node = new LGraphNode();
                    node.last_serialization = n_info;
                    node.has_errors = true;
                    error = true;
                    //continue;
                }

                node.id = n_info.id; //id it or it will create a new id
                this.add(node, { addedBy: "configure", skipComputeOrder: true }); //add before configure, otherwise configure cannot create links
            }

            //configure nodes afterwards so they can reach each other
            for (var i = 0, l = nodes.length; i < l; ++i) {
                var n_info = nodes[i];
                var node = this.getNodeById(n_info.id);
                if (node) {
                    node.configure(n_info);
                }
            }
        }

        //groups
        this._groups.length = 0;
        if (data.groups) {
            for (var i = 0; i < data.groups.length; ++i) {
                var group = new LGraphGroup();
                group.configure(data.groups[i]);
                this.addGroup(group);
            }
        }

        this.updateExecutionOrder();

        this.extra = data.extra || {};

        if (this.onConfigure)
            this.onConfigure(data);

        this._version++;
        this.setDirtyCanvas(true, true);
        return error;
    }

    load(url: string, callback?: (any) => void): void {
        var that = this;

        //from file
        if (url.constructor === File || url.constructor === Blob) {
            var reader = new FileReader();
            reader.addEventListener('load', function(event) {
                var data = JSON.parse(reader.result as string);
                that.configure(data);
                if (callback)
                    callback(data);
            });

            reader.readAsText(url);
            return;
        }

        //is a string, then an URL
        var req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.send(null);
        req.onload = function(_oEvent) {
            if (req.status !== 200) {
                console.error("Error loading graph:", req.status, req.response);
                return;
            }
            var data = JSON.parse(req.response);
            that.configure(data);
            if (callback)
                callback(data);
        };
        req.onerror = function(err) {
            console.error("Error loading graph:", err);
        };
    }
}

import LiteGraph from "./LiteGraph";
import LGraphNode from "./LGraphNode";
import { SerializedLGraphNode, LGraphNodeConstructor } from "./LGraphNode";
import LGraphGroup from "./LGraphGroup";
import LGraphCanvas from "./LGraphCanvas";
import LLink from "./LLink";
import { default as INodeSlot, SlotIndex } from "./INodeSlot"
import { Version, LConnectionKind, NodeMode } from "./types";

export interface LGraphConfig {
    align_to_grid?: boolean;
    links_ontop?: boolean;
}

export type SerializedLGraph<
    TNode = ReturnType<LGraphNode["serialize"]>,
// https://github.com/jagenjo/litegraph.js/issues/74
TLink = [number, number, number, number, number, string],
TGroup = ReturnType<LGraphGroup["serialize"]>
    > = {
        last_node_id: LGraph["last_node_id"];
        last_link_id: LGraph["last_link_id"];
        nodes: TNode[];
        links: TLink[];
        groups: TGroup[];
        config: LGraph["config"];
        version: Version;
    };

export enum LGraphStatus {
    STATUS_STOPPED = 1,
    STATUS_RUNNING
}

export default class LGraph {
    static DEFAULT_SUPPORTED_TYPES: string[] = ["number", "string", "boolean"];
    supported_types: string[] | null = null;

    constructor(o?: object) {
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
    inputs: any;
    iteration: number;
    last_link_id: number;
    last_node_id: number;
    last_update_time: number;
    links: Record<number, LLink>;
    list_of_graphcanvas: LGraphCanvas[];
    outputs: any;
    runningtime: number;
    starttime: number;
    status: LGraphStatus;

    private _nodes: LGraphNode[] = [];
    private _groups: LGraphGroup[] = [];
    private _nodes_by_id: Record<number, LGraphNode> = {};
    /** nodes that are executable sorted in execution order */
    private _nodes_executable:
        | (LGraphNode & { onExecute: NonNullable<LGraphNode["onExecute"]> }[])
        | null = null;
    /** nodes that contain onExecute */
    private _nodes_in_order: LGraphNode[] = [];
    /** used to detect changes */
    private _version: number = -1;
    _last_trigger_time: number = 0;
    _subgraph_node: LGraphNode | null = null;

    getSupportedTypes(): string[] {
        return this.supported_types || LGraph.DEFAULT_SUPPORTED_TYPES;
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
        if (!(graphcanvas instanceof LGraphCanvas)) {
            throw "attachCanvas expects a LGraphCanvas instance";
        }
        if (graphcanvas.graph && graphcanvas.graph != this) {
            graphcanvas.graph.detachCanvas(graphcanvas);
        }

        graphcanvas.graph = this;

        if (!this.list_of_graphcanvas) {
            this.list_of_graphcanvas = [];
        }
        this.list_of_graphcanvas.push(graphcanvas);
    }

    /** Detach Canvas to this graph */
    detachCanvas(graphCanvas: LGraphCanvas): void {
        if (!this.list_of_graphcanvas) {
            return;
        }

        var pos = this.list_of_graphcanvas.indexOf(graphcanvas);
        if (pos == -1) {
            return;
        }
        graphcanvas.graph = null;
        this.list_of_graphcanvas.splice(pos, 1);
    }

    /**
     * Starts running this graph every interval milliseconds.
     * @param interval amount of milliseconds between executions, if 0 then it renders to the monitor refresh rate
     */
    start(interval?: number): void {
        if (this.status == LGraph.STATUS_RUNNING) {
            return;
        }
        this.status = LGraph.STATUS_RUNNING;

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
        if ( interval == 0 && typeof window != "undefined" && window.requestAnimationFrame ) {
            function on_frame() {
                if (that.execution_timer_id != -1) {
                    return;
                }
                window.requestAnimationFrame(on_frame);
				if(that.onBeforeStep)
					that.onBeforeStep();
                that.runStep(1, !that.catch_errors);
				if(that.onAfterStep)
					that.onAfterStep();
            }
            this.execution_timer_id = -1;
            on_frame();
        } else { //execute every 'interval' ms
            this.execution_timer_id = setInterval(function() {
                //execute
				if(that.onBeforeStep)
					that.onBeforeStep();
                that.runStep(1, !that.catch_errors);
				if(that.onAfterStep)
					that.onAfterStep();
            }, interval);
        }
    }

    /** Stops the execution loop of the graph */
    stop(): void {
        if (this.status == LGraph.STATUS_STOPPED) {
            return;
        }

        this.status = LGraph.STATUS_STOPPED;

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
    runStep(num: number = 1, do_not_catch_errors: boolean = false): void {
        var start = LiteGraph.getTime();
        this.globaltime = 0.001 * (start - this.starttime);

        var nodes = this._nodes_executable
            ? this._nodes_executable
            : this._nodes;
        if (!nodes) {
            return;
        }

		limit = limit || nodes.length;

        if (do_not_catch_errors) {
            //iterations
            for (var i = 0; i < num; i++) {
                for (var j = 0; j < limit; ++j) {
                    var node = nodes[j];
                    if (node.mode == LiteGraph.ALWAYS && node.onExecute) {
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
                        if (node.mode == LiteGraph.ALWAYS && node.onExecute) {
                            node.onExecute();
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
                this._nodes_executable.push(this._nodes_in_order[i]);
            }
        }
    }

    /** This is more internal, it computes the executable nodes in order and returns it */
    computeExecutionOrder<T = any>(only_onExecute: boolean, set_level: any): T {
        var L = [];
        var S = [];
        var M = {};
        var visited_links = {}; //to avoid repeating links
        var remaining_links = {}; //to a

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
            var node = S.shift();
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
                    var link_id = output.links[j];
                    var link = this.links[link_id];
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
        for (var i in M) {
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
            var Ap = A.constructor.priority || A.priority || 0;
            var Bp = B.constructor.priority || B.priority || 0;
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
    arrange(margin: number = 100, layout?: string): void {
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
                node.pos[0] = (layout == LiteGraph.VERTICAL_LAYOUT) ? y : x;
                node.pos[1] = (layout == LiteGraph.VERTICAL_LAYOUT) ? x : y;
                const max_size_index = (layout == LiteGraph.VERTICAL_LAYOUT) ? 1 : 0;
                if (node.size[max_size_index] > max_size) {
                    max_size = node.size[max_size_index];
                }
                const node_size_index = (layout == LiteGraph.VERTICAL_LAYOUT) ? 0 : 1;
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
     * Sends an event to all the nodes, useful to trigger stuff
     * @param eventName the name of the event (function to be called)
     * @param params parameters in array format
     */
    sendEventToAllNodes(eventName: string, params: any[], mode: NodeMode = NodeMode.ALWAYS): void {
        var nodes = this._nodes_in_order ? this._nodes_in_order : this._nodes;
        if (!nodes) {
            return;
        }

        for (var j = 0, l = nodes.length; j < l; ++j) {
            var node = nodes[j];

            // TODO subgraph
            /*
            if (
                node instanceof LiteGraph.Subgraph &&
                eventName != "onExecute"
            ) {
                if (node.mode == mode) {
                    node.sendEventToAllNodes(eventname, params, mode);
                }
                continue;
            }
            */

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


    sendActionToCanvas(action: any, params: any[]): void {
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

    /**
     * Adds a new node instance to this graph
     * @param node the instance of the node
     */
    add(node: LGraphNode | LGraphGroup, skip_compute_order: boolean = false): void {
        if (node instanceof LGraphGroup) {
            this._groups.push(node);
            this.setDirtyCanvas(true);
            this.change();
            node.graph = this;
            this._version++;
            return;
        }

        //nodes
        if (node.id != -1 && this._nodes_by_id[node.id] != null) {
            console.warn(
                "LiteGraph: there is already a node with this ID, changing it"
            );
            node.id = ++this.last_node_id;
        }

        if (this._nodes.length >= LiteGraph.MAX_NUMBER_OF_NODES) {
            throw "LiteGraph: max number of nodes in a graph reached";
        }

        //give him an id
        if (node.id == null || node.id == -1) {
            node.id = ++this.last_node_id;
        } else if (this.last_node_id < node.id) {
            this.last_node_id = node.id;
        }

        node.graph = this;
        this._version++;

        this._nodes.push(node);
        this._nodes_by_id[node.id] = node;

        if (node.onAdded) {
            node.onAdded(this);
        }

        if (this.config.align_to_grid) {
            node.alignToGrid();
        }

        if (!skip_compute_order) {
            this.updateExecutionOrder();
        }

        if (this.onNodeAdded) {
            this.onNodeAdded(node);
        }

        this.setDirtyCanvas(true);
        this.change();

        return node; //to chain actions
    }

    /**
     * Called before the graph is changed
     */
    onBeforeChange(graph: LGraph, info: any): void {
    }

    /**
     * Called after the graph is changed
     */
    onAfterChange(graph: LGraph, info: any): void {
    }

    /**
     * Called when a new node is added
     * @param node the instance of the node
     */
    onNodeAdded(node: LGraphNode): void {
    }

    /**
     * Called when a node is removed
     * @param node the instance of the node
     */
    onNodeRemoved(node: LGraphNode): void {
    }

    /**
     * Called when a node's connection is changed
     * @param node the instance of the node
     */
    onNodeConnectionChange(kind: LConnectionKind,
                           node: LGraphNode,
                           slot: SlotIndex,
                           target_node: LGraphNode,
                           target_slot: SlotIndex): void {
    }

    /** Called by `LGraph.configure` */
    onConfigure?(o: SerializedLGraphNode): void {
    }

    /** Removes a node from the graph */
    remove(node: LGraphNode): void {
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
            node.onRemoved();
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
            this.onNodeRemoved(node);
        }

		//close panels
		this.sendActionToCanvas("checkPanels");

        this.setDirtyCanvas(true, true);
		this.afterChange(); //sure? - almost sure is wrong
        this.change();

        this.updateExecutionOrder();
    }

    /** Returns a node by its id. */
    getNodeById(id: number): LGraphNode | null {
        if (id == null) {
            return null;
        }
        return this._nodes_by_id[id];
    }

    /**
     * Returns a list of nodes that matches a class
     * @param classObject the class itself (not an string)
     * @return a list with all the nodes of this type
     */
    findNodesByClass<T extends LGraphNode>(classObject: LGraphNodeConstructor<T>, result: T[] = []): T[] {
        result.length = 0;
        for (var i = 0, l = this._nodes.length; i < l; ++i) {
            if (this._nodes[i] instanceof T) {
                result.push(this._nodes[i] as T);
            }
        }
        return result;
    }

    /**
     * Returns a list of nodes that matches a type
     * @param type the name of the node type
     * @return a list with all the nodes of this type
     */
    findNodesByType<T extends LGraphNode = LGraphNode>(type: string): T[] {
    }

    /**
     * Returns the first node that matches a name in its title
     * @param title the name of the node to search
     * @return the node or null
     */
    findNodeByTitle<T extends LGraphNode = LGraphNode>(title: string): T | null {
    }

    /**
     * Returns a list of nodes that matches a name
     * @param title the name of the node to search
     * @return a list with all the nodes with this name
     */
    findNodesByTitle<T extends LGraphNode = LGraphNode>(title: string): T[] {
    }

    /**
     * Returns the top-most node in this position of the canvas
     * @param x the x coordinate in canvas space
     * @param y the y coordinate in canvas space
     * @param nodes_list a list with all the nodes to search from, by default is all the nodes in the graph
     * @return the node at this position or null
     */
    getNodeOnPos<T extends LGraphNode = LGraphNode>(
        x: number,
        y: number,
        node_list?: LGraphNode[],
        margin?: number
    ): T | null {
    }

    /**
     * Returns the top-most group in that position
     * @param x the x coordinate in canvas space
     * @param y the y coordinate in canvas space
     * @return the group or null
     */
    getGroupOnPos(x: number, y: number): LGraphGroup | null {
    }


    onAction(action: any, param: any): void {
    }

    trigger(action: any, param: any): void {
    }

    /** Tell this graph it has a global graph input of this type */
    addInput(name: string, type: string, value?: any): void {
    }

    /** Assign a data to the global graph input */
    setInputData(name: string, data: any): void {
    }

    /** Returns the current value of a global graph input */
    getInputData<T = any>(name: string): T {
    }

    /** Changes the name of a global graph input */
    renameInput(old_name: string, name: string): false | undefined {
    }

    /** Changes the type of a global graph input */
    changeInputType(name: string, type: string): false | undefined {
    }

    /** Removes a global graph input */
    removeInput(name: string): boolean {
    }

    /** Creates a global graph output */
    addOutput(name: string, type: string, value: any): void {
    }

    /** Assign a data to the global output */
    setOutputData(name: string, value: string): void {
    }

    /** Returns the current value of a global graph output */
    getOutputData<T = any>(name: string): T {
    }


    /** Renames a global graph output */
    renameOutput(old_name: string, name: string): false | undefined {
    }

    /** Changes the type of a global graph output */
    changeOutputType(name: string, type: string): false | undefined {
    }

    /** Removes a global graph output */
    removeOutput(name: string): boolean {
    }

    triggerInput(name: string, value: any): void {
    }

    setCallback(name: string, func: (...args: any[]) => any): void {
    }

    beforeChange(info?: LGraphNode): void {
    }

    afterChange(info?: LGraphNode): void {
    }

    connectionChange(node: LGraphNode, linkInfo?: LLink): void {
    }

    /** returns if the graph is in live mode */
    isLive(): boolean {
    }

    /** clears the triggered slot animation in all links (stop visual animation) */
    clearTriggeredSlots(): void {
    }

    /* Called when something visually changed (not the graph!) */
    change(): void {
    }

    setDirtyCanvas(fg: boolean = false, bg: boolean = false): void {
    }

    /** Destroys a link */
    removeLink(link_id: number): void {
    }

    /** Creates a Object containing all the info about this graph, it can be serialized */
    serialize<T extends SerializedLGraph>(): T {
    }

    /**
     * Configure a graph from a JSON string
     * @param data configure a graph from a JSON string
     * @returns if there was any error parsing
     */
    configure(data: object, keep_old?: boolean): boolean | undefined {
    }

    load(url: string): void {
    }

}

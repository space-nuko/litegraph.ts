import type { IContextMenuItem } from "../../ContextMenu";
import type { MouseEventExt } from "../../DragAndScale";
import type { INumberWidget } from "../../IWidget";
import LGraph from "../../LGraph";
import type LGraphCanvas from "../../LGraphCanvas";
import type { PropertyLayout, SlotLayout } from "../../LGraphNode";
import LGraphNode from "../../LGraphNode";
import LiteGraph from "../../LiteGraph";
import { BuiltInSlotShape, type NodeMode, type Vector2 } from "../../types";

export interface SubgraphProperties extends Record<string, any> {
    enabled: boolean
}

export default class Subgraph extends LGraphNode {
    override properties: SubgraphProperties = {
        enabled: true
    }

    static slotLayout: SlotLayout = {
        inputs: [
            { name: "enabled", type: "boolean" }
        ],
        outputs: []
    }

    static propertyLayout: PropertyLayout = [
        { name: "enabled", defaultValue: true }
    ]

    override size: Vector2 = [140, 80];

    enabled: boolean = true;
    subgraph: LGraph;

    constructor(title?: string) {
        super(title)
        this.subgraph = new LGraph();
        this.subgraph._subgraph_node = this;
        this.subgraph._is_subgraph = true;

        this.subgraph.onTrigger = this.onSubgraphTrigger.bind(this);

		//nodes input node added inside
        this.subgraph.onInputAdded = this.onSubgraphNewInput.bind(this);
        this.subgraph.onInputRenamed = this.onSubgraphRenamedInput.bind(this);
        this.subgraph.onInputTypeChanged = this.onSubgraphTypeChangeInput.bind(this);
        this.subgraph.onInputRemoved = this.onSubgraphRemovedInput.bind(this);

        this.subgraph.onOutputAdded = this.onSubgraphNewOutput.bind(this);
        this.subgraph.onOutputRenamed = this.onSubgraphRenamedOutput.bind(this);
        this.subgraph.onOutputTypeChanged = this.onSubgraphTypeChangeOutput.bind(this);
        this.subgraph.onOutputRemoved = this.onSubgraphRemovedOutput.bind(this);
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
        if (this.flags.collapsed)
            return;
        var y = this.size[1] - LiteGraph.NODE_TITLE_HEIGHT + 0.5;
        // button
        var over = LiteGraph.isInsideRectangle(pos[0], pos[1], this.pos[0], this.pos[1] + y, this.size[0], LiteGraph.NODE_TITLE_HEIGHT);
        let overleft = LiteGraph.isInsideRectangle(pos[0], pos[1], this.pos[0], this.pos[1] + y, this.size[0] / 2, LiteGraph.NODE_TITLE_HEIGHT)
        ctx.fillStyle = over ? "#555" : "#222";
        ctx.beginPath();
        if (this.shape == BuiltInSlotShape.BOX_SHAPE) {
            if (overleft) {
                ctx.rect(0, y, this.size[0] / 2 + 1, LiteGraph.NODE_TITLE_HEIGHT);
            } else {
                ctx.rect(this.size[0] / 2, y, this.size[0] / 2 + 1, LiteGraph.NODE_TITLE_HEIGHT);
            }
        }
        else {
            if (overleft) {
                ctx.roundRect(0, y, this.size[0] / 2 + 1, LiteGraph.NODE_TITLE_HEIGHT, [0,0, 8,8]);
            } else {
                ctx.roundRect(this.size[0] / 2, y, this.size[0] / 2 + 1, LiteGraph.NODE_TITLE_HEIGHT, [0,0, 8,8]);
            }
        }
        if (over) {
            ctx.fill();
        } else {
            ctx.fillRect(0, y, this.size[0] + 1, LiteGraph.NODE_TITLE_HEIGHT);
        }
        // button
        ctx.textAlign = "center";
        ctx.font = "24px Arial";
        ctx.fillStyle = over ? "#DDD" : "#999";
        ctx.fillText("+", this.size[0] * 0.25, y + 24);
        ctx.fillText("+", this.size[0] * 0.75, y + 24);
    }

    // override onMouseDown(e, localpos, graphcanvas)
    // {
    // 	var y = this.size[1] - LiteGraph.NODE_TITLE_HEIGHT + 0.5;
    // 	if(localpos[1] > y)
    // 	{
    // 		graphcanvas.showSubgraphPropertiesDialog(this);
    // 	}
    // }

    override onMouseDown (e: MouseEventExt, localpos: Vector2, graphcanvas: LGraphCanvas): boolean | undefined {
        var y = this.size[1] - LiteGraph.NODE_TITLE_HEIGHT + 0.5;
        console.log(0)
        if (localpos[1] > y) {
            if (localpos[0] < this.size[0] / 2) {
                console.log(1)
                graphcanvas.showSubgraphPropertiesDialog(this);
            } else {
                console.log(2)
                graphcanvas.showSubgraphPropertiesDialogRight(this);
            }
        }
        return false;
    }

	override computeSize(): Vector2 {
		var num_inputs = this.inputs ? this.inputs.length : 0;
		var num_outputs = this.outputs ? this.outputs.length : 0;
		return [ 200, Math.max(num_inputs,num_outputs) * LiteGraph.NODE_SLOT_HEIGHT + LiteGraph.NODE_TITLE_HEIGHT ];
	}

    //**** INPUTS ***********************************
    onSubgraphTrigger(event, param) {
        var slot = this.findOutputSlotIndexByName(event);
        if (slot != -1) {
            this.triggerSlot(slot);
        }
    };

    onSubgraphNewInput(name, type) {
        var slot = this.findInputSlotIndexByName(name);
        if (slot == -1) {
            //add input to the node
            this.addInput(name, type);
        }
    };

    onSubgraphRenamedInput(oldname, name) {
        var slot = this.findInputSlotIndexByName(oldname);
        if (slot == -1) {
            return;
        }
        var info = this.getInputInfo(slot);
        info.name = name;
    };

    onSubgraphTypeChangeInput(name, type) {
        var slot = this.findInputSlotIndexByName(name);
        if (slot == -1) {
            return;
        }
        var info = this.getInputInfo(slot);
        info.type = type;
    };

    onSubgraphRemovedInput(name) {
        var slot = this.findInputSlotIndexByName(name);
        if (slot == -1) {
            return;
        }
        this.removeInput(slot);
    };

    //**** OUTPUTS ***********************************
    onSubgraphNewOutput(name, type) {
        var slot = this.findOutputSlotIndexByName(name);
        if (slot == -1) {
            this.addOutput(name, type);
        }
    };

    onSubgraphRenamedOutput(oldname, name) {
        var slot = this.findOutputSlotIndexByName(oldname);
        if (slot == -1) {
            return;
        }
        var info = this.getOutputInfo(slot);
        info.name = name;
    };

    onSubgraphTypeChangeOutput(name, type) {
        var slot = this.findOutputSlotIndexByName(name);
        if (slot == -1) {
            return;
        }
        var info = this.getOutputInfo(slot);
        info.type = type;
    };

    onSubgraphRemovedOutput(name) {
        var slot = this.findInputSlotIndexByName(name);
        if (slot == -1) {
            return;
        }
        this.removeOutput(slot);
    };
    // *****************************************************

    override getExtraMenuOptions(graphCanvas: LGraphCanvas, options: IContextMenuItem[]): IContextMenuItem[] {
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

    override clone() {
        var node = LiteGraph.createNode(this.typeName);
        var data = this.serialize();
        delete data["id"];
        delete data["inputs"];
        delete data["outputs"];
        node.configure(data);
        return node;
    };

	buildFromNodes(nodes) {
		//clear all?
		//TODO

		//nodes that connect data between parent graph and subgraph
		var subgraph_inputs = [];
		var subgraph_outputs = [];

		//mark inner nodes
		var ids = {};
		var min_x = 0;
		var max_x = 0;
		for(var i = 0; i < nodes.length; ++i)
		{
			var node = nodes[i];
			ids[ node.id ] = node;
			min_x = Math.min( node.pos[0], min_x );
			max_x = Math.max( node.pos[0], min_x );
		}

		var last_input_y = 0;
		var last_output_y = 0;

		for(var i = 0; i < nodes.length; ++i)
		{
			var node = nodes[i];
			//check inputs
			if( node.inputs )
				for(var j = 0; j < node.inputs.length; ++j)
				{
					var input = node.inputs[j];
					if( !input || !input.link )
						continue;
					var link = node.graph.links[ input.link ];
					if(!link)
						continue;
					if( ids[ link.origin_id ] )
						continue;
					//this.addInput(input.name,link.type);
					this.subgraph.addInput(input.name,link.type);
					/*
					var input_node = LiteGraph.createNode("graph/input");
					this.subgraph.add( input_node );
					input_node.pos = [min_x - 200, last_input_y ];
					last_input_y += 100;
					*/
				}

			//check outputs
			if( node.outputs )
				for(var j = 0; j < node.outputs.length; ++j)
				{
					var output = node.outputs[j];
					if( !output || !output.links || !output.links.length )
						continue;
					var is_external = false;
					for(var k = 0; k < output.links.length; ++k)
					{
						var link = node.graph.links[ output.links[k] ];
						if(!link)
							continue;
						if( ids[ link.target_id ] )
							continue;
						is_external = true;
						break;
					}
					if(!is_external)
						continue;
					//this.addOutput(output.name,output.type);
					/*
					var output_node = LiteGraph.createNode("graph/output");
					this.subgraph.add( output_node );
					output_node.pos = [max_x + 50, last_output_y ];
					last_output_y += 100;
					*/
				}
		}

		//detect inputs and outputs
			//split every connection in two data_connection nodes
			//keep track of internal connections
			//connect external connections

		//clone nodes inside subgraph and try to reconnect them

		//connect edge subgraph nodes to extarnal connections nodes
	}
}

LiteGraph.registerNodeType({
    type: Subgraph,
    title: "Graph inside a node",
    title_color: "#334",
    desc: "Constant number",
    typeName: "basic/number"
})

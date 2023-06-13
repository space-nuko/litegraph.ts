import type LGraph from "./LGraph";
import LGraphCanvas from "./LGraphCanvas";
import LGraphNode from "./LGraphNode";
import LiteGraph from "./LiteGraph";
import LLink from "./LLink";
import GraphInput from "./nodes/GraphInput";
import { BuiltInSlotShape, BuiltInSlotType, Dir, TitleMode, NODE_MODE_NAMES, NODE_MODE_COLORS, LinkRenderMode } from "./types";
import type { Vector2 } from "./types"
import { getLitegraphTypeName } from "./utils";

export default class LGraphCanvas_Rendering {
    onRender?(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;

    /** changes the zoom level of the graph (default is 1), you can pass also a place used to pivot the zoom */
    setZoom(this: LGraphCanvas, value: number, center: Vector2): void {
        this.ds.changeScale(value, center);

        if (this.maxZoom && this.ds.scale > this.maxZoom)
            this.scale = this.maxZoom;
        else if (this.minZoom && this.ds.scale < this.minZoom)
            this.scale = this.minZoom;
    }

    /** brings a node to front (above all other nodes) */
    bringToFront(this: LGraphCanvas, node: LGraphNode): void {
        var i = (this.graph as any)._nodes.indexOf(node);
        if (i == -1) {
            return;
        }

        (this.graph as any)._nodes.splice(i, 1);
        (this.graph as any)._nodes.push(node);
    }

    /** sends a node to the back (below all other nodes) */
    sendToBack(this: LGraphCanvas, node: LGraphNode): void {
        var i = (this.graph as any)._nodes.indexOf(node);
        if (i == -1) {
            return;
        }

        (this.graph as any)._nodes.splice(i, 1);
        (this.graph as any)._nodes.unshift(node);
    }

    private static temp = new Float32Array(4);

    /** checks which nodes are visible (inside the camera area) */
    computeVisibleNodes(this: LGraphCanvas, nodes: LGraphNode[], out: LGraphNode[] = []): LGraphNode[] {
        var visible_nodes = out;
        visible_nodes.length = 0;
        nodes = nodes || (this.graph as any)._nodes;
        for (var i = 0, l = nodes.length; i < l; ++i) {
            var n = nodes[i];

            //skip rendering nodes in live mode
            if (this.live_mode && !n.onDrawBackground && !n.onDrawForeground) {
                continue;
            }

            if (!LiteGraph.overlapBounding(this.visible_area, n.getBounding(LGraphCanvas_Rendering.temp))) {
                continue;
            } //out of the visible area

            visible_nodes.push(n);
        }
        return visible_nodes;
    }

    /** renders the whole canvas content, by rendering in two separated canvas, one containing the background grid and the connections, and one containing the nodes) */
    draw(this: LGraphCanvas, forceFG: boolean = false, forceBG: boolean = false): void {
        if (!this.canvas || this.canvas.width == 0 || this.canvas.height == 0) {
            return;
        }

        //fps counting
        var now = LiteGraph.getTime();
        this.render_time = (now - this.last_draw_time) * 0.001;
        this.last_draw_time = now;

        if (this.graph) {
            this.ds.computeVisibleArea(this.viewport);
        }

        if (
            this.dirty_bgcanvas ||
            forceBG ||
            this.always_render_background ||
            (this.graph &&
                this.graph._last_trigger_time &&
                now - this.graph._last_trigger_time < 1000)
        ) {
            this.drawBackCanvas();
        }

        if (this.dirty_canvas || forceFG) {
            this.drawFrontCanvas();
        }

        this.fps = this.render_time ? 1.0 / this.render_time : 0;
        this.frame += 1;
    }

    /** draws the front canvas (the one containing all the nodes) */
    drawFrontCanvas(this: LGraphCanvas): void {
        this.dirty_canvas = false;

        if (!this.ctx) {
            this.ctx = this.canvas.getContext("2d");
        }
        var ctx = this.ctx;
        if (!ctx) {
            //maybe is using webgl...
            return;
        }

        var canvas = this.canvas;
        // if ( ctx.start2D && !this.viewport ) {
        //     ctx.start2D();
        // 	ctx.restore();
        // 	ctx.setTransform(1, 0, 0, 1, 0, 0);
        // }

        //clip dirty area if there is one, otherwise work in full canvas
        var area = this.viewport || this.dirty_area;
        if (area) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(area[0], area[1], area[2], area[3]);
            ctx.clip();
        }

        //clear
        //canvas.width = canvas.width;
        if (this.clear_background) {
            if (area)
                ctx.clearRect(area[0], area[1], area[2], area[3]);
            else
                ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        //draw bg canvas
        if (this.bgcanvas == this.canvas) {
            this.drawBackCanvas();
        } else {
            ctx.drawImage(this.bgcanvas, 0, 0);
        }

        //rendering
        if (this.onRender) {
            this.onRender(canvas, ctx);
        }

        //info widget
        if (this.show_info) {
            this.renderInfo(ctx, area ? area[0] : 0, area ? area[1] : 0);
        }

        if (this.graph) {
            //apply transformations
            ctx.save();
            this.ds.toCanvasContext(ctx);

            //draw nodes
            var drawn_nodes = 0;
            var visible_nodes = this.computeVisibleNodes(
                null,
                this.visible_nodes
            );

            for (var i = 0; i < visible_nodes.length; ++i) {
                var node = visible_nodes[i];

                //transform coords system
                ctx.save();
                ctx.translate(node.pos[0], node.pos[1]);

                //Draw
                this.drawNode(node, ctx);
                drawn_nodes += 1;

                //Restore
                ctx.restore();
            }

            //on top (debug)
            if (this.render_execution_order) {
                this.drawExecutionOrder(ctx);
            }

            //connections ontop?
            if (this.graph.config.links_ontop) {
                if (!this.live_mode) {
                    this.drawConnections(ctx);
                }
            }

            //current connection (the one being dragged by the mouse)
            if (this.connecting_pos != null) {
                ctx.lineWidth = this.connections_width;
                var link_color = null;

                var connInOrOut = this.connecting_output || this.connecting_input;

                var connType = connInOrOut.type;
                var connDir = connInOrOut.dir;
                if (connDir == null) {
                    if (this.connecting_output)
                        connDir = this.connecting_node.horizontal ? Dir.DOWN : Dir.RIGHT;
                    else
                        connDir = this.connecting_node.horizontal ? Dir.UP : Dir.LEFT;
                }
                var connShape = connInOrOut.shape;

                switch (connType) {
                    case BuiltInSlotType.EVENT:
                        link_color = LiteGraph.EVENT_LINK_COLOR;
                        break;
                    default:
                        link_color = LiteGraph.CONNECTING_LINK_COLOR;
                }

                //the connection being dragged by the mouse
                this.renderLink(
                    ctx,
                    this.connecting_pos,
                    [this.graph_mouse[0], this.graph_mouse[1]],
                    null,
                    false,
                    null,
                    link_color,
                    connDir,
                    Dir.CENTER
                );

                ctx.beginPath();
                if (connShape === BuiltInSlotShape.BOX_SHAPE) {
                    ctx.rect(
                        this.connecting_pos[0] - 6 + 0.5,
                        this.connecting_pos[1] - 5 + 0.5,
                        14,
                        10
                    );
                    ctx.fill();
                    ctx.beginPath();
                    ctx.rect(
                        this.graph_mouse[0] - 6 + 0.5,
                        this.graph_mouse[1] - 5 + 0.5,
                        14,
                        10
                    );
                } else if (connShape === BuiltInSlotShape.ARROW_SHAPE) {
                    ctx.moveTo(this.connecting_pos[0] + 8, this.connecting_pos[1] + 0.5);
                    ctx.lineTo(this.connecting_pos[0] - 4, this.connecting_pos[1] + 6 + 0.5);
                    ctx.lineTo(this.connecting_pos[0] - 4, this.connecting_pos[1] - 6 + 0.5);
                    ctx.closePath();
                }
                else {
                    ctx.arc(
                        this.connecting_pos[0],
                        this.connecting_pos[1],
                        4,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(
                        this.graph_mouse[0],
                        this.graph_mouse[1],
                        4,
                        0,
                        Math.PI * 2
                    );
                }
                ctx.fill();

                ctx.fillStyle = "#ffcc00";
                if (this._highlight_input) {
                    ctx.beginPath();
                    var shape = this._highlight_input_slot.shape;
                    if (shape === BuiltInSlotShape.ARROW_SHAPE) {
                        ctx.moveTo(this._highlight_input[0] + 8, this._highlight_input[1] + 0.5);
                        ctx.lineTo(this._highlight_input[0] - 4, this._highlight_input[1] + 6 + 0.5);
                        ctx.lineTo(this._highlight_input[0] - 4, this._highlight_input[1] - 6 + 0.5);
                        ctx.closePath();
                    } else {
                        ctx.arc(
                            this._highlight_input[0],
                            this._highlight_input[1],
                            6,
                            0,
                            Math.PI * 2
                        );
                    }
                    ctx.fill();
                }
                if (this._highlight_output) {
                    ctx.beginPath();
                    if (shape === BuiltInSlotShape.ARROW_SHAPE) {
                        ctx.moveTo(this._highlight_output[0] + 8, this._highlight_output[1] + 0.5);
                        ctx.lineTo(this._highlight_output[0] - 4, this._highlight_output[1] + 6 + 0.5);
                        ctx.lineTo(this._highlight_output[0] - 4, this._highlight_output[1] - 6 + 0.5);
                        ctx.closePath();
                    } else {
                        ctx.arc(
                            this._highlight_output[0],
                            this._highlight_output[1],
                            6,
                            0,
                            Math.PI * 2
                        );
                    }
                    ctx.fill();
                }
            }

            //the selection rectangle
            if (this.dragging_rectangle) {
                ctx.strokeStyle = "#FFF";
                ctx.strokeRect(
                    this.dragging_rectangle[0],
                    this.dragging_rectangle[1],
                    this.dragging_rectangle[2],
                    this.dragging_rectangle[3]
                );
            }

            //on top of link center
            if (this.over_link_center && this.render_link_tooltip)
                this.drawLinkTooltip(ctx, this.over_link_center);
            else
                if (this.onDrawLinkTooltip) //to remove
                    this.onDrawLinkTooltip(ctx, null, this);

            //custom info
            if (this.onDrawForeground) {
                this.onDrawForeground(ctx, this.visible_area);
            }

            ctx.restore();
        }

        //draws panel in the corner
        if (this._graph_stack && this._graph_stack.length && this.render_subgraph_panels) {
            this.drawSubgraphPanel(ctx);
        }


        if (this.onDrawOverlay) {
            this.onDrawOverlay(ctx);
        }

        if (area) {
            ctx.restore();
        }

        // if (ctx.finish2D) {
        //     //this is a function I use in webgl renderer
        //     ctx.finish2D();
        // }
    }

    /**
     * draws the panel in the corner that shows subgraph properties
     * @method drawSubgraphPanel
     **/
    drawSubgraphPanel(this: LGraphCanvas, ctx: CanvasRenderingContext2D) {
        var subgraph = this.graph;
        var subnode = subgraph._subgraph_node;
        if (!subnode) {
            console.warn("subgraph without subnode");
            return;
        }
        this.drawSubgraphPanelLeft(subgraph, subnode, ctx)
        this.drawSubgraphPanelRight(subgraph, subnode, ctx)
    }

    drawSubgraphPanelLeft(this: LGraphCanvas, subgraph: LGraph, subnode: LGraphNode, ctx: CanvasRenderingContext2D) {
        var num = subnode.inputs ? subnode.inputs.length : 0;
        var w = 200;
        var h = Math.floor(LiteGraph.NODE_SLOT_HEIGHT * 1.6);

        ctx.fillStyle = "#111";
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.roundRect(10, 10, w, (num + 1) * h + 50, [8]);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#888";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Graph Inputs", 20, 34);
        // var pos = this.mouse;

        if (this.drawButton(w - 20, 20, 20, 20, "X", "#151515", undefined, undefined, true)) {
            this.closeSubgraph();
            return;
        }

        var y = 50;
        ctx.font = "14px Arial";
        if (subnode.inputs)
            for (var i = 0; i < subnode.inputs.length; ++i) {
                var input = subnode.inputs[i];
                if (input.not_subgraph_input)
                    continue;

                ctx.fillStyle = "#9C9";
                ctx.beginPath();
                ctx.arc(w - 16, y, 5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = "#AAA";
                ctx.fillText(input.name, 30, y + h * 0.75);
                // var tw = ctx.measureText(input.name);
                ctx.fillStyle = "#777";
                ctx.fillText(getLitegraphTypeName(input.type), 130, y + h * 0.75);
                y += h;
            }
        //add + button
        if (this.drawButton(20, y + 2, w - 20, h - 2, "+", "#151515", "#222")) {
            this.showSubgraphPropertiesDialog(subnode);
        }
    }

    drawSubgraphPanelRight(this: LGraphCanvas, subgraph: LGraph, subnode: LGraphNode, ctx: CanvasRenderingContext2D) {
        var num = subnode.outputs ? subnode.outputs.length : 0;
        var canvas_w = this.bgcanvas.width
        var w = 200;
        var h = Math.floor(LiteGraph.NODE_SLOT_HEIGHT * 1.6);

        ctx.fillStyle = "#111";
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.roundRect(canvas_w - w - 10, 10, w, (num + 1) * h + 50, [8]);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#888";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        var title_text = "Graph Outputs"
        var tw = ctx.measureText(title_text).width
        ctx.fillText(title_text, (canvas_w - tw) - 20, 34);
        // var pos = this.mouse;
        if (this.drawButton(canvas_w - w, 20, 20, 20, "X", "#151515", undefined, undefined, true)) {
            this.closeSubgraph();
            return;
        }

        var y = 50;
        ctx.font = "14px Arial";
        if (subnode.outputs)
            for (var i = 0; i < subnode.outputs.length; ++i) {
                var output = subnode.outputs[i];
                if (output.not_subgraph_output)
                    continue;

                ctx.fillStyle = "#9C9";
                ctx.beginPath();
                ctx.arc(canvas_w - w + 16, y, 5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = "#AAA";
                ctx.fillText(output.name, canvas_w - w + 30, y + h * 0.75);
                // var tw = ctx.measureText(input.name);
                ctx.fillStyle = "#777";
                ctx.fillText(getLitegraphTypeName(output.type), canvas_w - w + 130, y + h * 0.75);
                y += h;
            }
        //add + button
        if (this.drawButton(canvas_w - w, y + 2, w - 20, h - 2, "+", "#151515", "#222")) {
            this.showSubgraphPropertiesDialogRight(subnode);
        }
    }
    //Draws a button into the canvas overlay and computes if it was clicked using the immediate gui paradigm
    drawButton(this: LGraphCanvas,
        x: number, y: number, w: number, h: number,
        text?: string,
        bgcolor: string = LiteGraph.NODE_DEFAULT_COLOR,
        hovercolor: string = "#555",
        textcolor: string = LiteGraph.NODE_TEXT_COLOR,
        ignore_readonly: boolean = false): boolean {
        const can_interact = !this.block_click && (ignore_readonly || (this.allow_interaction && !this.read_only))
        var ctx = this.ctx;
        var pos = this.offset_mouse;
        var hover = can_interact && LiteGraph.isInsideRectangle(pos[0], pos[1], x, y, w, h);
        pos = this.last_click_position_offset;
        var clicked = can_interact && pos && this.pointer_is_down && LiteGraph.isInsideRectangle(pos[0], pos[1], x, y, w, h);

        ctx.fillStyle = hover ? hovercolor : bgcolor;
        if (clicked)
            ctx.fillStyle = "#AAA";
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, [4]);
        ctx.fill();

        if (text != null) {
            if (text.constructor == String) {
                ctx.fillStyle = textcolor;
                ctx.textAlign = "center";
                ctx.font = ((h * 0.65) | 0) + "px Arial";
                ctx.fillText(text, x + w * 0.5, y + h * 0.75);
                ctx.textAlign = "left";
            }
        }

        var was_clicked = clicked && can_interact;
        if (clicked)
            this.blockClick();
        return was_clicked;
    }

    /** draws every group area in the background */
    drawGroups(this: LGraphCanvas, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        if (!this.graph) {
            return;
        }

        var groups = (this.graph as any)._groups;

        ctx.save();
        ctx.globalAlpha = 0.5 * this.editor_alpha;

        for (var i = 0; i < groups.length; ++i) {
            var group = groups[i];

            if (!LiteGraph.overlapBounding(this.visible_area, group._bounding)) {
                continue;
            } //out of the visible area

            ctx.fillStyle = group.color || "#335";
            ctx.strokeStyle = group.color || "#335";
            var pos = group._pos;
            var size = group._size;
            ctx.globalAlpha = 0.25 * this.editor_alpha;
            ctx.beginPath();
            ctx.rect(pos[0] + 0.5, pos[1] + 0.5, size[0], size[1]);
            ctx.fill();
            ctx.globalAlpha = this.editor_alpha;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(pos[0] + size[0], pos[1] + size[1]);
            ctx.lineTo(pos[0] + size[0] - 10, pos[1] + size[1]);
            ctx.lineTo(pos[0] + size[0], pos[1] + size[1] - 10);
            ctx.fill();

            var font_size = group.font_size || LiteGraph.DEFAULT_GROUP_FONT_SIZE;
            ctx.font = font_size + "px Arial";
            ctx.textAlign = "left";
            ctx.fillText(group.title, pos[0] + 4, pos[1] + font_size);
        }

        ctx.restore();
    }

    /** draws some useful stats in the corner of the canvas */
    renderInfo(this: LGraphCanvas, ctx: CanvasRenderingContext2D, x: number = 10, y?: number): void {
        y = y || this.canvas.height - 80;

        ctx.save();
        ctx.translate(x, y);

        ctx.font = "10px Arial";
        ctx.fillStyle = "#888";
        ctx.textAlign = "left";
        if (this.graph) {
            ctx.fillText("T: " + this.graph.globaltime.toFixed(2) + "s", 5, 13 * 1);
            ctx.fillText("I: " + this.graph.iteration, 5, 13 * 2);
            ctx.fillText("N: " + (this.graph as any)._nodes.length + " [" + this.visible_nodes.length + "]", 5, 13 * 3);
            ctx.fillText("V: " + (this.graph as any)._version, 5, 13 * 4);
            ctx.fillText("FPS:" + this.fps.toFixed(2), 5, 13 * 5);
        } else {
            ctx.fillText("No graph selected", 5, 13 * 1);
        }
        ctx.restore();
    }

    /** draws the back canvas (the one containing the background and the connections) */
    drawBackCanvas(this: LGraphCanvas): void {
        var canvas = this.bgcanvas;
        if (
            canvas.width != this.canvas.width ||
            canvas.height != this.canvas.height
        ) {
            canvas.width = this.canvas.width;
            canvas.height = this.canvas.height;
        }

        if (!this.bgctx) {
            this.bgctx = this.bgcanvas.getContext("2d");
        }
        var ctx = this.bgctx;
        // if (ctx.start) {
        //     ctx.start();
        // }

        let viewport = this.viewport || [0, 0, ctx.canvas.width, ctx.canvas.height];

        //clear
        if (this.clear_background) {
            ctx.clearRect(viewport[0], viewport[1], viewport[2], viewport[3]);
        }

        //show subgraph stack header
        if (this._graph_stack && this._graph_stack.length && this.render_subgraph_stack_header) {
            ctx.save();
            const top_entry = this._graph_stack[this._graph_stack.length - 1];
            const parent_graph = top_entry.graph
            const subgraph_node = this.graph._subgraph_node;
            ctx.strokeStyle = subgraph_node.bgcolor;
            ctx.lineWidth = 10;
            ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
            ctx.lineWidth = 1;
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = subgraph_node.bgcolor || "#AAA";
            let title = "";
            for (let i = 1; i < this._graph_stack.length; ++i) {
                title += parent_graph._subgraph_node.getTitle() + " >> ";
            }
            ctx.fillText(
                title + subgraph_node.getTitle(),
                canvas.width * 0.5,
                40
            );
            ctx.restore();
        }

        let bg_already_painted = false;
        if (this.onRenderBackground && this.onRenderBackground(canvas, ctx)) {
            bg_already_painted = true;
        }

        //reset in case of error
        if (!this.viewport) {
            ctx.restore();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        this.visible_links.length = 0;

        if (this.graph) {
            //apply transformations
            ctx.save();
            this.ds.toCanvasContext(ctx);

            //render BG
            if (
                this.background_image &&
                this.ds.scale > 0.5 &&
                !bg_already_painted
            ) {
                if (this.zoom_modify_alpha) {
                    ctx.globalAlpha =
                        (1.0 - 0.5 / this.ds.scale) * this.editor_alpha;
                } else {
                    ctx.globalAlpha = this.editor_alpha;
                }
                ctx.imageSmoothingEnabled = ctx.imageSmoothingEnabled = false; // ctx.mozImageSmoothingEnabled =
                if (
                    !this._bg_img ||
                    this._bg_img.name != this.background_image
                ) {
                    this._bg_img = new Image();
                    this._bg_img.name = this.background_image;
                    this._bg_img.src = this.background_image;
                    var that = this;
                    this._bg_img.onload = () => {
                        this.draw(true, true);
                    };
                }

                var pattern = null;
                if (this._pattern == null && this._bg_img.width > 0) {
                    pattern = ctx.createPattern(this._bg_img, "repeat");
                    this._pattern_img = this._bg_img;
                    this._pattern = pattern;
                } else {
                    pattern = this._pattern;
                }
                if (pattern) {
                    ctx.fillStyle = pattern;
                    ctx.fillRect(
                        this.visible_area[0],
                        this.visible_area[1],
                        this.visible_area[2],
                        this.visible_area[3]
                    );
                    ctx.fillStyle = "transparent";
                }

                ctx.globalAlpha = 1.0;
                ctx.imageSmoothingEnabled = ctx.imageSmoothingEnabled = true; //= ctx.mozImageSmoothingEnabled
            }

            //groups
            if ((this.graph as any)._groups.length && !this.live_mode) {
                this.drawGroups(canvas, ctx);
            }

            if (this.onDrawBackground) {
                this.onDrawBackground(ctx, this.visible_area);
            }

            //DEBUG: show clipping area
            if (LiteGraph.debug) {
                ctx.fillStyle = "red";
                ctx.fillRect(this.visible_area[0] + 10, this.visible_area[1] + 10, this.visible_area[2] - 20, this.visible_area[3] - 20);
            }

            //bg
            if (this.render_canvas_border) {
                ctx.strokeStyle = "#235";
                ctx.strokeRect(0, 0, canvas.width, canvas.height);
            }

            if (this.render_connections_shadows) {
                ctx.shadowColor = "#000";
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.shadowBlur = 6;
            } else {
                ctx.shadowColor = "rgba(0,0,0,0)";
            }

            //draw connections
            if (!this.live_mode && this.render_connections) {
                this.drawConnections(ctx);
            }

            ctx.shadowColor = "rgba(0,0,0,0)";

            //restore state
            ctx.restore();
        }

        // if (ctx.finish) {
        //     ctx.finish();
        // }

        this.dirty_bgcanvas = false;
        this.dirty_canvas = true; //to force to repaint the front canvas with the bgcanvas
    }

    private static temp_vec2 = new Float32Array(2);

    /** draws the given node inside the canvas */
    drawNode(this: LGraphCanvas, node: LGraphNode, ctx: CanvasRenderingContext2D): void {
        var glow = false;
        this.current_node = node;

        var color = node.color || (node.constructor as any).color || LiteGraph.NODE_DEFAULT_COLOR;
        var bgColor = node.bgcolor || (node.constructor as any).bgcolor || LiteGraph.NODE_DEFAULT_BGCOLOR;

        //shadow and glow
        if (node.mouseOver) {
            glow = true;
        }

        var low_quality = this.ds.scale < 0.6; //zoomed out

        //only render if it forces it to do it
        if (this.live_mode) {
            if (!node.flags.collapsed) {
                ctx.shadowColor = "transparent";
                if (node.onDrawForeground) {
                    node.onDrawForeground(ctx, this, this.canvas);
                }
            }
            return;
        }

        var editor_alpha = this.editor_alpha;
        ctx.globalAlpha = editor_alpha;

        if (this.render_shadows && !low_quality) {
            ctx.shadowColor = LiteGraph.DEFAULT_SHADOW_COLOR;
            ctx.shadowOffsetX = 2 * this.ds.scale;
            ctx.shadowOffsetY = 2 * this.ds.scale;
            ctx.shadowBlur = 3 * this.ds.scale;
        } else {
            ctx.shadowColor = "transparent";
        }

        //custom draw collapsed method (draw after shadows because they are affected)
        if (
            node.flags.collapsed &&
            node.onDrawCollapsed &&
            node.onDrawCollapsed(ctx, this) == true
        ) {
            return;
        }

        //clip if required (mask)
        var shape = node.shape || BuiltInSlotShape.BOX_SHAPE;
        var size = LGraphCanvas_Rendering.temp_vec2;
        LGraphCanvas_Rendering.temp_vec2.set(node.size);
        var horizontal = node.horizontal; // || node.flags.horizontal;

        if (node.flags.collapsed) {
            ctx.font = this.inner_text_font;
            var title = node.getTitle ? node.getTitle() : node.title;
            if (title != null) {
                node._collapsed_width = Math.min(
                    node.size[0],
                    ctx.measureText(title).width +
                    LiteGraph.NODE_TITLE_HEIGHT * 2
                ); //LiteGraph.NODE_COLLAPSED_WIDTH;
                size[0] = node._collapsed_width;
                size[1] = 0;
            }
        }

        if (node.clip_area) {
            //Start clipping
            ctx.save();
            ctx.beginPath();
            if (shape == BuiltInSlotShape.BOX_SHAPE) {
                ctx.rect(0, 0, size[0], size[1]);
            } else if (shape == BuiltInSlotShape.ROUND_SHAPE) {
                (ctx as any).roundRect(0, 0, size[0], size[1], [10]);
            } else if (shape == BuiltInSlotShape.CIRCLE_SHAPE) {
                ctx.arc(
                    size[0] * 0.5,
                    size[1] * 0.5,
                    size[0] * 0.5,
                    0,
                    Math.PI * 2
                );
            }
            ctx.clip();
        }

        //draw shape
        if (node.has_errors) {
            bgColor = "red";
        }
        this.drawNodeShape(
            node,
            ctx,
            [size[0], size[1]],
            color,
            bgColor,
            node.is_selected,
            node.mouseOver
        );
        ctx.shadowColor = "transparent";

        //draw foreground
        if (node.onDrawForeground) {
            node.onDrawForeground(ctx, this, this.canvas);
        }

        //connection slots
        ctx.textAlign = horizontal ? "center" : "left";
        ctx.font = this.inner_text_font;

        var render_text = !low_quality;

        var out_slot = this.connecting_output;
        var in_slot = this.connecting_input;
        ctx.lineWidth = 1;

        var max_y = 0;
        var slot_pos: Vector2 = [0, 0] //to reuse

        //render inputs and outputs
        if (!node.flags.collapsed) {
            //input connection slots
            if (node.inputs) {
                for (var i = 0; i < node.inputs.length; i++) {
                    var slot = node.inputs[i];

                    var slot_type = slot.type;
                    var slot_shape = slot.shape;

                    ctx.globalAlpha = editor_alpha;
                    //change opacity of incompatible slots when dragging a connection
                    if (this.connecting_output && !LiteGraph.isValidConnection(slot.type, out_slot.type)) {
                        ctx.globalAlpha = 0.4 * editor_alpha;
                    }
                    else {
                        ctx.globalAlpha = editor_alpha;
                    }

                    ctx.fillStyle =
                        slot.link != null
                            ? slot.color_on ||
                            LGraphCanvas.DEFAULT_CONNECTION_COLORS_BY_TYPE[slot_type] ||
                            LGraphCanvas.DEFAULT_CONNECTION_COLORS.input_on
                            : slot.color_off ||
                            LGraphCanvas.DEFAULT_CONNECTION_COLORS_BY_TYPE_OFF[slot_type] ||
                            LGraphCanvas.DEFAULT_CONNECTION_COLORS_BY_TYPE[slot_type] ||
                            LGraphCanvas.DEFAULT_CONNECTION_COLORS.input_off;

                    var pos = node.getConnectionPos(true, i, [slot_pos[0], slot_pos[1]]);
                    pos[0] -= node.pos[0];
                    pos[1] -= node.pos[1];
                    if (max_y < pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5) {
                        max_y = pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5;
                    }

                    ctx.beginPath();

                    var doStroke = true;

                    if (slot.shape === BuiltInSlotShape.BOX_SHAPE) {
                        if (horizontal) {
                            ctx.rect(
                                pos[0] - 5 + 0.5,
                                pos[1] - 8 + 0.5,
                                10,
                                14
                            );
                        } else {
                            ctx.rect(
                                pos[0] - 6 + 0.5,
                                pos[1] - 5 + 0.5,
                                14,
                                10
                            );
                        }
                    } else if (slot_shape === BuiltInSlotShape.ARROW_SHAPE) {
                        ctx.moveTo(pos[0] + 8, pos[1] + 0.5);
                        ctx.lineTo(pos[0] - 4, pos[1] + 6 + 0.5);
                        ctx.lineTo(pos[0] - 4, pos[1] - 6 + 0.5);
                        ctx.closePath();
                    } else if (slot_shape === BuiltInSlotShape.GRID_SHAPE) {
                        ctx.rect(pos[0] - 4, pos[1] - 4, 2, 2);
                        ctx.rect(pos[0] - 1, pos[1] - 4, 2, 2);
                        ctx.rect(pos[0] + 2, pos[1] - 4, 2, 2);
                        ctx.rect(pos[0] - 4, pos[1] - 1, 2, 2);
                        ctx.rect(pos[0] - 1, pos[1] - 1, 2, 2);
                        ctx.rect(pos[0] + 2, pos[1] - 1, 2, 2);
                        ctx.rect(pos[0] - 4, pos[1] + 2, 2, 2);
                        ctx.rect(pos[0] - 1, pos[1] + 2, 2, 2);
                        ctx.rect(pos[0] + 2, pos[1] + 2, 2, 2);
                        doStroke = false;
                    } else {
                        if (low_quality)
                            ctx.rect(pos[0] - 4, pos[1] - 4, 8, 8); //faster
                        else
                            ctx.arc(pos[0], pos[1], 4, 0, Math.PI * 2);
                    }
                    ctx.fill();

                    //render name
                    if (render_text) {
                        var text = slot.label != null ? slot.label : slot.name;
                        if (text) {
                            ctx.fillStyle = LiteGraph.NODE_TEXT_COLOR;
                            if (horizontal || slot.dir == Dir.UP) {
                                ctx.fillText(text, pos[0], pos[1] - 10);
                            } else {
                                ctx.fillText(text, pos[0] + 10, pos[1] + 5);
                            }
                        }
                    }
                }
            }

            //output connection slots

            ctx.textAlign = horizontal ? "center" : "right";
            ctx.strokeStyle = "black";
            if (node.outputs) {
                for (let i = 0; i < node.outputs.length; i++) {
                    let slot = node.outputs[i];

                    var slot_type = slot.type;
                    var slot_shape = slot.shape;

                    //change opacity of incompatible slots when dragging a connection
                    if (this.connecting_input && !LiteGraph.isValidConnection(in_slot.type, slot_type)) {
                        ctx.globalAlpha = 0.4 * editor_alpha;
                    }
                    else {
                        ctx.globalAlpha = editor_alpha;
                    }

                    var pos = node.getConnectionPos(false, i, slot_pos);
                    pos[0] -= node.pos[0];
                    pos[1] -= node.pos[1];
                    if (max_y < pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5) {
                        max_y = pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5;
                    }

                    ctx.fillStyle =
                        slot.links && slot.links.length
                            ? slot.color_on ||
                            LGraphCanvas.DEFAULT_CONNECTION_COLORS_BY_TYPE[slot_type] ||
                            LGraphCanvas.DEFAULT_CONNECTION_COLORS.output_on
                            : slot.color_off ||
                            LGraphCanvas.DEFAULT_CONNECTION_COLORS_BY_TYPE_OFF[slot_type] ||
                            LGraphCanvas.DEFAULT_CONNECTION_COLORS_BY_TYPE[slot_type] ||
                            LGraphCanvas.DEFAULT_CONNECTION_COLORS.output_off;
                    ctx.beginPath();
                    //ctx.rect( node.size[0] - 14,i*14,10,10);

                    var doStroke = true;

                    if (slot_shape === BuiltInSlotShape.BOX_SHAPE) {
                        if (horizontal) {
                            ctx.rect(
                                pos[0] - 5 + 0.5,
                                pos[1] - 8 + 0.5,
                                10,
                                14
                            );
                        } else {
                            ctx.rect(
                                pos[0] - 6 + 0.5,
                                pos[1] - 5 + 0.5,
                                14,
                                10
                            );
                        }
                    } else if (slot_shape === BuiltInSlotShape.ARROW_SHAPE) {
                        ctx.moveTo(pos[0] + 8, pos[1] + 0.5);
                        ctx.lineTo(pos[0] - 4, pos[1] + 6 + 0.5);
                        ctx.lineTo(pos[0] - 4, pos[1] - 6 + 0.5);
                        ctx.closePath();
                    } else if (slot_shape === BuiltInSlotShape.GRID_SHAPE) {
                        ctx.rect(pos[0] - 4, pos[1] - 4, 2, 2);
                        ctx.rect(pos[0] - 1, pos[1] - 4, 2, 2);
                        ctx.rect(pos[0] + 2, pos[1] - 4, 2, 2);
                        ctx.rect(pos[0] - 4, pos[1] - 1, 2, 2);
                        ctx.rect(pos[0] - 1, pos[1] - 1, 2, 2);
                        ctx.rect(pos[0] + 2, pos[1] - 1, 2, 2);
                        ctx.rect(pos[0] - 4, pos[1] + 2, 2, 2);
                        ctx.rect(pos[0] - 1, pos[1] + 2, 2, 2);
                        ctx.rect(pos[0] + 2, pos[1] + 2, 2, 2);
                        doStroke = false;
                    } else {
                        if (low_quality)
                            ctx.rect(pos[0] - 4, pos[1] - 4, 8, 8);
                        else
                            ctx.arc(pos[0], pos[1], 4, 0, Math.PI * 2);
                    }

                    //trigger
                    //if(slot.node_id != null && slot.slot == -1)
                    //	ctx.fillStyle = "#F85";

                    //if(slot.links != null && slot.links.length)
                    ctx.fill();
                    if (!low_quality && doStroke)
                        ctx.stroke();

                    //render output name
                    if (render_text) {
                        var text = slot.label != null ? slot.label : slot.name;
                        if (text) {
                            ctx.fillStyle = LiteGraph.NODE_TEXT_COLOR;
                            if (horizontal || slot.dir == Dir.DOWN) {
                                ctx.fillText(text, pos[0], pos[1] - 8);
                            } else {
                                ctx.fillText(text, pos[0] - 10, pos[1] + 5);
                            }
                        }
                    }
                }
            }

            ctx.textAlign = "left";
            ctx.globalAlpha = 1;

            if (node.widgets) {
                var widgets_y = max_y;
                if (horizontal || node.widgets_up) {
                    widgets_y = 2;
                }
                if (node.widgets_start_y != null)
                    widgets_y = node.widgets_start_y;
                this.drawNodeWidgets(
                    node,
                    widgets_y,
                    ctx,
                    this.node_widget && this.node_widget[0] == node
                        ? this.node_widget[1]
                        : null
                );
            }
        } else if (this.render_collapsed_slots) {
            //if collapsed
            var input_slot = null;
            var output_slot = null;

            //get first connected slot to render
            if (node.inputs) {
                for (let i = 0; i < node.inputs.length; i++) {
                    let slot = node.inputs[i];
                    if (slot.link == null) {
                        continue;
                    }
                    input_slot = slot;
                    break;
                }
            }
            if (node.outputs) {
                for (let i = 0; i < node.outputs.length; i++) {
                    let slot = node.outputs[i];
                    if (!slot.links || !slot.links.length) {
                        continue;
                    }
                    output_slot = slot;
                }
            }

            if (input_slot) {
                var x = 0;
                var y = LiteGraph.NODE_TITLE_HEIGHT * -0.5; //center
                if (horizontal) {
                    x = node._collapsed_width * 0.5;
                    y = -LiteGraph.NODE_TITLE_HEIGHT;
                }
                ctx.fillStyle = "#686";
                ctx.beginPath();
                if (input_slot.shape === BuiltInSlotShape.BOX_SHAPE) {
                    ctx.rect(x - 7 + 0.5, y - 4, 14, 8);
                } else if (input_slot.shape === BuiltInSlotShape.ARROW_SHAPE) {
                    ctx.moveTo(x + 8, y);
                    ctx.lineTo(x + -4, y - 4);
                    ctx.lineTo(x + -4, y + 4);
                    ctx.closePath();
                } else {
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                }
                ctx.fill();
            }

            if (output_slot) {
                var x = node._collapsed_width;
                var y = LiteGraph.NODE_TITLE_HEIGHT * -0.5; //center
                if (horizontal) {
                    x = node._collapsed_width * 0.5;
                    y = 0;
                }
                ctx.fillStyle = "#686";
                ctx.strokeStyle = "black";
                ctx.beginPath();
                if (output_slot.shape === BuiltInSlotShape.BOX_SHAPE) {
                    ctx.rect(x - 7 + 0.5, y - 4, 14, 8);
                } else if (output_slot.shape === BuiltInSlotShape.ARROW_SHAPE) {
                    ctx.moveTo(x + 6, y);
                    ctx.lineTo(x - 6, y - 4);
                    ctx.lineTo(x - 6, y + 4);
                    ctx.closePath();
                } else {
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                }
                ctx.fill();
                //ctx.stroke();
            }
        }

        if (node.clip_area) {
            ctx.restore();
        }

        ctx.globalAlpha = 1.0;
    }

    /** used by this.over_link_center */
    drawLinkTooltip(this: LGraphCanvas, ctx: CanvasRenderingContext2D, link: LLink) {
        var pos = link._pos;
        if (this.allow_interaction && !this.read_only) {
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(pos[0], pos[1], 3, 0, Math.PI * 2);
            ctx.fill();
        }

        if (link.data == null)
            return;

        if (this.onDrawLinkTooltip)
            if (this.onDrawLinkTooltip(ctx, link, this) == true)
                return;

        var data = link.data;
        var text = null;

        if (data.constructor === Number)
            text = data.toFixed(2);
        else if (data.constructor === String)
            text = "\"" + data + "\"";
        else if (data.constructor === Boolean)
            text = String(data);
        else if (data.toToolTip)
            text = data.toToolTip();
        else
            text = "[" + data.constructor.name + "]";

        if (text == null)
            return;
        text = text.substr(0, 30); //avoid weird

        ctx.font = "14px Courier New";
        var info = ctx.measureText(text);
        var w = info.width + 20;
        var h = 24;
        ctx.shadowColor = "black";
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 3;
        ctx.fillStyle = "#454";
        ctx.beginPath();
        (ctx as any).roundRect(pos[0] - w * 0.5, pos[1] - 15 - h, w, h, [3]);
        ctx.moveTo(pos[0] - 10, pos[1] - 15);
        ctx.lineTo(pos[0] + 10, pos[1] - 15);
        ctx.lineTo(pos[0], pos[1] - 5);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.textAlign = "center";
        ctx.fillStyle = "#CEC";
        ctx.fillText(text, pos[0], pos[1] - 15 - h * 0.3);
    }

    private static tmp_area = new Float32Array(4);

    /** draws the shape of the given node in the canvas */
    drawNodeShape(
        this: LGraphCanvas,
        node: LGraphNode,
        ctx: CanvasRenderingContext2D,
        size: Vector2,
        fgColor: string,
        bgColor: string,
        selected: boolean,
        mouseOver: boolean
    ): void {
        //bg rect
        ctx.strokeStyle = fgColor;
        ctx.fillStyle = bgColor;

        var title_height = LiteGraph.NODE_TITLE_HEIGHT;
        var low_quality = this.ds.scale < 0.5;

        //render node area depending on shape
        var shape =
            node.shape || (node.constructor as any).shape || BuiltInSlotShape.ROUND_SHAPE;

        var titleMode = node.titleMode;

        var render_title = node.isShowingTitle(mouseOver);

        var area = LGraphCanvas_Rendering.tmp_area;
        area[0] = 0; //x
        area[1] = render_title ? -title_height : 0; //y
        area[2] = size[0] + 1; //w
        area[3] = render_title ? size[1] + title_height : size[1]; //h

        var old_alpha = ctx.globalAlpha;

        //full node shape
        //if(node.flags.collapsed)
        {
            ctx.beginPath();
            if (shape == BuiltInSlotShape.BOX_SHAPE || low_quality) {
                ctx.fillRect(area[0], area[1], area[2], area[3]);
            } else if (
                shape == BuiltInSlotShape.ROUND_SHAPE ||
                shape == BuiltInSlotShape.CARD_SHAPE
            ) {
                (ctx as any).roundRect(
                    area[0],
                    area[1],
                    area[2],
                    area[3],
                    shape == BuiltInSlotShape.CARD_SHAPE ? [this.round_radius, this.round_radius, 0, 0] : [this.round_radius]
                );
            } else if (shape == BuiltInSlotShape.CIRCLE_SHAPE) {
                ctx.arc(
                    size[0] * 0.5,
                    size[1] * 0.5,
                    size[0] * 0.5,
                    0,
                    Math.PI * 2
                );
            }
            ctx.fill();

            //separator
            if (!node.flags.collapsed && render_title) {
                ctx.shadowColor = "transparent";
                ctx.fillStyle = "rgba(0,0,0,0.2)";
                ctx.fillRect(0, -1, area[2], 2);
            }
        }
        ctx.shadowColor = "transparent";

        if (node.onDrawBackground) {
            node.onDrawBackground(ctx, this, this.canvas, this.graph_mouse);
        }

        //title bg (remember, it is rendered ABOVE the node)
        if (render_title || titleMode == TitleMode.TRANSPARENT_TITLE) {
            //title bar
            if (node.onDrawTitleBar) {
                node.onDrawTitleBar(ctx, this, title_height, size, this.ds.scale, fgColor);
            } else if (
                titleMode != TitleMode.TRANSPARENT_TITLE &&
                ((node.constructor as any).title_color || this.render_title_colored)
            ) {
                var title_color = (node.constructor as any).title_color || fgColor;

                if (node.flags.collapsed) {
                    ctx.shadowColor = LiteGraph.DEFAULT_SHADOW_COLOR;
                }

                //* gradient test
                if (this.use_gradients) {
                    var grad = LGraphCanvas.gradients[title_color];
                    if (!grad) {
                        grad = LGraphCanvas.gradients[title_color] = ctx.createLinearGradient(0, 0, 400, 0);
                        grad.addColorStop(0, title_color); // TODO refactor: validate color !! prevent DOMException
                        grad.addColorStop(1, "#000");
                    }
                    ctx.fillStyle = grad;
                } else {
                    ctx.fillStyle = title_color;
                }

                //ctx.globalAlpha = 0.5 * old_alpha;
                ctx.beginPath();
                if (shape == BuiltInSlotShape.BOX_SHAPE || low_quality) {
                    ctx.rect(0, -title_height, size[0] + 1, title_height);
                } else if (shape == BuiltInSlotShape.ROUND_SHAPE || shape == BuiltInSlotShape.CARD_SHAPE) {
                    (ctx as any).roundRect(
                        0,
                        -title_height,
                        size[0] + 1,
                        title_height,
                        node.flags.collapsed ? [this.round_radius] : [this.round_radius, this.round_radius, 0, 0]
                    );
                }
                ctx.fill();
                ctx.shadowColor = "transparent";
            }

            var colState = null;
            if (LiteGraph.node_box_coloured_by_mode) {
                if (NODE_MODE_COLORS[node.mode]) {
                    colState = NODE_MODE_COLORS[node.mode];
                }
            }
            if (LiteGraph.node_box_coloured_when_on) {
                colState = node.action_triggered ? "#FFF" : (node.execute_triggered ? "#AAA" : colState);
            }

            //title box
            var box_size = 10;
            if (node.onDrawTitleBox) {
                node.onDrawTitleBox(ctx, this, title_height, size, this.ds.scale);
            } else if (
                shape == BuiltInSlotShape.ROUND_SHAPE ||
                shape == BuiltInSlotShape.CIRCLE_SHAPE ||
                shape == BuiltInSlotShape.CARD_SHAPE
            ) {
                if (low_quality) {
                    ctx.fillStyle = "black";
                    ctx.beginPath();
                    ctx.arc(
                        title_height * 0.5,
                        title_height * -0.5,
                        box_size * 0.5 + 1,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                }

                ctx.fillStyle = node.boxcolor || colState || LiteGraph.NODE_DEFAULT_BOXCOLOR;
                if (low_quality)
                    ctx.fillRect(title_height * 0.5 - box_size * 0.5, title_height * -0.5 - box_size * 0.5, box_size, box_size);
                else {
                    ctx.beginPath();
                    ctx.arc(
                        title_height * 0.5,
                        title_height * -0.5,
                        box_size * 0.5,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                }
            } else {
                if (low_quality) {
                    ctx.fillStyle = "black";
                    ctx.fillRect(
                        (title_height - box_size) * 0.5 - 1,
                        (title_height + box_size) * -0.5 - 1,
                        box_size + 2,
                        box_size + 2
                    );
                }
                ctx.fillStyle = node.boxcolor || colState || LiteGraph.NODE_DEFAULT_BOXCOLOR;
                ctx.fillRect(
                    (title_height - box_size) * 0.5,
                    (title_height + box_size) * -0.5,
                    box_size,
                    box_size
                );
            }
            ctx.globalAlpha = old_alpha;

            //title text
            if (node.onDrawTitleText) {
                node.onDrawTitleText(
                    ctx,
                    this,
                    title_height,
                    size,
                    this.ds.scale,
                    this.title_text_font,
                    selected
                );
            }
            if (!low_quality) {
                ctx.font = this.title_text_font;
                var title = String(node.getTitle());
                if (title) {
                    if (selected) {
                        ctx.fillStyle = LiteGraph.NODE_SELECTED_TITLE_COLOR;
                    } else {
                        ctx.fillStyle =
                            (node.constructor as any).title_text_color ||
                            this.node_title_color;
                    }
                    if (node.flags.collapsed) {
                        ctx.textAlign = "left";
                        // var measure = ctx.measureText(title);
                        ctx.fillText(
                            title.substr(0, 20), //avoid urls too long
                            title_height,// + measure.width * 0.5,
                            LiteGraph.NODE_TITLE_TEXT_Y - title_height
                        );
                        ctx.textAlign = "left";
                    } else {
                        ctx.textAlign = "left";
                        ctx.fillText(
                            title,
                            title_height,
                            LiteGraph.NODE_TITLE_TEXT_Y - title_height
                        );
                    }
                }
            }

            //subgraph box
            if (!node.flags.collapsed && node.subgraph && !node.skip_subgraph_button) {
                var w = LiteGraph.NODE_TITLE_HEIGHT;
                var x = node.size[0] - w;
                var over = LiteGraph.isInsideRectangle(this.graph_mouse[0] - node.pos[0], this.graph_mouse[1] - node.pos[1], x + 2, -w + 2, w - 4, w - 4);
                ctx.fillStyle = over ? "#888" : "#555";
                if (shape == BuiltInSlotShape.BOX_SHAPE || low_quality)
                    ctx.fillRect(x + 2, -w + 2, w - 4, w - 4);
                else {
                    ctx.beginPath();
                    (ctx as any).roundRect(x + 2, -w + 2, w - 4, w - 4, [4]);
                    ctx.fill();
                }
                ctx.fillStyle = "#333";
                ctx.beginPath();
                ctx.moveTo(x + w * 0.2, -w * 0.6);
                ctx.lineTo(x + w * 0.8, -w * 0.6);
                ctx.lineTo(x + w * 0.5, -w * 0.3);
                ctx.fill();
            }

            //custom title render
            if (node.onDrawTitle) {
                node.onDrawTitle(ctx, this);
            }
        }

        //render selection marker
        if (selected) {
            if (node.onBounding) {
                node.onBounding(area);
            }

            if (titleMode == TitleMode.TRANSPARENT_TITLE) {
                area[1] -= title_height;
                area[3] += title_height;
            }
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            if (shape == BuiltInSlotShape.BOX_SHAPE) {
                ctx.rect(
                    -6 + area[0],
                    -6 + area[1],
                    12 + area[2],
                    12 + area[3]
                );
            } else if (
                shape == BuiltInSlotShape.ROUND_SHAPE ||
                (shape == BuiltInSlotShape.CARD_SHAPE && node.flags.collapsed)
            ) {
                (ctx as any).roundRect(
                    -6 + area[0],
                    -6 + area[1],
                    12 + area[2],
                    12 + area[3],
                    [this.round_radius * 2]
                );
            } else if (shape == BuiltInSlotShape.CARD_SHAPE) {
                (ctx as any).roundRect(
                    -6 + area[0],
                    -6 + area[1],
                    12 + area[2],
                    12 + area[3],
                    [this.round_radius * 2, 2, this.round_radius * 2, 2]
                );
            } else if (shape == BuiltInSlotShape.CIRCLE_SHAPE) {
                ctx.arc(
                    size[0] * 0.5,
                    size[1] * 0.5,
                    size[0] * 0.5 + 6,
                    0,
                    Math.PI * 2
                );
            }
            ctx.strokeStyle = LiteGraph.NODE_BOX_OUTLINE_COLOR;
            ctx.stroke();
            ctx.strokeStyle = fgColor;
            ctx.globalAlpha = 1;
        }

        // these counter helps in conditioning drawing based on if the node has been executed or an action occurred
        if (node.execute_triggered > 0) node.execute_triggered--;
        if (node.action_triggered > 0) node.action_triggered--;
    }

    private static margin_area = new Float32Array(4);
    private static link_bounding = new Float32Array(4);
    private static tempA: Vector2 = [0, 0]
    private static tempB: Vector2 = [0, 0]

    /** draws every connection visible in the canvas */
    drawConnections(this: LGraphCanvas, ctx: CanvasRenderingContext2D): void {
        var now = LiteGraph.getTime();
        var visible_area = this.visible_area;
        let margin_area = LGraphCanvas_Rendering.margin_area
        margin_area[0] = visible_area[0] - 20;
        margin_area[1] = visible_area[1] - 20;
        margin_area[2] = visible_area[2] + 40;
        margin_area[3] = visible_area[3] + 40;

        //draw connections
        ctx.lineWidth = this.connections_width;

        ctx.fillStyle = "#AAA";
        ctx.strokeStyle = "#AAA";
        ctx.globalAlpha = this.editor_alpha;
        //for every node
        var nodes = (this.graph as any)._nodes;
        for (var n = 0, l = nodes.length; n < l; ++n) {
            var node = nodes[n];
            //for every input (we render just inputs because it is easier as every slot can only have one input)
            if (!node.inputs || !node.inputs.length) {
                continue;
            }

            for (var i = 0; i < node.inputs.length; ++i) {
                var input = node.inputs[i];
                if (!input || input.link == null) {
                    continue;
                }
                var link_id = input.link;
                var link = this.graph.links[link_id];
                if (!link) {
                    continue;
                }

                //find link info
                var start_node = this.graph.getNodeById(link.origin_id);
                if (start_node == null) {
                    continue;
                }
                var start_node_slot = link.origin_slot;
                var start_node_slotpos = null;
                if (start_node_slot == -1) {
                    start_node_slotpos = [
                        start_node.pos[0] + 10,
                        start_node.pos[1] + 10
                    ];
                } else {
                    start_node_slotpos = start_node.getConnectionPos(
                        false,
                        start_node_slot,
                        LGraphCanvas_Rendering.tempA
                    );
                }
                var end_node_slotpos = node.getConnectionPos(true, i, LGraphCanvas_Rendering.tempB);

                let link_bounding = LGraphCanvas_Rendering.link_bounding

                //compute link bounding
                link_bounding[0] = start_node_slotpos[0];
                link_bounding[1] = start_node_slotpos[1];
                link_bounding[2] = end_node_slotpos[0] - start_node_slotpos[0];
                link_bounding[3] = end_node_slotpos[1] - start_node_slotpos[1];
                if (link_bounding[2] < 0) {
                    link_bounding[0] += link_bounding[2];
                    link_bounding[2] = Math.abs(link_bounding[2]);
                }
                if (link_bounding[3] < 0) {
                    link_bounding[1] += link_bounding[3];
                    link_bounding[3] = Math.abs(link_bounding[3]);
                }

                //skip links outside of the visible area of the canvas
                if (!LiteGraph.overlapBounding(link_bounding, margin_area)) {
                    continue;
                }

                var start_slot = start_node.outputs[start_node_slot];
                var end_slot = node.inputs[i];
                if (!start_slot || !end_slot) {
                    continue;
                }
                var startDir =
                    start_slot.dir ||
                    (start_node.horizontal ? Dir.DOWN : Dir.RIGHT);
                var endDir =
                    end_slot.dir ||
                    (node.horizontal ? Dir.UP : Dir.LEFT);

                this.renderLink(
                    ctx,
                    start_node_slotpos,
                    end_node_slotpos,
                    link,
                    false,
                    false,
                    null,
                    startDir,
                    endDir
                );

                //event triggered rendered on top
                if (link && link._last_time && now - link._last_time < 1000) {
                    var f = 2.0 - (now - link._last_time) * 0.002;
                    var tmp = ctx.globalAlpha;
                    ctx.globalAlpha = tmp * f;
                    this.renderLink(
                        ctx,
                        start_node_slotpos,
                        end_node_slotpos,
                        link,
                        true,
                        true,
                        "white",
                        startDir,
                        endDir
                    );
                    ctx.globalAlpha = tmp;
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    /**
     * draws a link between two points
     * @param a start pos
     * @param b end pos
     * @param link the link object with all the link info
     * @param skipBorder ignore the shadow of the link
     * @param flow show flow animation (for events)
     * @param color the color for the link
     * @param startDir the direction enum
     * @param endDir the direction enum
     * @param numSublines number of sublines (useful to represent vec3 or rgb)
     **/
    renderLink(
        this: LGraphCanvas,
        ctx: CanvasRenderingContext2D, a: Vector2,
        b: Vector2,
        link: LLink,
        skipBorder: boolean,
        flow: boolean,
        color?: string,
        startDir?: Dir,
        endDir?: Dir,
        numSublines?: number
    ): void {
        if (link) {
            this.visible_links.push(link);
        }

        //choose color
        if (!color && link) {
            color = link.color || this.link_type_colors[link.type];
        }
        if (!color) {
            color = this.default_link_color;
        }
        if (link != null && this.highlighted_links[link.id]) {
            color = "#FFF";
        }

        startDir = startDir || Dir.RIGHT;
        endDir = endDir || Dir.LEFT;

        var dist = LiteGraph.distance(a, b);

        if (this.render_connections_border && this.ds.scale > 0.6) {
            ctx.lineWidth = this.connections_width + 4;
        }
        ctx.lineJoin = "round";
        numSublines = numSublines || 1;
        if (numSublines > 1) {
            ctx.lineWidth = 0.5;
        }

        //begin line shape
        ctx.beginPath();
        for (var i = 0; i < numSublines; i += 1) {
            var offsety = (i - (numSublines - 1) * 0.5) * 5;

            if (this.links_render_mode == LinkRenderMode.SPLINE_LINK) {
                ctx.moveTo(a[0], a[1] + offsety);
                var start_offset_x = 0;
                var start_offset_y = 0;
                var end_offset_x = 0;
                var end_offset_y = 0;
                switch (startDir) {
                    case Dir.LEFT:
                        start_offset_x = dist * -0.25;
                        break;
                    case Dir.RIGHT:
                        start_offset_x = dist * 0.25;
                        break;
                    case Dir.UP:
                        start_offset_y = dist * -0.25;
                        break;
                    case Dir.DOWN:
                        start_offset_y = dist * 0.25;
                        break;
                }
                switch (endDir) {
                    case Dir.LEFT:
                        end_offset_x = dist * -0.25;
                        break;
                    case Dir.RIGHT:
                        end_offset_x = dist * 0.25;
                        break;
                    case Dir.UP:
                        end_offset_y = dist * -0.25;
                        break;
                    case Dir.DOWN:
                        end_offset_y = dist * 0.25;
                        break;
                }
                ctx.bezierCurveTo(
                    a[0] + start_offset_x,
                    a[1] + start_offset_y + offsety,
                    b[0] + end_offset_x,
                    b[1] + end_offset_y + offsety,
                    b[0],
                    b[1] + offsety
                );
            } else if (this.links_render_mode == LinkRenderMode.LINEAR_LINK) {
                ctx.moveTo(a[0], a[1] + offsety);
                var start_offset_x = 0;
                var start_offset_y = 0;
                var end_offset_x = 0;
                var end_offset_y = 0;
                switch (startDir) {
                    case Dir.LEFT:
                        start_offset_x = -1;
                        break;
                    case Dir.RIGHT:
                        start_offset_x = 1;
                        break;
                    case Dir.UP:
                        start_offset_y = -1;
                        break;
                    case Dir.DOWN:
                        start_offset_y = 1;
                        break;
                }
                switch (endDir) {
                    case Dir.LEFT:
                        end_offset_x = -1;
                        break;
                    case Dir.RIGHT:
                        end_offset_x = 1;
                        break;
                    case Dir.UP:
                        end_offset_y = -1;
                        break;
                    case Dir.DOWN:
                        end_offset_y = 1;
                        break;
                }
                var l = 15;
                ctx.lineTo(
                    a[0] + start_offset_x * l,
                    a[1] + start_offset_y * l + offsety
                );
                ctx.lineTo(
                    b[0] + end_offset_x * l,
                    b[1] + end_offset_y * l + offsety
                );
                ctx.lineTo(b[0], b[1] + offsety);
            } else if (this.links_render_mode == LinkRenderMode.STRAIGHT_LINK) {
                ctx.moveTo(a[0], a[1]);
                var start_x = a[0];
                var start_y = a[1];
                var end_x = b[0];
                var end_y = b[1];
                if (startDir == Dir.RIGHT) {
                    start_x += 10;
                } else {
                    start_y += 10;
                }
                if (endDir == Dir.LEFT) {
                    end_x -= 10;
                } else {
                    end_y -= 10;
                }
                ctx.lineTo(start_x, start_y);
                ctx.lineTo((start_x + end_x) * 0.5, start_y);
                ctx.lineTo((start_x + end_x) * 0.5, end_y);
                ctx.lineTo(end_x, end_y);
                ctx.lineTo(b[0], b[1]);
            } else {
                return;
            } //unknown
        }

        //rendering the outline of the connection can be a little bit slow
        if (
            this.render_connections_border &&
            this.ds.scale > 0.6 &&
            !skipBorder
        ) {
            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            ctx.stroke();
        }

        ctx.lineWidth = this.connections_width;
        ctx.fillStyle = ctx.strokeStyle = color;
        ctx.stroke();
        //end line shape

        var pos = this.computeConnectionPoint(a, b, 0.5, startDir, endDir);
        if (link && link._pos) {
            link._pos[0] = pos[0];
            link._pos[1] = pos[1];
        }

        //render arrow in the middle
        if (
            this.ds.scale >= 0.6 &&
            this.highquality_render &&
            endDir != Dir.CENTER
        ) {
            //render arrow
            if (this.render_connection_arrows) {
                //compute two points in the connection
                var posA = this.computeConnectionPoint(
                    a,
                    b,
                    0.25,
                    startDir,
                    endDir
                );
                var posB = this.computeConnectionPoint(
                    a,
                    b,
                    0.26,
                    startDir,
                    endDir
                );
                var posC = this.computeConnectionPoint(
                    a,
                    b,
                    0.75,
                    startDir,
                    endDir
                );
                var posD = this.computeConnectionPoint(
                    a,
                    b,
                    0.76,
                    startDir,
                    endDir
                );

                //compute the angle between them so the arrow points in the right direction
                var angleA = 0;
                var angleB = 0;
                if (this.render_curved_connections) {
                    angleA = -Math.atan2(posB[0] - posA[0], posB[1] - posA[1]);
                    angleB = -Math.atan2(posD[0] - posC[0], posD[1] - posC[1]);
                } else {
                    angleB = angleA = b[1] > a[1] ? 0 : Math.PI;
                }

                //render arrow
                ctx.save();
                ctx.translate(posA[0], posA[1]);
                ctx.rotate(angleA);
                ctx.beginPath();
                ctx.moveTo(-5, -3);
                ctx.lineTo(0, +7);
                ctx.lineTo(+5, -3);
                ctx.fill();
                ctx.restore();
                ctx.save();
                ctx.translate(posC[0], posC[1]);
                ctx.rotate(angleB);
                ctx.beginPath();
                ctx.moveTo(-5, -3);
                ctx.lineTo(0, +7);
                ctx.lineTo(+5, -3);
                ctx.fill();
                ctx.restore();
            }

            //circle
            ctx.beginPath();
            ctx.arc(pos[0], pos[1], 5, 0, Math.PI * 2);
            ctx.fill();
        }

        //render flowing points
        if (flow) {
            ctx.fillStyle = color;
            for (var i = 0; i < 5; ++i) {
                var f = (LiteGraph.getTime() * 0.001 + i * 0.2) % 1;
                var pos = this.computeConnectionPoint(
                    a,
                    b,
                    f,
                    startDir,
                    endDir
                );
                ctx.beginPath();
                ctx.arc(pos[0], pos[1], 5, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }


    computeConnectionPoint(
        this: LGraphCanvas,
        a: Vector2,
        b: Vector2,
        t: number,
        startDir: Dir = Dir.RIGHT,
        endDir: Dir = Dir.LEFT
    ): Vector2 {
        var dist = LiteGraph.distance(a, b);
        var p0 = a;
        var p1 = [a[0], a[1]];
        var p2 = [b[0], b[1]];
        var p3 = b;

        switch (startDir) {
            case Dir.LEFT:
                p1[0] += dist * -0.25;
                break;
            case Dir.RIGHT:
                p1[0] += dist * 0.25;
                break;
            case Dir.UP:
                p1[1] += dist * -0.25;
                break;
            case Dir.DOWN:
                p1[1] += dist * 0.25;
                break;
        }
        switch (endDir) {
            case Dir.LEFT:
                p2[0] += dist * -0.25;
                break;
            case Dir.RIGHT:
                p2[0] += dist * 0.25;
                break;
            case Dir.UP:
                p2[1] += dist * -0.25;
                break;
            case Dir.DOWN:
                p2[1] += dist * 0.25;
                break;
        }

        var c1 = (1 - t) * (1 - t) * (1 - t);
        var c2 = 3 * ((1 - t) * (1 - t)) * t;
        var c3 = 3 * (1 - t) * (t * t);
        var c4 = t * t * t;

        var x = c1 * p0[0] + c2 * p1[0] + c3 * p2[0] + c4 * p3[0];
        var y = c1 * p0[1] + c2 * p1[1] + c3 * p2[1] + c4 * p3[1];
        return [x, y];
    }


    drawExecutionOrder(this: LGraphCanvas, ctx: CanvasRenderingContext2D): void {
        ctx.shadowColor = "transparent";
        ctx.globalAlpha = 0.25;

        ctx.textAlign = "center";
        ctx.strokeStyle = "white";
        ctx.globalAlpha = 0.75;

        var visible_nodes = this.visible_nodes;
        for (var i = 0; i < visible_nodes.length; ++i) {
            var node = visible_nodes[i];
            ctx.fillStyle = "black";
            ctx.fillRect(
                node.pos[0] - LiteGraph.NODE_TITLE_HEIGHT,
                node.pos[1] - LiteGraph.NODE_TITLE_HEIGHT,
                LiteGraph.NODE_TITLE_HEIGHT,
                LiteGraph.NODE_TITLE_HEIGHT
            );
            if (node.order == 0) {
                ctx.strokeRect(
                    node.pos[0] - LiteGraph.NODE_TITLE_HEIGHT + 0.5,
                    node.pos[1] - LiteGraph.NODE_TITLE_HEIGHT + 0.5,
                    LiteGraph.NODE_TITLE_HEIGHT,
                    LiteGraph.NODE_TITLE_HEIGHT
                );
            }
            ctx.fillStyle = "#FFF";
            ctx.fillText(
                "" + node.order,
                node.pos[0] + LiteGraph.NODE_TITLE_HEIGHT * -0.5,
                node.pos[1] - 6
            );
        }
        ctx.globalAlpha = 1;
    }

    /** draws the widgets stored inside a node */
    drawNodeWidgets(
        this: LGraphCanvas,
        node: LGraphNode,
        posY: number,
        ctx: CanvasRenderingContext2D,
        activeWidget: object
    ): void {
        if (!node.widgets || !node.widgets.length) {
            return;
        }
        var width = node.size[0];
        var widgets = node.widgets;
        posY += 2;
        var H = LiteGraph.NODE_WIDGET_HEIGHT;
        var show_text = this.ds.scale > 0.5;
        ctx.save();
        ctx.globalAlpha = this.editor_alpha;
        var outline_color = LiteGraph.WIDGET_OUTLINE_COLOR;
        var background_color = LiteGraph.WIDGET_BGCOLOR;
        var text_color = LiteGraph.WIDGET_TEXT_COLOR;
        var secondary_text_color = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR;
        var margin = 15;

        for (var i = 0; i < widgets.length; ++i) {
            var w = widgets[i];
            if (w.hidden)
                continue;

            var y = posY;
            if (w.y) {
                y = w.y;
            }
            w.last_y = y;
            ctx.strokeStyle = outline_color;
            ctx.fillStyle = "#222";
            ctx.textAlign = "left";
            //ctx.lineWidth = 2;
            if (w.disabled)
                ctx.globalAlpha *= 0.5;
            var widget_width = w.width || width;

            switch (w.type) {
                case "button":
                    if (w.clicked) {
                        ctx.fillStyle = "#AAA";
                        w.clicked = false;
                        this.dirty_canvas = true;
                    }
                    ctx.fillRect(margin, y, widget_width - margin * 2, H);
                    if (show_text && !w.disabled && !LiteGraph.ignore_all_widget_events)
                        ctx.strokeRect(margin, y, widget_width - margin * 2, H);
                    if (show_text) {
                        ctx.textAlign = "center";
                        ctx.fillStyle = text_color;
                        ctx.fillText(w.name, widget_width * 0.5, y + H * 0.7);
                    }
                    break;
                case "toggle":
                    ctx.textAlign = "left";
                    ctx.strokeStyle = outline_color;
                    ctx.fillStyle = background_color;
                    ctx.beginPath();
                    if (show_text)
                        (ctx as any).roundRect(margin, y, widget_width - margin * 2, H, [H * 0.5]);
                    else
                        ctx.rect(margin, y, widget_width - margin * 2, H);
                    ctx.fill();
                    if (show_text && !w.disabled && !LiteGraph.ignore_all_widget_events)
                        ctx.stroke();
                    ctx.fillStyle = w.value ? "#89A" : "#333";
                    ctx.beginPath();
                    ctx.arc(widget_width - margin * 2, y + H * 0.5, H * 0.36, 0, Math.PI * 2);
                    ctx.fill();
                    if (show_text) {
                        ctx.fillStyle = secondary_text_color;
                        if (w.name != null) {
                            ctx.fillText(w.name, margin * 2, y + H * 0.7);
                        }
                        ctx.fillStyle = w.value ? text_color : secondary_text_color;
                        ctx.textAlign = "right";
                        ctx.fillText(
                            w.value
                                ? w.options.on || "true"
                                : w.options.off || "false",
                            widget_width - 40,
                            y + H * 0.7
                        );
                    }
                    break;
                case "slider":
                    ctx.fillStyle = background_color;
                    ctx.fillRect(margin, y, widget_width - margin * 2, H);
                    var range = w.options.max - w.options.min;
                    var nvalue = (w.value - w.options.min) / range;
                    ctx.fillStyle = activeWidget == w ? "#89A" : "#678";
                    ctx.fillRect(margin, y, nvalue * (widget_width - margin * 2), H);
                    if (show_text && !w.disabled)
                        ctx.strokeRect(margin, y, widget_width - margin * 2, H);
                    if (w.marker) {
                        var marker_nvalue = ((+w.marker) - w.options.min) / range;
                        ctx.fillStyle = "#AA9";
                        ctx.fillRect(margin + marker_nvalue * (widget_width - margin * 2), y, 2, H);
                    }
                    if (show_text) {
                        ctx.textAlign = "center";
                        ctx.fillStyle = text_color;
                        ctx.fillText(
                            w.name + "  " + Number(w.value).toFixed(3),
                            widget_width * 0.5,
                            y + H * 0.7
                        );
                    }
                    break;
                case "number":
                case "combo":
                    ctx.textAlign = "left";
                    ctx.strokeStyle = outline_color;
                    ctx.fillStyle = background_color;
                    ctx.beginPath();
                    if (show_text)
                        (ctx as any).roundRect(margin, y, widget_width - margin * 2, H, [H * 0.5]);
                    else
                        ctx.rect(margin, y, widget_width - margin * 2, H);
                    ctx.fill();
                    if (show_text) {
                        if (!w.disabled && !LiteGraph.ignore_all_widget_events)
                            ctx.stroke();
                        ctx.fillStyle = text_color;
                        if (!w.disabled && !LiteGraph.ignore_all_widget_events) {
                            ctx.beginPath();
                            ctx.moveTo(margin + 16, y + 5);
                            ctx.lineTo(margin + 6, y + H * 0.5);
                            ctx.lineTo(margin + 16, y + H - 5);
                            ctx.fill();
                            ctx.beginPath();
                            ctx.moveTo(widget_width - margin - 16, y + 5);
                            ctx.lineTo(widget_width - margin - 6, y + H * 0.5);
                            ctx.lineTo(widget_width - margin - 16, y + H - 5);
                            ctx.fill();
                        }
                        ctx.fillStyle = secondary_text_color;
                        ctx.fillText(w.name, margin * 2 + 5, y + H * 0.7);
                        ctx.fillStyle = text_color;
                        ctx.textAlign = "right";
                        if (w.type == "number") {
                            ctx.fillText(
                                Number(w.value).toFixed(
                                    w.options.precision !== undefined
                                        ? w.options.precision
                                        : 3
                                ),
                                widget_width - margin * 2 - 20,
                                y + H * 0.7
                            );
                        } else {
                            var v = w.value;
                            if (w.options.values) {
                                var values = w.options.values;
                                if (values.constructor === Function)
                                    values = values();
                                if (values && values.constructor !== Array)
                                    v = values[w.value];
                            }
                            ctx.fillText(
                                v,
                                widget_width - margin * 2 - 20,
                                y + H * 0.7
                            );
                        }
                    }
                    break;
                case "string":
                case "text":
                    ctx.textAlign = "left";
                    ctx.strokeStyle = outline_color;
                    ctx.fillStyle = background_color;
                    ctx.beginPath();
                    if (show_text)
                        (ctx as any).roundRect(margin, y, widget_width - margin * 2, H, [H * 0.5]);
                    else
                        ctx.rect(margin, y, widget_width - margin * 2, H);
                    ctx.fill();
                    if (show_text) {
                        if (!w.disabled)
                            ctx.stroke();
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(margin, y, widget_width - margin * 2, H);
                        ctx.clip();

                        //ctx.stroke();
                        ctx.fillStyle = secondary_text_color;
                        if (w.name != null) {
                            ctx.fillText(w.name, margin * 2, y + H * 0.7);
                        }
                        ctx.fillStyle = text_color;
                        ctx.textAlign = "right";
                        ctx.fillText(String(w.value).substr(0, w.options.max_length || 30), widget_width - margin * 2, y + H * 0.7);
                        ctx.restore();
                    }
                    break;
                default:
                    if (w.draw) {
                        w.draw(ctx, node, widget_width, y, H);
                    }
                    break;
            }
            posY += (w.computeSize ? w.computeSize(widget_width)[1] : H) + 4;
            ctx.globalAlpha = this.editor_alpha;

        }
        ctx.restore();
        ctx.textAlign = "left";
    }
}

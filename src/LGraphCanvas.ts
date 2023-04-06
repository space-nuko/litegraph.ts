import type { ContextMenuItem } from "./ContextMenu";
import ContextMenu from "./ContextMenu";
import type { DragEventExt, MouseEventExt, EventExt } from "./DragAndScale";
import DragAndScale from "./DragAndScale";
import type { INodeInputSlot, INodeOutputSlot, default as INodeSlot, SlotNameOrIndex, SlotIndex } from "./INodeSlot";
import type IWidget from "./IWidget";
import LGraph from "./LGraph";
import LGraphCanvas_Rendering from "./LGraphCanvas_Rendering";
import LGraphCanvas_UI from "./LGraphCanvas_UI";
import LGraphGroup from "./LGraphGroup";
import LGraphNode, { type NodeTypeOpts } from "./LGraphNode";
import LiteGraph from "./LiteGraph";
import LLink from "./LLink";
import type GraphInput from "./nodes/basic/GraphInput";
import type GraphOutput from "./nodes/basic/GraphOutput";
import { BuiltInSlotType, type Vector2, type Vector4 } from "./types";
import { LinkRenderMode } from "./types";
import { clamp } from "./utils";

export interface IGraphDialog extends HTMLDivElement {
    close: () => void;
    modified: () => void;
    is_modified?: boolean;
    node?: LGraphNode;
    graph?: LGraph;
};

/**
 * This class is in charge of rendering one graph inside a canvas. And provides all the interaction required.
 * Valid callbacks are: onNodeSelected, onNodeDeselected, onShowNodePanel, onNodeDblClicked
 *
 * @param canvas the canvas where you want to render (it accepts a selector in string format or the canvas element itself)
 * @param graph
 * @param options { skip_rendering, autoresize }
 */
export default class LGraphCanvas implements LGraphCanvas_Rendering, LGraphCanvas_UI {
    static DEFAULT_BACKGROUND_IMAGE: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNrs1rEKwjAUhlETUkj3vP9rdmr1Ysammk2w5wdxuLgcMHyptfawuZX4pJSWZTnfnu/lnIe/jNNxHHGNn//HNbbv+4dr6V+11uF527arU7+u63qfa/bnmh8sWLBgwYJlqRf8MEptXPBXJXa37BSl3ixYsGDBMliwFLyCV/DeLIMFCxYsWLBMwSt4Be/NggXLYMGCBUvBK3iNruC9WbBgwYJlsGApeAWv4L1ZBgsWLFiwYJmCV/AK3psFC5bBggULloJX8BpdwXuzYMGCBctgwVLwCl7Be7MMFixYsGDBsu8FH1FaSmExVfAxBa/gvVmwYMGCZbBg/W4vAQYA5tRF9QYlv/QAAAAASUVORK5CYII=";

    static node_colors: Record<
        string,
    {
            color: string;
            bgColor: string;
            groupcolor: string;
        }
    >;
    static link_type_colors: Record<string, string>;
    static gradients: object;
    static search_limit: number;

    static getFileExtension(url: string): string {
        var question = url.indexOf("?");
        if (question != -1) {
            url = url.substr(0, question);
        }
        var point = url.lastIndexOf(".");
        if (point == -1) {
            return "";
        }
        return url.substr(point + 1).toLowerCase();
    }

    static decodeHTML(str: string): string {
        var e = document.createElement("div");
        e.innerText = str;
        return e.innerHTML;
    }

    constructor(
        canvas: HTMLCanvasElement | string,
        graph?: LGraph,
        options: {
            skip_render?: boolean;
            skip_events?: boolean;
            autoresize?: boolean;
            viewport?: Vector4;
        } = {}
    ) {
        if (typeof canvas === "string") {
            canvas = document.querySelector(canvas) as HTMLCanvasElement;
        }

        this.skip_events = options.skip_events || false;

        this.title_text_font = "" + LiteGraph.NODE_TEXT_SIZE + "px Arial";
        this.inner_text_font =
            "normal " + LiteGraph.NODE_SUBTEXT_SIZE + "px Arial";
        this.node_title_color = LiteGraph.NODE_TITLE_COLOR;
        this.default_link_color = LiteGraph.LINK_COLOR;
        this.default_connection_color = {
            input_off: "#778",
            input_on: "#7F7", //"#BBD"
            output_off: "#778",
            output_on: "#7F7" //"#BBD"
		};
        // this.default_connection_color_byType = {
        /*number: "#7F7",
          string: "#77F",
          boolean: "#F77",*/
        // }
        // this.default_connection_color_byTypeOff = {
        /*number: "#474",
          string: "#447",
          boolean: "#744",*/
        // };

		this.canvas_mouse = this.graph_mouse; //LEGACY: REMOVE THIS, USE GRAPH_MOUSE INSTEAD

        this.visible_area = this.ds.visible_area;

		this.viewport = options.viewport || null; //to constraint render area to a portion of the canvas

        //link canvas and graph
        if (graph) {
            graph.attachCanvas(this);
        }

        this.setCanvas(canvas,options.skip_events);
        this.clear();

        if (!options.skip_render) {
            this.startRendering();
        }

        this.autoresize = options.autoresize;
    }

    static active_canvas: LGraphCanvas | null = null
    static active_node: LGraphNode | null = null;

    node_panel: HTMLElement | null = null;
    options_panel: HTMLElement | null = null;

    viewport: Vector4 | null;
    render_time: number = 0;

    allow_dragcanvas: boolean = true;
    allow_dragnodes: boolean = true;
    /** allow to control widgets, buttons, collapse, etc */
    allow_interaction: boolean = true;
    /** allows to change a connection with having to redo it again */
    allow_reconnect_links: boolean = true;
    /** No effect */
    allow_searchbox: boolean = true;
    align_to_grid: false; // snap to grid
    always_render_background: boolean = false;
    autoresize?: boolean;
    background_image: string = LGraphCanvas.DEFAULT_BACKGROUND_IMAGE;
    bgcanvas: HTMLCanvasElement;
    bgctx: CanvasRenderingContext2D;
    block_click: boolean = false;
    canvas: HTMLCanvasElement;
    canvas_mouse: Vector2;
    clear_background: boolean;
    connecting_node: LGraphNode | null;
    connecting_pos: Vector2 | null = null;
    connecting_slot: SlotIndex | null = null;
    connecting_input: INodeInputSlot | null = null;
    connecting_output: INodeOutputSlot | null = null;
    connections_width: number = 3;
    ctx: CanvasRenderingContext2D;
    current_node: LGraphNode | null = null;
    default_connection_color: {
        input_off: string;
        input_on: string;
        output_off: string;
        output_on: string;
    };
    default_link_color: string;
    dirty_area: Vector4 | null;
    dirty_bgcanvas?: boolean;
    dirty_canvas?: boolean;
    drag_mode: boolean = false;
    dragging_canvas: boolean;
    dragging_rectangle: Float32Array | null = null;
    ds: DragAndScale = new DragAndScale();
    /** used for transition */
    editor_alpha: number = 1;
    /** allows to filter to only accept some type of nodes in a graph */
    filter: any = null;
    fps: number;
    frame: number;
    graph: LGraph;
    highlighted_links: Record<number, boolean>;
    highquality_render: boolean = true;
    inner_text_font: string;
    is_rendering: boolean;
    last_draw_time: number;
    last_mouse: Vector2;
    skip_events: boolean = false;
    /**
     * Possible duplicated with `last_mouse`
     * https://github.com/jagenjo/litegraph.js/issues/70
     */
    last_mouse_position: Vector2 = [0, 0];
    last_click_position: Vector2 = [0, 0];
    /** Timestamp of last mouse click, defaults to 0 */
    last_mouseclick: number;
    last_mouse_dragging: boolean = false;
    links_render_mode: LinkRenderMode = LinkRenderMode.SPLINE_LINK;
    live_mode: boolean = false;
    /** mouse in canvas coordinates, where 0,0 is the top-left corner of the blue rectangle */
    mouse: Vector2 = [0, 0];
    /** mouse in graph coordinates, where 0,0 is the top-left corner of the blue rectangle */
    graph_mouse: Vector2 = [0, 0];
    node_capturing_input: LGraphNode | null;
    node_dragged: LGraphNode | null;
    node_in_panel: LGraphNode | null;
    node_over: LGraphNode | null;
    node_title_color: string;
    node_widget: [LGraphNode, IWidget] | null = null;
    /** allow selecting multi nodes without pressing extra keys */
    multi_select: boolean = false;
    over_link_center: LLink | null = null;
    /** Called by `LGraphCanvas.clear` */
    onClear?(): void;
    /** Called by `LGraphCanvas.drawBackCanvas` */
    /** to render background objects (behind nodes and connections) in the canvas affected by transform */
    onDrawBackground?(ctx: CanvasRenderingContext2D, visibleArea: Float32Array): void;
    /** Called by `LGraphCanvas.drawFrontCanvas` */
    /** to render foreground objects (above nodes and connections) in the canvas affected by transform */
    onDrawForeground?(ctx: CanvasRenderingContext2D, visibleArea: Float32Array): void;
    /** to render foreground objects not affected by transform (for GUIs) */
    onDrawOverlay?(ctx: CanvasRenderingContext2D): void;
    /** Called by `LGraphCanvas.processMouseDown` */
    onMouse?(event: MouseEventExt): boolean;
    onMouseDown?(event: MouseEventExt): boolean;
    /** Called by `LGraphCanvas.drawFrontCanvas` and `LGraphCanvas.drawLinkTooltip` */
    /** called when rendering a tooltip */
    onDrawLinkTooltip?(ctx: CanvasRenderingContext2D, link: LLink, _this: this): boolean | undefined;
    /** Called by `LGraphCanvas.selectNodes` */
    /** called after moving a node */
    onNodeMoved?(node: LGraphNode): void;
    /** Called by `LGraphCanvas.processNodeSelected` */
    onNodeSelected?(node: LGraphNode): void;
    /** Called by `LGraphCanvas.deselectNode` */
    onNodeDeselected?(node: LGraphNode): void;
    /** Called by `LGraphCanvas.processNodeDblClicked` */
    onShowNodePanel?(node: LGraphNode): void;
    /** Called by `LGraphCanvas.processNodeDblClicked` */
    onNodeDblClicked?(node: LGraphNode): void;
    /** Called by `LGraphCanvas.selectNodes` */
    /** called if the selection changes */
    onSelectionChange?(nodes: Record<number, LGraphNode>): void;
    /** Called by `LGraphCanvas.showSearchBox` */
    onSearchBox?(helper: Element, value: string, graphCanvas: LGraphCanvas): string[];
    onSearchBoxSelection?(name: string, event: MouseEvent, graphCanvas: LGraphCanvas): void;
    /** Called by `getCanvasMenuOptions`, replace default options */
    getMenuOptions?(graphCanvas: LGraphCanvas): ContextMenuItem[];
    /** Called by `getCanvasMenuOptions`, append to default options */
    getExtraMenuOptions?(graphCanvas: LGraphCanvas, options: ContextMenuItem[]): ContextMenuItem[] | null;
    pause_rendering: boolean = false;
    /** if set to true users cannot modify the graph */
    read_only: boolean = false;
    render_canvas_border: boolean = true;
    render_collapsed_slots: boolean = true;
    render_connection_arrows: boolean = false;
    render_connections_border: boolean = true;
    /** too much cpu */
    render_connections_shadows: boolean = false;
    render_curved_connections: boolean = false;
    render_execution_order: boolean = false;
    render_link_tooltip: boolean = true;
    render_only_selected: boolean = true;
    render_shadows: boolean = true;
    render_title_colored: boolean = true;
    round_radius: number = 8;
    selected_group: null | LGraphGroup;
    selected_group_resizing: boolean;
    selected_nodes: Record<number, LGraphNode>;
    /** forces to redraw the canvas if the mouse does anything */
    set_canvas_dirty_on_mouse_event: boolean = true;
    show_info: boolean = true;
    title_text_font: string;
    /** set to true to render title bar with gradients */
    use_gradients: boolean = false;
    visible_area: DragAndScale["visible_area"];
    visible_links: LLink[] = [];
    visible_nodes: LGraphNode[];
    zoom_modify_alpha: boolean = true;

    pointer_is_down: boolean = false;
    pointer_is_double: boolean = false;

    private _highlight_input: Vector2 | null = null;
    private _highlight_input_slot: INodeSlot | null = null;
    private _highlight_output: Vector2 | null = null;

    _graph_stack: LGraph[] | null = null;

    private _bg_img: HTMLImageElement | null = null;
    private _pattern: CanvasPattern | null = null;
    private _pattern_img: HTMLImageElement | null = null;

    search_box: IGraphDialog | null = null;
    prompt_box: IGraphDialog | null = null;

    /** clears all the data inside */
    clear(): void {
        this.frame = 0;
        this.last_draw_time = 0;
        this.render_time = 0;
        this.fps = 0;

        //this.scale = 1;
        //this.offset = [0,0];

        this.dragging_rectangle = null;

        this.selected_nodes = {};
        this.selected_group = null;

        this.visible_nodes = [];
        this.node_dragged = null;
        this.node_over = null;
        this.node_capturing_input = null;
        this.connecting_node = null;
        this.highlighted_links = {};

		this.dragging_canvas = false;

        this.dirty_canvas = true;
        this.dirty_bgcanvas = true;
        this.dirty_area = null;

        this.node_in_panel = null;
        this.node_widget = null;

        this.last_mouse = [0, 0];
        this.last_mouseclick = 0;
	  	this.pointer_is_down = false;
	  	this.pointer_is_double = false;
        this.visible_area = new Float32Array([0, 0, 0, 0])

        if (this.onClear) {
            this.onClear();
        }
    }

    /** assigns a graph, you can reassign graphs to the same canvas */
    setGraph(graph: LGraph, skipClear: boolean = false): void {
        if (this.graph == graph) {
            return;
        }

        if (!skipClear) {
            this.clear();
        }

        if (!graph && this.graph) {
            this.graph.detachCanvas(this);
            return;
        }

        graph.attachCanvas(this);

		//remove the graph stack in case a subgraph was open
		if (this._graph_stack)
			this._graph_stack = null;

        this.setDirty(true, true);
    }

    /** opens a graph contained inside a node in the current graph */
    openSubgraph(graph: LGraph): void {
        if (!graph) {
            throw "graph cannot be null";
        }

        if (this.graph == graph) {
            throw "graph cannot be the same";
        }

        this.clear();

        if (this.graph) {
            if (!this._graph_stack) {
                this._graph_stack = [];
            }
            this._graph_stack.push(this.graph);
        }

        graph.attachCanvas(this);
		this.checkPanels();
        this.setDirty(true, true);
    }

    /** closes a subgraph contained inside a node */
    closeSubgraph(): void {
        if (!this._graph_stack || this._graph_stack.length == 0) {
            return;
        }
        var subgraph_node = (this.graph as any)._subgraph_node;
        var graph = this._graph_stack.pop();
        this.selected_nodes = {};
        this.highlighted_links = {};
        graph.attachCanvas(this);
        this.setDirty(true, true);
        if (subgraph_node) {
            this.centerOnNode(subgraph_node);
            this.selectNodes([subgraph_node]);
        }
        // when close sub graph back to offset [0, 0] scale 1
        this.ds.offset = [0, 0]
        this.ds.scale = 1
    }

    /** assigns a canvas */
    setCanvas(canvas: HTMLCanvasElement | string, skipEvents: boolean = false): void {
        var that = this;

        if (canvas) {
            if (typeof canvas === "string") {
                canvas = document.getElementById(canvas) as HTMLCanvasElement;
                if (!canvas) {
                    throw "Error creating LiteGraph canvas: Canvas not found";
                }
            }
        }

        canvas = canvas as HTMLCanvasElement;

        if (canvas === this.canvas) {
            return;
        }

        if (!canvas && this.canvas) {
            //maybe detach events from old_canvas
            if (!skipEvents) {
                this.unbindEvents();
            }
        }

        this.canvas = canvas;
        this.ds.element = canvas;

        if (!canvas) {
            return;
        }

        //this.canvas.tabindex = "1000";
        canvas.className += " lgraphcanvas";
        (canvas as any).data = this;
        canvas.tabIndex = 1; //to allow key events

        //bg canvas: used for non changing stuff
        this.bgcanvas = null;
        if (!this.bgcanvas) {
            this.bgcanvas = document.createElement("canvas");
            this.bgcanvas.width = this.canvas.width;
            this.bgcanvas.height = this.canvas.height;
        }

        if (canvas.getContext == null) {
            if (canvas.localName != "canvas") {
                throw "Element supplied for LGraphCanvas must be a <canvas> element, you passed a " +
                    canvas.localName;
            }
            throw "This browser doesn't support Canvas";
        }

        /* TODO implement
           var ctx = (this.ctx = canvas.getContext("2d"));
           if (ctx == null) {
           if (!canvas.webgl_enabled) {
           console.warn(
           "This canvas seems to be WebGL, enabling WebGL renderer"
           );
           }
           this.enableWebGL();
           }
        */

        //input:  (move and up could be unbinded)
        // why here? this._mousemove_callback = this.processMouseMove.bind(this);
        // why here? this._mouseup_callback = this.processMouseUp.bind(this);

        if (!skipEvents) {
            this.bindEvents();
        }
    }

    private _events_binded: boolean = false;

    private _mousedown_callback?: EventListenerObject;
    private _mousewheel_callback?: EventListenerObject;
    private _mousemove_callback?: EventListenerObject;
    private _mouseup_callback?: EventListenerObject;
    private _key_callback?: EventListenerObject;
    private _ondrop_callback?: EventListenerObject;

    //used in some events to capture them
    private _doNothing(e: Event) {
        if (LiteGraph.debug)
            console.log("pointerevents: _doNothing "+e.type);
        e.preventDefault();
        return false;
    };
    private _doReturnTrue(e: Event) {
        if (LiteGraph.debug)
            console.log("pointerevents: _doReturnTrue "+e.type);
        e.preventDefault();
        return true;
    };

    /** binds mouse, keyboard, touch and drag events to the canvas */
    bindEvents(): void {
        if (this._events_binded) {
            console.warn("LGraphCanvas: events already binded");
            return;
        }

        //console.log("pointerevents: bindEvents");

        var canvas = this.canvas;

        var ref_window = this.getCanvasWindow();
        var document = ref_window.document; //hack used when moving canvas between windows

        this._mousedown_callback = this.processMouseDown.bind(this);
        this._mousewheel_callback = this.processMouseWheel.bind(this);
        // why mousemove and mouseup were not binded here?
        this._mousemove_callback = this.processMouseMove.bind(this);
        this._mouseup_callback = this.processMouseUp.bind(this);

        //touch events -- TODO IMPLEMENT
        //this._touch_callback = this.touchHandler.bind(this);

		LiteGraph.pointerListenerAdd(canvas,"down", this._mousedown_callback, true); //down do not need to store the binded
        canvas.addEventListener("mousewheel", this._mousewheel_callback, false);

        LiteGraph.pointerListenerAdd(canvas,"up", this._mouseup_callback, true); // CHECK: ??? binded or not
		LiteGraph.pointerListenerAdd(canvas,"move", this._mousemove_callback);

        canvas.addEventListener("contextmenu", this._doNothing);
        canvas.addEventListener(
            "DOMMouseScroll",
            this._mousewheel_callback,
            false
        );

        //touch events -- THIS WAY DOES NOT WORK, finish implementing pointerevents, than clean the touchevents
        /*if( 'touchstart' in document.documentElement )
          {
          canvas.addEventListener("touchstart", this._touch_callback, true);
          canvas.addEventListener("touchmove", this._touch_callback, true);
          canvas.addEventListener("touchend", this._touch_callback, true);
          canvas.addEventListener("touchcancel", this._touch_callback, true);
          }*/

        //Keyboard ******************
        this._key_callback = this.processKey.bind(this);

        canvas.addEventListener("keydown", this._key_callback, true);
        document.addEventListener("keyup", this._key_callback, true); //in document, otherwise it doesn't fire keyup

        //Dropping Stuff over nodes ************************************
        this._ondrop_callback = this.processDrop.bind(this);

        canvas.addEventListener("dragover", this._doNothing, false);
        canvas.addEventListener("dragend", this._doNothing, false);
        canvas.addEventListener("drop", this._ondrop_callback, false);
        canvas.addEventListener("dragenter", this._doReturnTrue, false);

        this._events_binded = true;
    }

    /** unbinds mouse events from the canvas */
    unbindEvents(): void {
        if (!this._events_binded) {
            console.warn("LGraphCanvas: no events binded");
            return;
        }

        if (LiteGraph.debug)
            console.log("pointerevents: unbindEvents");

        var ref_window = this.getCanvasWindow();
        var document = ref_window.document;

		LiteGraph.pointerListenerRemove(this.canvas,"move", this._mousedown_callback);
        LiteGraph.pointerListenerRemove(this.canvas,"up", this._mousedown_callback);
        LiteGraph.pointerListenerRemove(this.canvas,"down", this._mousedown_callback);
        this.canvas.removeEventListener(
            "mousewheel",
            this._mousewheel_callback
        );
        this.canvas.removeEventListener(
            "DOMMouseScroll",
            this._mousewheel_callback
        );
        this.canvas.removeEventListener("keydown", this._key_callback);
        document.removeEventListener("keyup", this._key_callback);
        this.canvas.removeEventListener("contextmenu", this._doNothing);
        this.canvas.removeEventListener("drop", this._ondrop_callback);
        this.canvas.removeEventListener("dragenter", this._doReturnTrue);

        //touch events -- THIS WAY DOES NOT WORK, finish implementing pointerevents, than clean the touchevents
        /*this.canvas.removeEventListener("touchstart", this._touch_callback );
          this.canvas.removeEventListener("touchmove", this._touch_callback );
          this.canvas.removeEventListener("touchend", this._touch_callback );
          this.canvas.removeEventListener("touchcancel", this._touch_callback );*/

        this._mousedown_callback = null;
        this._mousewheel_callback = null;
        this._key_callback = null;
        this._ondrop_callback = null;

        this._events_binded = false;
    }

    /**
     * this function allows to render the canvas using WebGL instead of Canvas2D
     * this is useful if you plant to render 3D objects inside your nodes, it uses litegl.js for webgl and canvas2DtoWebGL to emulate the Canvas2D calls in webGL
     **/
    enableWebGL(): void {
        // TODO implement
        // if (typeof GL === undefined) {
        //     throw "litegl.js must be included to use a WebGL canvas";
        // }
        // if (typeof enableWebGLCanvas === undefined) {
        //     throw "webglCanvas.js must be included to use this feature";
        // }

        // this.gl = this.ctx = enableWebGLCanvas(this.canvas);
        // this.ctx.webgl = true;
        // this.bgcanvas = this.canvas;
        // this.bgctx = this.gl;
        // this.canvas.webgl_enabled = true;
    }

    /**
     * marks as dirty the canvas, this way it will be rendered again
     * @param fg if the foreground canvas is dirty (the one containing the nodes)
     * @param bg if the background canvas is dirty (the one containing the wires)
     */
    setDirty(fg: boolean = false, bg: boolean = false): void {
        if (fg) {
            this.dirty_canvas = true;
        }
        if (bg) {
            this.dirty_bgcanvas = true;
        }
    }

    /**
     * Used to attach the canvas in a popup
     * @return the window where the canvas is attached (the DOM root node)
     */
    getCanvasWindow(): Window {
        if (!this.canvas) {
            return window;
        }
        var doc = this.canvas.ownerDocument;
        return doc.defaultView;
    }

    /** starts rendering the content of the canvas when needed */
    startRendering(): void {
        if (this.is_rendering) {
            return;
        } //already rendering

        this.is_rendering = true;
        renderFrame.call(this);

        function renderFrame() {
            if (!this.pause_rendering) {
                this.draw();
            }

            var window = this.getCanvasWindow();
            if (this.is_rendering) {
                window.requestAnimationFrame(renderFrame.bind(this));
            }
        }
    }

    /** stops rendering the content of the canvas (to save resources) */
    stopRendering(): void {
        this.is_rendering = false;
    }

	//used to block future mouse events (because of im gui)
	blockClick(): void
	{
		this.block_click = true;
		this.last_mouseclick = 0;
	}

    resizing_node: LGraphNode | null = null;

    processMouseDown(_e: MouseEvent): boolean | undefined {
		if( this.set_canvas_dirty_on_mouse_event )
			this.dirty_canvas = true;

		if (!this.graph) {
            return;
        }

        let e = _e as MouseEventExt;

        this.adjustMouseEvent(e);

        var ref_window = this.getCanvasWindow();
        var document = ref_window.document;
        LGraphCanvas.active_canvas = this;
        var that = this;

		var x = e.clientX;
		var y = e.clientY;
		//console.log(y,this.viewport);
		//console.log("pointerevents: processMouseDown pointerId:"+e.pointerId+" which:"+e.which+" isPrimary:"+e.isPrimary+" :: x y "+x+" "+y);

		this.ds.viewport = this.viewport;
		var is_inside = !this.viewport || ( this.viewport && x >= this.viewport[0] && x < (this.viewport[0] + this.viewport[2]) && y >= this.viewport[1] && y < (this.viewport[1] + this.viewport[3]) );

        //move mouse move event to the window in case it drags outside of the canvas
		if(!this.skip_events)
		{
			LiteGraph.pointerListenerRemove(this.canvas,"move", this._mousemove_callback);
			LiteGraph.pointerListenerAdd(ref_window.document,"move", this._mousemove_callback,true); //catch for the entire window
			LiteGraph.pointerListenerAdd(ref_window.document,"up", this._mouseup_callback,true);
		}

		if(!is_inside){
			return;
		}

        var node = this.graph.getNodeOnPos( e.canvasX, e.canvasY, this.visible_nodes, 5 );
        var skip_dragging = false;
        var skip_action = false;
        var now = LiteGraph.getTime();
		var is_primary = (!(e instanceof PointerEvent) || !e.isPrimary);
        var is_double_click = (now - this.last_mouseclick < 300) && is_primary;
		this.mouse[0] = e.clientX;
		this.mouse[1] = e.clientY;
        this.graph_mouse[0] = e.canvasX;
        this.graph_mouse[1] = e.canvasY;
		this.last_click_position = [this.mouse[0],this.mouse[1]];

	  	if (this.pointer_is_down && is_primary ){
		    this.pointer_is_double = true;
		    //console.log("pointerevents: pointer_is_double start");
		}else{
		    this.pointer_is_double = false;
		}
	  	this.pointer_is_down = true;


        this.canvas.focus();

        ContextMenu.closeAllContextMenus(ref_window);

        if (this.onMouse)
		{
            if (this.onMouse(e) == true)
                return;
        }

		//left button mouse / single finger
        if (e.which == 1 && !this.pointer_is_double)
		{
            if (e.ctrlKey)
			{
                this.dragging_rectangle = new Float32Array(4);
                this.dragging_rectangle[0] = e.canvasX;
                this.dragging_rectangle[1] = e.canvasY;
                this.dragging_rectangle[2] = 1;
                this.dragging_rectangle[3] = 1;
                skip_action = true;
            }

            // clone node ALT dragging
            if (LiteGraph.alt_drag_do_clone_nodes && e.altKey && node && this.allow_interaction && !skip_action && !this.read_only)
            {
                let cloned = node.clone();
                if (cloned) {
                    cloned.pos[0] += 5;
                    cloned.pos[1] += 5;
                    this.graph.add(cloned,false, {doCalcSize: false});
                    node = cloned;
                    skip_action = true;
                    if (!block_drag_node) {
                        if (this.allow_dragnodes) {
							this.graph.beforeChange();
                            this.node_dragged = node;
                        }
                        if (!this.selected_nodes[node.id]) {
                            this.processNodeSelected(node, e);
                        }
                    }
                }
            }

            var clicking_canvas_bg = false;

            //when clicked on top of a node
            //and it is not interactive
            if (node && this.allow_interaction && !skip_action && !this.read_only) {
                if (!this.live_mode && !node.flags.pinned) {
                    this.bringToFront(node);
                } //if it wasn't selected?

                //not dragging mouse to connect two slots
                if ( !this.connecting_node && !node.flags.collapsed && !this.live_mode ) {
                    //Search for corner for resize
                    if ( !skip_action &&
                        node.resizable !== false &&
                        LiteGraph.isInsideRectangle( e.canvasX,
                                                     e.canvasY,
                                                     node.pos[0] + node.size[0] - 5,
                                                     node.pos[1] + node.size[1] - 5,
                                                     10,
                                                     10
                                                   )
                       ) {
						this.graph.beforeChange();
                        this.resizing_node = node;
                        this.canvas.style.cursor = "se-resize";
                        skip_action = true;
                    } else {
                        //search for outputs
                        if (node.outputs) {
                            for ( var i = 0, l = node.outputs.length; i < l; ++i ) {
                                var output = node.outputs[i];
                                var link_pos = node.getConnectionPos(false, i);
                                if (
                                    LiteGraph.isInsideRectangle(
                                        e.canvasX,
                                        e.canvasY,
                                        link_pos[0] - 15,
                                        link_pos[1] - 10,
                                        30,
                                        20
                                    )
                                ) {
                                    this.connecting_node = node;
                                    this.connecting_output = output;
                                    this.connecting_output.slot_index = i;
                                    this.connecting_pos = node.getConnectionPos( false, i );
                                    this.connecting_slot = i;

                                    if (LiteGraph.shift_click_do_break_link_from){
                                        if (e.shiftKey) {
                                            node.disconnectOutput(i);
                                        }
                                    }

                                    if (is_double_click) {
                                        if (node.onOutputDblClick) {
                                            node.onOutputDblClick(i, e);
                                        }
                                    } else {
                                        if (node.onOutputClick) {
                                            node.onOutputClick(i, e);
                                        }
                                    }

                                    skip_action = true;
                                    break;
                                }
                            }
                        }

                        //search for inputs
                        if (node.inputs) {
                            for ( var i = 0, l = node.inputs.length; i < l; ++i ) {
                                var input = node.inputs[i];
                                var link_pos = node.getConnectionPos(true, i);
                                if (
                                    LiteGraph.isInsideRectangle(
                                        e.canvasX,
                                        e.canvasY,
                                        link_pos[0] - 15,
                                        link_pos[1] - 10,
                                        30,
                                        20
                                    )
                                ) {
                                    if (is_double_click) {
                                        if (node.onInputDblClick) {
                                            node.onInputDblClick(i, e);
                                        }
                                    } else {
                                        if (node.onInputClick) {
                                            node.onInputClick(i, e);
                                        }
                                    }

                                    if (input.link !== null) {
                                        var link_info = this.graph.links[
                                            input.link
                                        ]; //before disconnecting
                                        if (LiteGraph.click_do_break_link_to){
                                            node.disconnectInput(i);
                                            this.dirty_bgcanvas = true;
                                            skip_action = true;
                                        }else{
                                            // do same action as has not node ?
                                        }

                                        if (
                                            this.allow_reconnect_links ||
											    //this.move_destination_link_without_shift ||
                                                e.shiftKey
                                        ) {
                                            if (!LiteGraph.click_do_break_link_to){
                                                node.disconnectInput(i);
                                            }
                                            this.connecting_node = (this.graph as any)._nodes_by_id[
                                                link_info.origin_id
                                            ];
                                            this.connecting_slot =
                                                link_info.origin_slot;
                                            this.connecting_output = this.connecting_node.outputs[
                                                this.connecting_slot
                                            ];
                                            this.connecting_pos = this.connecting_node.getConnectionPos( false, this.connecting_slot );

                                            this.dirty_bgcanvas = true;
                                            skip_action = true;
                                        }


                                    }else{
                                        // has not node
                                    }

                                    if (!skip_action){
                                        // connect from in to out, from to to from
                                        this.connecting_node = node;
                                        this.connecting_input = input;
                                        this.connecting_input.slot_index = i;
                                        this.connecting_pos = node.getConnectionPos( true, i );
                                        this.connecting_slot = i;

                                        this.dirty_bgcanvas = true;
                                        skip_action = true;
                                    }
                                }
                            }
                        }
                    } //not resizing
                }

                //it wasn't clicked on the links boxes
                if (!skip_action) {
                    var block_drag_node = false;
					var pos: Vector2 = [e.canvasX - node.pos[0], e.canvasY - node.pos[1]];

                    //widgets
                    var widget = this.processNodeWidgets( node, this.graph_mouse, e );
                    if (widget) {
                        block_drag_node = true;
                        this.node_widget = [node, widget];
                    }

                    //double clicking
                    if (is_double_click && this.selected_nodes[node.id]) {
                        //double click node
                        if (node.onDblClick) {
                            node.onDblClick( e, pos, this );
                        }
                        this.processNodeDblClicked(node);
                        block_drag_node = true;
                    }

                    //if do not capture mouse
                    if ( node.onMouseDown && node.onMouseDown( e, pos, this ) ) {
                        block_drag_node = true;
                    } else {
						//open subgraph button
						if(node.subgraph && !node.skip_subgraph_button)
						{
							if ( !node.flags.collapsed && pos[0] > node.size[0] - LiteGraph.NODE_TITLE_HEIGHT && pos[1] < 0 ) {
								var that = this;
								setTimeout(function() {
									that.openSubgraph(node.subgraph);
								}, 10);
							}
						}

						if (this.live_mode) {
							clicking_canvas_bg = true;
	                        block_drag_node = true;
						}
                    }

                    if (!block_drag_node) {
                        if (this.allow_dragnodes) {
							this.graph.beforeChange();
                            this.node_dragged = node;
                        }
                        if (!this.selected_nodes[node.id]) {
                            this.processNodeSelected(node, e);
                        }
                    }

                    this.dirty_canvas = true;
                }
            } //clicked outside of nodes
            else {
				if (!skip_action){
					//search for link connector
					if(!this.read_only) {
						for (var i = 0; i < this.visible_links.length; ++i) {
							var link = this.visible_links[i];
							var center = link._pos;
							if (
								!center ||
								    e.canvasX < center[0] - 4 ||
								    e.canvasX > center[0] + 4 ||
								    e.canvasY < center[1] - 4 ||
								    e.canvasY > center[1] + 4
							) {
								continue;
							}
							//link clicked
							this.showLinkMenu(link, e);
							this.over_link_center = null; //clear tooltip
							break;
						}
					}

					this.selected_group = this.graph.getGroupOnPos( e.canvasX, e.canvasY );
					this.selected_group_resizing = false;
					if (this.selected_group && !this.read_only ) {
						if (e.ctrlKey) {
							this.dragging_rectangle = null;
						}

						var dist = LiteGraph.distance( [e.canvasX, e.canvasY], [ this.selected_group.pos[0] + this.selected_group.size[0], this.selected_group.pos[1] + this.selected_group.size[1] ] );
						if (dist * this.ds.scale < 10) {
							this.selected_group_resizing = true;
						} else {
							this.selected_group.recomputeInsideNodes();
						}
					}

					if (is_double_click && !this.read_only && this.allow_searchbox) {
						this.showSearchBox(e);
						e.preventDefault();
						e.stopPropagation();
					}

					clicking_canvas_bg = true;
				}
            }

            if (!skip_action && clicking_canvas_bg && this.allow_dragcanvas) {
            	//console.log("pointerevents: dragging_canvas start");
            	this.dragging_canvas = true;
            }

        } else if (e.which == 2) {
            //middle button

			if (LiteGraph.middle_click_slot_add_default_node){
				if (node && this.allow_interaction && !skip_action && !this.read_only){
					//not dragging mouse to connect two slots
					if (
						!this.connecting_node &&
						    !node.flags.collapsed &&
						    !this.live_mode
					) {
						var mClikSlot = null;
						var mClikSlot_index = null;
						var mClikSlot_isOut = null;

						//search for outputs
						if (node.outputs) {
							for ( var i = 0, l = node.outputs.length; i < l; ++i ) {
								var output = node.outputs[i];
								var link_pos = node.getConnectionPos(false, i);
								if (LiteGraph.isInsideRectangle(e.canvasX,e.canvasY,link_pos[0] - 15,link_pos[1] - 10,30,20)) {
									mClikSlot = output;
									mClikSlot_index = i;
									mClikSlot_isOut = true;
									break;
								}
							}
						}

						//search for inputs
						if (node.inputs) {
							for ( var i = 0, l = node.inputs.length; i < l; ++i ) {
								var input = node.inputs[i];
								var link_pos = node.getConnectionPos(true, i);
								if (LiteGraph.isInsideRectangle(e.canvasX,e.canvasY,link_pos[0] - 15,link_pos[1] - 10,30,20)) {
									mClikSlot = input;
									mClikSlot_index = i;
									mClikSlot_isOut = false;
									break;
								}
							}
						}
						//console.log("middleClickSlots? "+mClikSlot+" & "+(mClikSlot_index!==false));
						if (mClikSlot && mClikSlot_index!==false){

							var alphaPosY = 0.5-((mClikSlot_index+1)/((mClikSlot_isOut?node.outputs.length:node.inputs.length)));
							var node_bounding = node.getBounding();
							// estimate a position: this is a bad semi-bad-working mess .. REFACTOR with a correct autoplacement that knows about the others slots and nodes
							var posRef = [	(!mClikSlot_isOut?node_bounding[0]:node_bounding[0]+node_bounding[2])// + node_bounding[0]/this.canvas.width*150
											,e.canvasY-80// + node_bounding[0]/this.canvas.width*66 // vertical "derive"
										 ];
							var nodeCreated = this.createDefaultNodeForSlot("AUTO", {   	nodeFrom: !mClikSlot_isOut?null:node
																					,slotFrom: !mClikSlot_isOut?null:mClikSlot_index
																					,nodeTo: !mClikSlot_isOut?node:null
																					,slotTo: !mClikSlot_isOut?mClikSlot_index:null
																					,position: posRef //,e: e
																					,posAdd:[!mClikSlot_isOut?-30:30, -alphaPosY*130] //-alphaPosY*30]
																					,posSizeFix:[!mClikSlot_isOut?-1:0, 0] //-alphaPosY*2*/
																			});

						}
					}
				}
			}

        } else if (e.which == 3 || this.pointer_is_double) {

            //right button
			if (this.allow_interaction && !skip_action && !this.read_only){

				// is it hover a node ?
				if (node){
					if(Object.keys(this.selected_nodes).length
					    && (this.selected_nodes[node.id] || e.shiftKey || e.ctrlKey || e.metaKey)
					  ){
						// is multiselected or using shift to include the now node
						if (!this.selected_nodes[node.id]) this.selectNodes([node],true); // add this if not present
					}else{
						// update selection
						this.selectNodes([node]);
					}
				}

				// show menu on this node
				this.processContextMenu(node, e);
			}

        }

        //TODO
        //if(this.node_selected != prev_selected)
        //	this.onNodeSelectionChange(this.node_selected);

        this.last_mouse[0] = e.clientX;
        this.last_mouse[1] = e.clientY;
        this.last_mouseclick = LiteGraph.getTime();
        this.last_mouse_dragging = true;

        /*
	      if( (this.dirty_canvas || this.dirty_bgcanvas) && this.rendering_timer_id == null)
		  this.draw();
	    */

        this.graph.change();

        //this is to ensure to defocus(blur) if a text input element is on focus
        if (
            !ref_window.document.activeElement ||
                (ref_window.document.activeElement.nodeName.toLowerCase() !=
                    "input" &&
                    ref_window.document.activeElement.nodeName.toLowerCase() !=
                    "textarea")
        ) {
            e.preventDefault();
        }
        e.stopPropagation();

        if (this.onMouseDown) {
            this.onMouseDown(e);
        }

        return false;
    }

    processMouseMove(_e: MouseEvent): boolean | undefined {
        let e = _e as MouseEventExt;

        if (this.autoresize) {
            this.resize();
        }

		if( this.set_canvas_dirty_on_mouse_event )
			this.dirty_canvas = true;

        if (!this.graph) {
            return;
        }

        LGraphCanvas.active_canvas = this;
        this.adjustMouseEvent(e);
        let mouse: Vector2 = [e.clientX, e.clientY];
		this.mouse[0] = mouse[0];
		this.mouse[1] = mouse[1];
        let delta = [
            mouse[0] - this.last_mouse[0],
            mouse[1] - this.last_mouse[1]
        ];
        this.last_mouse = mouse;
        this.graph_mouse[0] = e.canvasX;
        this.graph_mouse[1] = e.canvasY;

        //console.log("pointerevents: processMouseMove "+e.pointerId+" "+e.isPrimary);

		if(this.block_click)
		{
			//console.log("pointerevents: processMouseMove block_click");
			e.preventDefault();
			return false;
		}

        e.dragging = this.last_mouse_dragging;

        if (this.node_widget) {
            this.processNodeWidgets(
                this.node_widget[0],
                this.graph_mouse,
                e,
                this.node_widget[1]
            );
            this.dirty_canvas = true;
        }

        if (this.dragging_rectangle)
		{
            this.dragging_rectangle[2] = e.canvasX - this.dragging_rectangle[0];
            this.dragging_rectangle[3] = e.canvasY - this.dragging_rectangle[1];
            this.dirty_canvas = true;
        }
		else if (this.selected_group && !this.read_only)
		{
            //moving/resizing a group
            if (this.selected_group_resizing) {
                this.selected_group.size = [
                    e.canvasX - this.selected_group.pos[0],
                    e.canvasY - this.selected_group.pos[1]
                ];
            } else {
                var deltax = delta[0] / this.ds.scale;
                var deltay = delta[1] / this.ds.scale;
                this.selected_group.move(deltax, deltay, e.ctrlKey);
                if ((this.selected_group as any)._nodes.length) {
                    this.dirty_canvas = true;
                }
            }
            this.dirty_bgcanvas = true;
        } else if (this.dragging_canvas) {
        	////console.log("pointerevents: processMouseMove is dragging_canvas");
            this.ds.offset[0] += delta[0] / this.ds.scale;
            this.ds.offset[1] += delta[1] / this.ds.scale;
            this.dirty_canvas = true;
            this.dirty_bgcanvas = true;
        } else if (this.allow_interaction && !this.read_only) {
            if (this.connecting_node) {
                this.dirty_canvas = true;
            }

            //get node over
            var node = this.graph.getNodeOnPos(e.canvasX,e.canvasY,this.visible_nodes);

            //remove mouseover flag
            for (var i = 0, l = (this.graph as any)._nodes.length; i < l; ++i) {
                let otherNode: LGraphNode = (this.graph as any)._nodes[i];
                if (otherNode.mouseOver && node != otherNode ) {
                    //mouse leave
                    otherNode.mouseOver = false;
                    if (this.node_over && this.node_over.onMouseLeave) {
                        this.node_over.onMouseLeave(e, [e.canvasX - this.node_over.pos[0], e.canvasY - this.node_over.pos[1]], this );
                    }
                    this.node_over = null;
                    this.dirty_canvas = true;
                }
            }

            //mouse over a node
            if (node) {

				if(node.redraw_on_mouse)
                    this.dirty_canvas = true;

                //this.canvas.style.cursor = "move";
                if (!node.mouseOver) {
                    //mouse enter
                    node.mouseOver = true;
                    this.node_over = node;
                    this.dirty_canvas = true;

                    if (node.onMouseEnter) {
                        node.onMouseEnter(e, [e.canvasX - node.pos[0], e.canvasY - node.pos[1]], this );
                    }
                }

                //in case the node wants to do something
                if (node.onMouseMove) {
                    node.onMouseMove( e, [e.canvasX - node.pos[0], e.canvasY - node.pos[1]], this );
                }

                //if dragging a link
                if (this.connecting_node) {

                    if (this.connecting_output){

                        var pos = this._highlight_input || [0, 0]; //to store the output of isOverNodeInput

                        //on top of input
                        if (this.isOverNodeBox(node, e.canvasX, e.canvasY)) {
                            //mouse on top of the corner box, don't know what to do
                        } else {
                            //check if I have a slot below de mouse
                            var slot = this.isOverNodeInput( node, e.canvasX, e.canvasY, pos );
                            if (slot != -1 && node.inputs[slot]) {
                                var slot_type = node.inputs[slot].type;
                                if ( LiteGraph.isValidConnection( this.connecting_output.type, slot_type ) ) {
                                    this._highlight_input = pos;
									this._highlight_input_slot = node.inputs[slot]; // XXX CHECK THIS
                                }
                            } else {
                                this._highlight_input = null;
								this._highlight_input_slot = null;  // XXX CHECK THIS
                            }
                        }

                    }else if(this.connecting_input){

                        var pos = this._highlight_output || [0, 0]; //to store the output of isOverNodeOutput

                        //on top of output
                        if (this.isOverNodeBox(node, e.canvasX, e.canvasY)) {
                            //mouse on top of the corner box, don't know what to do
                        } else {
                            //check if I have a slot below de mouse
                            var slot = this.isOverNodeOutput( node, e.canvasX, e.canvasY, pos );
                            if (slot != -1 && node.outputs[slot]) {
                                var slot_type = node.outputs[slot].type;
                                if ( LiteGraph.isValidConnection( this.connecting_input.type, slot_type ) ) {
                                    this._highlight_output = pos;
                                }
                            } else {
                                this._highlight_output = null;
                            }
                        }
                    }
                }

                //Search for corner
                if (this.canvas) {
                    if (
                        LiteGraph.isInsideRectangle(
                            e.canvasX,
                            e.canvasY,
                            node.pos[0] + node.size[0] - 5,
                            node.pos[1] + node.size[1] - 5,
                            5,
                            5
                        )
                    ) {
                        this.canvas.style.cursor = "se-resize";
                    } else {
                        this.canvas.style.cursor = "crosshair";
                    }
                }
            } else { //not over a node

                //search for link connector
				var over_link = null;
				for (var i = 0; i < this.visible_links.length; ++i) {
					var link = this.visible_links[i];
					var center = link._pos;
					if (
						!center ||
						    e.canvasX < center[0] - 4 ||
						    e.canvasX > center[0] + 4 ||
						    e.canvasY < center[1] - 4 ||
						    e.canvasY > center[1] + 4
					) {
						continue;
					}
					over_link = link;
					break;
				}
				if( over_link != this.over_link_center )
				{
					this.over_link_center = over_link;
	                this.dirty_canvas = true;
				}

				if (this.canvas) {
	                this.canvas.style.cursor = "";
				}
			} //end

			//send event to node if capturing input (used with widgets that allow drag outside of the area of the node)
            if ( this.node_capturing_input && this.node_capturing_input != node && this.node_capturing_input.onMouseMove ) {
                this.node_capturing_input.onMouseMove(e,[e.canvasX - this.node_capturing_input.pos[0],e.canvasY - this.node_capturing_input.pos[1]], this);
            }

			//node being dragged
            if (this.node_dragged && !this.live_mode) {
				//console.log("draggin!",this.selected_nodes);
                for (const i in this.selected_nodes) {
                    var n = this.selected_nodes[i];
                    n.pos[0] += delta[0] / this.ds.scale;
                    n.pos[1] += delta[1] / this.ds.scale;
                }

                this.dirty_canvas = true;
                this.dirty_bgcanvas = true;
            }

            if (this.resizing_node && !this.live_mode) {
                //convert mouse to node space
				var desired_size: Vector2 = [ e.canvasX - this.resizing_node.pos[0], e.canvasY - this.resizing_node.pos[1] ];
				var min_size = this.resizing_node.computeSize();
				desired_size[0] = Math.max( min_size[0], desired_size[0] );
				desired_size[1] = Math.max( min_size[1], desired_size[1] );
				this.resizing_node.setSize( desired_size );

                this.canvas.style.cursor = "se-resize";
                this.dirty_canvas = true;
                this.dirty_bgcanvas = true;
            }
        }

        e.preventDefault();
        return false;
    }

    processMouseUp(_e: MouseEvent): boolean | undefined {
        let e = _e as MouseEventExt;

		var is_primary = (!(e instanceof PointerEvent) || !e.isPrimary);

    	//early exit for extra pointer
    	if(!is_primary){
    		/*e.stopPropagation();
        	  e.preventDefault();*/
    		//console.log("pointerevents: processMouseUp pointerN_stop "+e.pointerId+" "+e.isPrimary);
    		return false;
    	}

    	//console.log("pointerevents: processMouseUp "+e.pointerId+" "+e.isPrimary+" :: "+e.clientX+" "+e.clientY);

		if( this.set_canvas_dirty_on_mouse_event )
			this.dirty_canvas = true;

        if (!this.graph)
            return;

        var window = this.getCanvasWindow();
        var document = window.document;
        LGraphCanvas.active_canvas = this;

        //restore the mousemove event back to the canvas
		if(!this.skip_events)
		{
			//console.log("pointerevents: processMouseUp adjustEventListener");
			LiteGraph.pointerListenerRemove(document,"move", this._mousemove_callback,true);
			LiteGraph.pointerListenerAdd(this.canvas,"move", this._mousemove_callback,true);
			LiteGraph.pointerListenerRemove(document,"up", this._mouseup_callback,true);
		}

        this.adjustMouseEvent(e);
        var now = LiteGraph.getTime();
        e.click_time = now - this.last_mouseclick;
        this.last_mouse_dragging = false;
		this.last_click_position = null;

		if(this.block_click)
		{
			//console.log("pointerevents: processMouseUp block_clicks");
			this.block_click = false; //used to avoid sending twice a click in a immediate button
		}

		//console.log("pointerevents: processMouseUp which: "+e.which);

        if (e.which == 1) {

			if( this.node_widget )
			{
				this.processNodeWidgets( this.node_widget[0], this.graph_mouse, e );
			}

            //left button
            this.node_widget = null;

            if (this.selected_group) {
                var diffx =
                    this.selected_group.pos[0] -
                    Math.round(this.selected_group.pos[0]);
                var diffy =
                    this.selected_group.pos[1] -
                    Math.round(this.selected_group.pos[1]);
                this.selected_group.move(diffx, diffy, e.ctrlKey);
                this.selected_group.pos[0] = Math.round(
                    this.selected_group.pos[0]
                );
                this.selected_group.pos[1] = Math.round(
                    this.selected_group.pos[1]
                );
                if ((this.selected_group as any)._nodes.length) {
                    this.dirty_canvas = true;
                }
                this.selected_group = null;
            }
            this.selected_group_resizing = false;

			var node = this.graph.getNodeOnPos(
				e.canvasX,
				e.canvasY,
				this.visible_nodes
			);

            if (this.dragging_rectangle) {
                if (this.graph) {
                    var nodes = (this.graph as any)._nodes;
                    var node_bounding = new Float32Array(4);

                    //compute bounding and flip if left to right
                    var w = Math.abs(this.dragging_rectangle[2]);
                    var h = Math.abs(this.dragging_rectangle[3]);
                    var startx =
                        this.dragging_rectangle[2] < 0
                        ? this.dragging_rectangle[0] - w
                        : this.dragging_rectangle[0];
                    var starty =
                        this.dragging_rectangle[3] < 0
                        ? this.dragging_rectangle[1] - h
                        : this.dragging_rectangle[1];
                    this.dragging_rectangle[0] = startx;
                    this.dragging_rectangle[1] = starty;
                    this.dragging_rectangle[2] = w;
                    this.dragging_rectangle[3] = h;

					// test dragging rect size, if minimun simulate a click
					if (!node || (w > 10 && h > 10 )){
						//test against all nodes (not visible because the rectangle maybe start outside
						var to_select = [];
						for (var i = 0; i < nodes.length; ++i) {
							var nodeX = nodes[i];
							nodeX.getBounding(node_bounding);
							if (
								!LiteGraph.overlapBounding(
									this.dragging_rectangle,
									node_bounding
								)
							) {
								continue;
							} //out of the visible area
							to_select.push(nodeX);
						}
						if (to_select.length) {
							this.selectNodes(to_select,e.shiftKey); // add to selection with shift
						}
					}else{
						// will select of update selection
						this.selectNodes([node],e.shiftKey||e.ctrlKey); // add to selection add to selection with ctrlKey or shiftKey
					}

                }
                this.dragging_rectangle = null;
            } else if (this.connecting_node) {
                //dragging a connection
                this.dirty_canvas = true;
                this.dirty_bgcanvas = true;

                var connInOrOut = this.connecting_output || this.connecting_input;
                var connType = connInOrOut.type;

                //node below mouse
                if (node) {

                    /* no need to condition on event type.. just another type
                       if (
                       connType == LiteGraph.EVENT &&
                       this.isOverNodeBox(node, e.canvasX, e.canvasY)
                       ) {

                       this.connecting_node.connect(
                       this.connecting_slot,
                       node,
                       LiteGraph.EVENT
                       );

                       } else {*/

                    //slot below mouse? connect

                    if (this.connecting_output){

                        var slot = this.isOverNodeInput(
                            node,
                            e.canvasX,
                            e.canvasY
                        );
                        if (slot != -1) {
                            this.connecting_node.connect(this.connecting_slot, node, slot);
                        } else {
                            //not on top of an input
                            // look for a good slot
                            this.connecting_node.connectByTypeInput(this.connecting_slot,node,connType);
                        }

                    }else if (this.connecting_input){

                        var slot = this.isOverNodeOutput(
                            node,
                            e.canvasX,
                            e.canvasY
                        );

                        if (slot != -1) {
                            node.connect(slot, this.connecting_node, this.connecting_slot); // this is inverted has output-input nature like
                        } else {
                            //not on top of an input
                            // look for a good slot
                            this.connecting_node.connectByTypeOutput(this.connecting_slot,node,connType);
                        }

                    }


                    //}

                }else{

                    // add menu when releasing link in empty space
                	if (LiteGraph.release_link_on_empty_shows_menu){
	                    if (e.shiftKey && this.allow_searchbox){
	                        if(this.connecting_output){
	                            this.showSearchBox(e,{node_from: this.connecting_node, slot_from: this.connecting_output, type_filter_in: this.connecting_output.type});
	                        }else if(this.connecting_input){
	                            this.showSearchBox(e,{node_to: this.connecting_node, slot_from: this.connecting_input, type_filter_out: this.connecting_input.type});
	                        }
	                    }else{
	                        if(this.connecting_output){
	                            this.showConnectionMenu({nodeFrom: this.connecting_node, slotFrom: this.connecting_output, e: e});
	                        }else if(this.connecting_input){
	                            this.showConnectionMenu({nodeTo: this.connecting_node, slotTo: this.connecting_input, e: e});
	                        }
	                    }
                	}
                }

                this.connecting_output = null;
                this.connecting_input = null;
                this.connecting_pos = null;
                this.connecting_node = null;
                this.connecting_slot = -1;
            } //not dragging connection
            else if (this.resizing_node) {
                this.dirty_canvas = true;
                this.dirty_bgcanvas = true;
				this.graph.afterChange(this.resizing_node);
                this.resizing_node = null;
            } else if (this.node_dragged) {
                //node being dragged?
                var node = this.node_dragged;
                if (
                    node &&
                        e.click_time < 300 &&
                        LiteGraph.isInsideRectangle(
                            e.canvasX,
                            e.canvasY,
                            node.pos[0],
                            node.pos[1] - LiteGraph.NODE_TITLE_HEIGHT,
                            LiteGraph.NODE_TITLE_HEIGHT,
                            LiteGraph.NODE_TITLE_HEIGHT
                        )
                ) {
                    node.collapse();
                }

                this.dirty_canvas = true;
                this.dirty_bgcanvas = true;
                this.node_dragged.pos[0] = Math.round(this.node_dragged.pos[0]);
                this.node_dragged.pos[1] = Math.round(this.node_dragged.pos[1]);
                if (this.graph.config.align_to_grid || this.align_to_grid ) {
                    this.node_dragged.alignToGrid();
                }
				if( this.onNodeMoved )
					this.onNodeMoved( this.node_dragged );
				this.graph.afterChange(this.node_dragged);
                this.node_dragged = null;
            } //no node being dragged
            else {
                //get node over
                var node = this.graph.getNodeOnPos(
                    e.canvasX,
                    e.canvasY,
                    this.visible_nodes
                );

                if (!node && e.click_time < 300) {
                    this.deselectAllNodes();
                }

                this.dirty_canvas = true;
                this.dragging_canvas = false;

                if (this.node_over && this.node_over.onMouseUp) {
                    this.node_over.onMouseUp( e, [ e.canvasX - this.node_over.pos[0], e.canvasY - this.node_over.pos[1] ], this );
                }
                if (
                    this.node_capturing_input &&
                    this.node_capturing_input.onMouseUp
                ) {
                    this.node_capturing_input.onMouseUp(e, [
                        e.canvasX - this.node_capturing_input.pos[0],
                        e.canvasY - this.node_capturing_input.pos[1]
                    ], this);
                }
            }
        } else if (e.which == 2) {
            //middle button
            //trace("middle");
            this.dirty_canvas = true;
            this.dragging_canvas = false;
        } else if (e.which == 3) {
            //right button
            //trace("right");
            this.dirty_canvas = true;
            this.dragging_canvas = false;
        }

        /*
		if((this.dirty_canvas || this.dirty_bgcanvas) && this.rendering_timer_id == null)
			this.draw();
		*/

	  	if (is_primary)
		{
			this.pointer_is_down = false;
			this.pointer_is_double = false;
		}

        this.graph.change();

        //console.log("pointerevents: processMouseUp stopPropagation");
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    processMouseWheel(_e: MouseEvent): boolean | undefined {
        let e = _e as MouseEventExt;

        if (!this.graph || !this.allow_dragcanvas) {
            return;
        }

        var delta = e.wheelDeltaY != null ? e.wheelDeltaY : e.detail * -60;

        this.adjustMouseEvent(e);

		var x = e.clientX;
		var y = e.clientY;
		var is_inside = !this.viewport || ( this.viewport && x >= this.viewport[0] && x < (this.viewport[0] + this.viewport[2]) && y >= this.viewport[1] && y < (this.viewport[1] + this.viewport[3]) );
		if(!is_inside)
			return;

        var scale = this.ds.scale;

        if (delta > 0) {
            scale *= 1.1;
        } else if (delta < 0) {
            scale *= 1 / 1.1;
        }

        //this.setZoom( scale, [ e.clientX, e.clientY ] );
        this.ds.changeScale(scale, [e.clientX, e.clientY]);

        this.graph.change();

        e.preventDefault();
        return false; // prevent default
    };

    createDefaultNodeForSlot(nodeType: string | "AUTO", opts: {
        nodeFrom?: LGraphNode, // input
        slotFrom?: SlotNameOrIndex | INodeSlot, // input
        nodeTo?: LGraphNode,   // output
        slotTo?: SlotNameOrIndex | INodeSlot,   // output
        position?: Vector2,	// pass the event coords
        posAdd: Vector2	// adjust x,y
        posSizeFix: Vector2 // alpha, adjust the position x,y based on the new node size w,h
    } = {
        position: [0, 0], posAdd: [0, 0], posSizeFix: [0, 0]
    }): boolean { // addNodeMenu for connection
        var that = this;

        var isFrom = opts.nodeFrom && opts.slotFrom!==null;
        var isTo = !isFrom && opts.nodeTo && opts.slotTo!==null;

        if (!isFrom && !isTo){
            console.warn("No data passed to createDefaultNodeForSlot "+opts.nodeFrom+" "+opts.slotFrom+" "+opts.nodeTo+" "+opts.slotTo);
            return false;
        }
		if (!nodeType){
            console.warn("No type to createDefaultNodeForSlot");
            return false;
        }

        var nodeX: LGraphNode = isFrom ? opts.nodeFrom : opts.nodeTo;
        var slotX: SlotNameOrIndex | INodeSlot = isFrom ? opts.slotFrom : opts.slotTo;

        var iSlotConn: SlotIndex | null = null;
        switch (typeof slotX){
            case "string":
                iSlotConn = isFrom ? nodeX.findOutputSlotIndexByName(slotX) : nodeX.findInputSlotIndexByName(slotX);
                slotX = isFrom ? nodeX.outputs[slotX] : nodeX.inputs[slotX];
            break;
            case "object":
                // ok slotX
                iSlotConn = isFrom ? nodeX.findOutputSlotIndexByName(slotX.name) : nodeX.findInputSlotIndexByName(slotX.name);
            break;
            case "number":
                iSlotConn = slotX;
                slotX = isFrom ? nodeX.outputs[slotX] : nodeX.inputs[slotX];
            break;
			case "undefined":
            default:
                // bad ?
                //iSlotConn = 0;
                console.warn("Cant get slot information "+slotX);
                return false;
        }

        slotX = slotX as INodeSlot;

		if (!slotX || !iSlotConn){
			console.warn("createDefaultNodeForSlot bad slotX "+slotX+" "+iSlotConn);
		}

		// check for defaults nodes for this slottype
		var fromSlotType = slotX.type==BuiltInSlotType.EVENT  ? "_event_" : slotX.type;
		var slotTypesDefault = isFrom ? LiteGraph.slot_types_default_out : LiteGraph.slot_types_default_in;
        const fromSlotSpec = slotTypesDefault[fromSlotType];
		if(slotTypesDefault && fromSlotSpec){
			if ((slotX as INodeInputSlot).link !== null
                || ((slotX as INodeOutputSlot).links && (slotX as INodeOutputSlot).links.length > 0)) {
				// is connected
			}else{
				// is not not connected
			}
			let nodeNewType = null;
			if(typeof fromSlotSpec == "object" && Array.isArray(fromSlotSpec)) {
				for(var typeX of fromSlotSpec){
					if (nodeType == slotTypesDefault[fromSlotType][typeX] || nodeType == "AUTO"){
						nodeNewType = slotTypesDefault[fromSlotType][typeX];
                        if (LiteGraph.debug)
                            console.log("opts.nodeType == slotTypesDefault[fromSlotType][typeX] :: "+nodeType);
						break; // --------
					}
				}
			}else{
				if (nodeType == fromSlotSpec || nodeType == "AUTO")
                    nodeNewType = fromSlotSpec;
			}
			if (nodeNewType) {
				var nodeNewOpts: NodeTypeOpts | null = null;
				if (typeof nodeNewType == "object" && nodeNewType.node){
					nodeNewOpts = nodeNewType;
					nodeNewType = nodeNewType.node;
				}

				//that.graph.beforeChange();

				var newNode = LiteGraph.createNode(nodeNewType);
				if(newNode){
					// if is object pass options
					if (nodeNewOpts){
						if (nodeNewOpts.properties) {
							for (var i in nodeNewOpts.properties) {
								newNode.addProperty( i, nodeNewOpts.properties[i] );
							}
						}
						if (nodeNewOpts.inputs) {
							newNode.inputs = [];
							for (var i in nodeNewOpts.inputs) {
								newNode.addOutput(
									nodeNewOpts.inputs[i][0],
									nodeNewOpts.inputs[i][1]
								);
							}
						}
						if (nodeNewOpts.outputs) {
							newNode.outputs = [];
							for (var i in nodeNewOpts.outputs) {
								newNode.addOutput(
									nodeNewOpts.outputs[i][0],
									nodeNewOpts.outputs[i][1]
								);
							}
						}
						if (nodeNewOpts.title) {
							newNode.title = nodeNewOpts.title;
						}
						if (nodeNewOpts.json) {
							newNode.configure(nodeNewOpts.json);
						}

					}

					// add the node
					that.graph.add(newNode);
					newNode.pos = [	opts.position[0]+opts.posAdd[0]+(opts.posSizeFix[0]?opts.posSizeFix[0]*newNode.size[0]:0)
								   	,opts.position[1]+opts.posAdd[1]+(opts.posSizeFix[1]?opts.posSizeFix[1]*newNode.size[1]:0)]; //that.last_click_position; //[e.canvasX+30, e.canvasX+5];*/

					//that.graph.afterChange();

					// connect the two!
					if (isFrom){
						opts.nodeFrom.connectByTypeInput( iSlotConn, newNode, fromSlotType );
					}else{
						opts.nodeTo.connectByTypeOutput( iSlotConn, newNode, fromSlotType );
					}

					// if connecting in between
					if (isFrom && isTo){
                        console.debug("connecting in between");
						// TODO
					}

					return true;

				}else{
					console.log("failed creating "+nodeNewType);
				}
			}
		}
		return false;
	}

    /** returns true if a position (in graph space) is on top of a node little corner box */
    isOverNodeBox(node: LGraphNode, canvasX: number, canvasY: number): boolean {
        var title_height = LiteGraph.NODE_TITLE_HEIGHT;
        if (
            LiteGraph.isInsideRectangle(
                canvasX,
                canvasY,
                node.pos[0] + 2,
                node.pos[1] + 2 - title_height,
                title_height - 4,
                title_height - 4
            )
        ) {
            return true;
        }
        return false;
    }

    /** returns slot index if a position (in graph space) is on top of a node input slot */
    isOverNodeInput(
        node: LGraphNode,
        canvasX: number,
        canvasY: number,
        slotPos?: Vector2
    ): SlotIndex {
        if (node.inputs) {
            for (var i = 0, l = node.inputs.length; i < l; ++i) {
                var link_pos = node.getConnectionPos(true, i);
                var is_inside = false;
                if (node.horizontal) {
                    is_inside = LiteGraph.isInsideRectangle(
                        canvasX,
                        canvasY,
                        link_pos[0] - 5,
                        link_pos[1] - 10,
                        10,
                        20
                    );
                } else {
                    is_inside = LiteGraph.isInsideRectangle(
                        canvasX,
                        canvasY,
                        link_pos[0] - 10,
                        link_pos[1] - 5,
                        40,
                        10
                    );
                }
                if (is_inside) {
                    if (slotPos) {
                        slotPos[0] = link_pos[0];
                        slotPos[1] = link_pos[1];
                    }
                    return i;
                }
            }
        }
        return -1;
    }

    /**
     * returns the INDEX if a position (in graph space) is on top of a node output slot
     * @method isOverNodeOuput
     **/
    isOverNodeOutput(
        node: LGraphNode,
        canvasX: number,
        canvasY: number,
        slot_pos?: Vector2
    ): SlotIndex {
        if (node.outputs) {
            for (var i = 0, l = node.outputs.length; i < l; ++i) {
                var output = node.outputs[i];
                var link_pos = node.getConnectionPos(false, i);
                var is_inside = false;
                if (node.horizontal) {
                    is_inside = LiteGraph.isInsideRectangle(
                        canvasX,
                        canvasY,
                        link_pos[0] - 5,
                        link_pos[1] - 10,
                        10,
                        20
                    );
                } else {
                    is_inside = LiteGraph.isInsideRectangle(
                        canvasX,
                        canvasY,
                        link_pos[0] - 10,
                        link_pos[1] - 5,
                        40,
                        10
                    );
                }
                if (is_inside) {
                    if (slot_pos) {
                        slot_pos[0] = link_pos[0];
                        slot_pos[1] = link_pos[1];
                    }
                    return i;
                }
            }
        }
        return -1;
    };

    /** process a key event */
    processKey(e: KeyboardEvent): boolean | undefined {
        if (!this.graph) {
            return;
        }

        var block_default = false;
        if (LiteGraph.debug)
            console.log("processKey", e); //debug

        if ((e.target instanceof Element) && e.target.localName == "input") {
            return;
        }

        if (e.type == "keydown") {
            if (e.keyCode == 32) {
                //space
                this.dragging_canvas = true;
                block_default = true;
            }

            if (e.keyCode == 27) {
                //esc
                if(this.node_panel) this.node_panel.close();
                if(this.options_panel) this.options_panel.close();
                block_default = true;
            }

            //select all Control A
            if (e.keyCode == 65 && e.ctrlKey) {
                this.selectNodes();
                block_default = true;
            }

            if (e.code == "KeyC" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
                //copy
                if (this.selected_nodes) {
                    this.copyToClipboard();
                    block_default = true;
                }
            }

            if (e.code == "KeyV" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
                //paste
                this.pasteFromClipboard();
            }

            //delete or backspace
            if (e.keyCode == 46 || e.keyCode == 8) {
                if (
                    e.target instanceof Element &&
                        e.target.localName != "input" &&
                        e.target.localName != "textarea"
                ) {
                    this.deleteSelectedNodes();
                    block_default = true;
                }
            }

            //collapse
            //...

            //TODO
            if (this.selected_nodes) {
                for (var i in this.selected_nodes) {
                    if (this.selected_nodes[i].onKeyDown) {
                        this.selected_nodes[i].onKeyDown(e);
                    }
                }
            }
        } else if (e.type == "keyup") {
            if (e.keyCode == 32) {
                // space
                this.dragging_canvas = false;
            }

            if (this.selected_nodes) {
                for (var i in this.selected_nodes) {
                    if (this.selected_nodes[i].onKeyUp) {
                        this.selected_nodes[i].onKeyUp(e);
                    }
                }
            }
        }

        this.graph.change();

        if (block_default) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        }
    }

    copyToClipboard(): void {
        var clipboard_info = {
            nodes: [],
            links: []
        };
        var index = 0;
        var selected_nodes_array = [];
        for (var i in this.selected_nodes) {
            var node = this.selected_nodes[i];
            node._relative_id = index;
            selected_nodes_array.push(node);
            index += 1;
        }

        for (const i = 0; i < selected_nodes_array.length; ++i) {
            let node = selected_nodes_array[i];
			let cloned = node.clone();
			if(!cloned)
			{
				console.warn("node type not found: " + node.type );
				continue;
			}
            clipboard_info.nodes.push(cloned.serialize());
            if (node.inputs && node.inputs.length) {
                for (var j = 0; j < node.inputs.length; ++j) {
                    var input = node.inputs[j];
                    if (!input || input.link == null) {
                        continue;
                    }
                    var link_info = this.graph.links[input.link];
                    if (!link_info) {
                        continue;
                    }
                    var target_node = this.graph.getNodeById(
                        link_info.origin_id
                    );
                    if (!target_node || !this.selected_nodes[target_node.id]) {
                        //improve this by allowing connections to non-selected nodes
                        continue;
                    } //not selected
                    clipboard_info.links.push([
                        target_node._relative_id,
                        link_info.origin_slot, //j,
                        node._relative_id,
                        link_info.target_slot
                    ]);
                }
            }
        }
        localStorage.setItem(
            "litegrapheditor_clipboard",
            JSON.stringify(clipboard_info)
        );
    }

    pasteFromClipboard(): void {
        var data = localStorage.getItem("litegrapheditor_clipboard");
        if (!data) {
            return;
        }

		this.graph.beforeChange();

        //create nodes
        var clipboard_info = JSON.parse(data);
        // calculate top-left node, could work without this processing but using diff with last node pos :: clipboard_info.nodes[clipboard_info.nodes.length-1].pos
        var posMin: Vector2 | null = null;
        var posMinIndexes: [number, number] | null = null;
        for (var i = 0; i < clipboard_info.nodes.length; ++i) {
            if (posMin){
                if(posMin[0]>clipboard_info.nodes[i].pos[0]){
                    posMin[0] = clipboard_info.nodes[i].pos[0];
                    posMinIndexes[0] = i;
                }
                if(posMin[1]>clipboard_info.nodes[i].pos[1]){
                    posMin[1] = clipboard_info.nodes[i].pos[1];
                    posMinIndexes[1] = i;
                }
            }
            else{
                posMin = [clipboard_info.nodes[i].pos[0], clipboard_info.nodes[i].pos[1]];
                posMinIndexes = [i, i];
            }
        }
        var nodes = [];
        for (var i = 0; i < clipboard_info.nodes.length; ++i) {
            var node_data = clipboard_info.nodes[i];
            var node = LiteGraph.createNode(node_data.type);
            if (node) {
                node.configure(node_data);

				//paste in last known mouse position
                node.pos[0] += this.graph_mouse[0] - posMin[0]; //+= 5;
                node.pos[1] += this.graph_mouse[1] - posMin[1]; //+= 5;

                this.graph.add(node,{doProcessChange:false});

                nodes.push(node);
            }
        }

        //create links
        for (var i = 0; i < clipboard_info.links.length; ++i) {
            var link_info = clipboard_info.links[i];
            var origin_node = nodes[link_info[0]];
            var target_node = nodes[link_info[2]];
			if( origin_node && target_node )
	            origin_node.connect(link_info[1], target_node, link_info[3]);
			else
				console.warn("Warning, nodes missing on pasting");
        }

        this.selectNodes(nodes);

		this.graph.afterChange();
    }

    processDrop(_e: DragEvent): boolean | undefined {
        let e = _e as DragEventExt;

        e.preventDefault();
        this.adjustMouseEvent(e);
		var x = e.clientX;
		var y = e.clientY;
		var is_inside = !this.viewport || ( this.viewport && x >= this.viewport[0] && x < (this.viewport[0] + this.viewport[2]) && y >= this.viewport[1] && y < (this.viewport[1] + this.viewport[3]) );
		if(!is_inside){
			return;
		}

        var pos = [e.canvasX, e.canvasY];

        var node = this.graph ? this.graph.getNodeOnPos(pos[0], pos[1]) : null;

        if (!node) {
            var r = null;
            if (this.onDropItem) {
                r = this.onDropItem(event);
            }
            if (!r) {
                this.checkDropItem(e);
            }
            return;
        }

        if (node.onDropFile || node.onDropData) {
            var files = e.dataTransfer.files;
            if (files && files.length) {
                for (var i = 0; i < files.length; i++) {
                    var file = e.dataTransfer.files[0];
                    var filename = file.name;
                    var ext = LGraphCanvas.getFileExtension(filename);
                    //console.log(file);

                    if (node.onDropFile) {
                        node.onDropFile(file);
                    }

                    if (node.onDropData) {
                        //prepare reader
                        var reader = new FileReader();
                        reader.onload = function(event) {
                            //console.log(event.target);
                            var data = event.target.result;
                            node.onDropData(data, filename, file);
                        };

                        //read data
                        var type = file.type.split("/")[0];
                        if (type == "text" || type == "") {
                            reader.readAsText(file);
                        } else if (type == "image") {
                            reader.readAsDataURL(file);
                        } else {
                            reader.readAsArrayBuffer(file);
                        }
                    }
                }
            }
        }

        if (node.onDropItem) {
            if (node.onDropItem(event)) {
                return true;
            }
        }

        if (this.onDropItem) {
            return this.onDropItem(event);
        }

        return false;
    }

    checkDropItem(_e: DragEvent): void {
        let e = _e as DragEventExt;
        if (e.dataTransfer.files.length) {
            var file = e.dataTransfer.files[0];
            var ext = LGraphCanvas.getFileExtension(file.name).toLowerCase();
            var nodetype = LiteGraph.node_types_by_file_extension[ext];
            if (nodetype) {
				this.graph.beforeChange();
                var node = LiteGraph.createNode(nodetype.type);
                node.pos = [e.canvasX, e.canvasY];
                this.graph.add(node);
                if (node.onDropFile) {
                    node.onDropFile(file);
                }
				this.graph.afterChange();
            }
        }
    }

    processNodeDblClicked(n: LGraphNode): void {
        if (this.onShowNodePanel) {
            this.onShowNodePanel(n);
        }
		else
		{
			this.showShowNodePanel(n);
		}

        if (this.onNodeDblClicked) {
            this.onNodeDblClicked(n);
        }

        this.setDirty(true);
    }

    processNodeSelected(node: LGraphNode, e: MouseEvent): void {
        this.selectNode(node, e && (e.shiftKey || e.ctrlKey || this.multi_select));
        if (this.onNodeSelected) {
            this.onNodeSelected(node);
        }
    }

    /** selects a given node (or adds it to the current selection) */
    selectNode(node: LGraphNode, add: boolean = false): void {
        if (node == null) {
            this.deselectAllNodes();
        } else {
            this.selectNodes([node], add);
        }
    }

    /** selects several nodes (or adds them to the current selection) */
    selectNodes(nodes?: LGraphNode[], add: boolean = false): void {
		if (!add) {
            this.deselectAllNodes();
        }

        nodes = nodes || (this.graph as any)._nodes;
		if (typeof nodes == "string") nodes = [nodes];
        for (var i in nodes) {
            var node = nodes[i];
            if (node.is_selected) {
                this.deselectNode(node);
                continue;
            }

            if (!node.is_selected && node.onSelected) {
                node.onSelected();
            }
            node.is_selected = true;
            this.selected_nodes[node.id] = node;

            if (node.inputs) {
                for (var j = 0; j < node.inputs.length; ++j) {
                    this.highlighted_links[node.inputs[j].link] = true;
                }
            }
            if (node.outputs) {
                for (var j = 0; j < node.outputs.length; ++j) {
                    var out = node.outputs[j];
                    if (out.links) {
                        for (var k = 0; k < out.links.length; ++k) {
                            this.highlighted_links[out.links[k]] = true;
                        }
                    }
                }
            }
        }

		if( this.onSelectionChange )
			this.onSelectionChange( this.selected_nodes );

        this.setDirty(true);
    }

    /** removes a node from the current selection */
    deselectNode(node: LGraphNode): void {
        if (!node.is_selected) {
            return;
        }
        if (node.onDeselected) {
            node.onDeselected();
        }
        node.is_selected = false;

        if (this.onNodeDeselected) {
            this.onNodeDeselected(node);
        }

        //remove highlighted
        if (node.inputs) {
            for (var i = 0; i < node.inputs.length; ++i) {
                delete this.highlighted_links[node.inputs[i].link];
            }
        }
        if (node.outputs) {
            for (var i = 0; i < node.outputs.length; ++i) {
                var out = node.outputs[i];
                if (out.links) {
                    for (var j = 0; j < out.links.length; ++j) {
                        delete this.highlighted_links[out.links[j]];
                    }
                }
            }
        }
    }

    /** removes all nodes from the current selection */
    deselectAllNodes(): void {
        if (!this.graph) {
            return;
        }
        var nodes = (this.graph as any)._nodes;
        for (var i = 0, l = nodes.length; i < l; ++i) {
            var node = nodes[i];
            if (!node.is_selected) {
                continue;
            }
            if (node.onDeselected) {
                node.onDeselected();
            }
            node.is_selected = false;
			if (this.onNodeDeselected) {
				this.onNodeDeselected(node);
			}
        }
        this.selected_nodes = {};
        this.current_node = null;
        this.highlighted_links = {};
		if(this.onSelectionChange )
			this.onSelectionChange( this.selected_nodes );
        this.setDirty(true);
    }

    /** deletes all nodes in the current selection from the graph */
    deleteSelectedNodes(): void {
		this.graph.beforeChange();

        for (var i in this.selected_nodes) {
            var node = this.selected_nodes[i];

			if(node.block_delete)
				continue;

			//autoconnect when possible (very basic, only takes into account first input-output)
			if(node.inputs && node.inputs.length && node.outputs && node.outputs.length && LiteGraph.isValidConnection( node.inputs[0].type, node.outputs[0].type ) && node.inputs[0].link && node.outputs[0].links && node.outputs[0].links.length )
			{
				var input_link = node.graph.links[ node.inputs[0].link ];
				var output_link = node.graph.links[ node.outputs[0].links[0] ];
				var input_node = node.getInputNode(0);
				var output_node = node.getOutputNodes(0)[0];
				if(input_node && output_node)
					input_node.connect( input_link.origin_slot, output_node, output_link.target_slot );
			}
            this.graph.remove(node);
			if (this.onNodeDeselected) {
				this.onNodeDeselected(node);
			}
        }
        this.selected_nodes = {};
        this.current_node = null;
        this.highlighted_links = {};
        this.setDirty(true);
		this.graph.afterChange();
    }

    /** centers the camera on a given node */
    centerOnNode(node: LGraphNode): void {
        this.ds.offset[0] =
            -node.pos[0] -
            node.size[0] * 0.5 +
            (this.canvas.width * 0.5) / this.ds.scale;
        this.ds.offset[1] =
            -node.pos[1] -
            node.size[1] * 0.5 +
            (this.canvas.height * 0.5) / this.ds.scale;
        this.setDirty(true, true);
    }

    /**
     * adds some useful properties to a mouse event, like the position in graph coordinates
     * @method adjustMouseEvent
     **/
    adjustMouseEvent(_e: MouseEvent): void {
        let e = _e as MouseEventExt;

        var clientX_rel = 0;
        var clientY_rel = 0;

    	if (this.canvas) {
            var b = this.canvas.getBoundingClientRect();
            clientX_rel = e.clientX - b.left;
            clientY_rel = e.clientY - b.top;
        } else {
        	clientX_rel = e.clientX;
        	clientY_rel = e.clientY;
        }

        // e.deltaX = clientX_rel - this.last_mouse_position[0];
        // e.deltaY = clientY_rel- this.last_mouse_position[1];

        this.last_mouse_position[0] = clientX_rel;
        this.last_mouse_position[1] = clientY_rel;

        e.canvasX = clientX_rel / this.ds.scale - this.ds.offset[0];
        e.canvasY = clientY_rel / this.ds.scale - this.ds.offset[1];

        if (LiteGraph.debug)
            console.log("pointerevents: adjustMouseEvent "+e.clientX+":"+e.clientY+" "+clientX_rel+":"+clientY_rel+" "+e.canvasX+":"+e.canvasY);
    }

    /** process an event on widgets */
    processNodeWidgets(
        node: LGraphNode,
        pos: Vector2,
        event: MouseEventExt,
        activeWidget?: object
    ): IWidget | null {
        if (!node.widgets || !node.widgets.length) {
            return null;
        }

        var x = pos[0] - node.pos[0];
        var y = pos[1] - node.pos[1];
        var width = node.size[0];
        var that = this;
        var ref_window = this.getCanvasWindow();

        for (var i = 0; i < node.widgets.length; ++i) {
            var w = node.widgets[i];
			if(!w || w.disabled)
				continue;
			var widget_height = w.computeSize ? w.computeSize(width)[1] : LiteGraph.NODE_WIDGET_HEIGHT;
			var widget_width = w.width || width;
			//outside
			if ( w != activeWidget &&
				(x < 6 || x > widget_width - 12 || y < w.last_y || y > w.last_y + widget_height || w.last_y === undefined) )
				continue;

			var old_value = w.value;

            //if ( w == activeWidget || (x > 6 && x < widget_width - 12 && y > w.last_y && y < w.last_y + widget_height) ) {
			//inside widget
			switch (w.type) {
				case "button":
					if (event.type === LiteGraph.pointerevents_method+"down") {
                        if (w.callback) {
                            setTimeout(function() {
                                w.callback(w, that, node, pos, event);
                            }, 20);
                        }
                        w.clicked = true;
                        this.dirty_canvas = true;
                    }
					break;
				case "slider":
					var range = w.options.max - w.options.min;
					var nvalue = clamp((x - 15) / (widget_width - 30), 0, 1);
					w.value = w.options.min + (w.options.max - w.options.min) * nvalue;
					if (w.callback) {
						setTimeout(function() {
							inner_value_change(w, w.value);
						}, 20);
					}
					this.dirty_canvas = true;
					break;
				case "number":
				case "combo":
					var old_value = w.value;
					if (event.type == LiteGraph.pointerevents_method+"move" && w.type == "number") {
                        if(event.deltaX)
						    w.value += event.deltaX * 0.1 * (w.options.step || 1);
						if ( w.options.min != null && w.value < w.options.min ) {
							w.value = w.options.min;
						}
						if ( w.options.max != null && w.value > w.options.max ) {
							w.value = w.options.max;
						}
					} else if (event.type == LiteGraph.pointerevents_method+"down") {
						var values = w.options.values;
						if (values && values.constructor === Function) {
							values = w.options.values(w, node);
						}
						var values_list = null;

						if( w.type != "number")
							values_list = values.constructor === Array ? values : Object.keys(values);

						var delta = x < 40 ? -1 : x > widget_width - 40 ? 1 : 0;
						if (w.type == "number") {
							w.value += delta * 0.1 * (w.options.step || 1);
							if ( w.options.min != null && w.value < w.options.min ) {
								w.value = w.options.min;
							}
							if ( w.options.max != null && w.value > w.options.max ) {
								w.value = w.options.max;
							}
						} else if (delta) { //clicked in arrow, used for combos
							var index = -1;
							this.last_mouseclick = 0; //avoids dobl click event
							if(values.constructor === Object)
								index = values_list.indexOf( String( w.value ) ) + delta;
							else
								index = values_list.indexOf( w.value ) + delta;
							if (index >= values_list.length) {
								index = values_list.length - 1;
							}
							if (index < 0) {
								index = 0;
							}
							if( values.constructor === Array )
								w.value = values[index];
							else
								w.value = index;
						} else { //combo clicked
							var text_values = values != values_list ? Object.values(values) : values;
							var menu = new ContextMenu(text_values, {
									scale: Math.max(1, this.ds.scale),
									event: event,
									className: "dark",
									callback: inner_clicked.bind(w)
								},
								ref_window);
							function inner_clicked(v, option, event) {
								if(values != values_list)
									v = text_values.indexOf(v);
								this.value = v;
								inner_value_change(this, v);
								that.dirty_canvas = true;
								return false;
							}
						}
					} //end mousedown
					else if(event.type == LiteGraph.pointerevents_method+"up" && w.type == "number")
					{
						var delta = x < 40 ? -1 : x > widget_width - 40 ? 1 : 0;
						if (event.click_time < 200 && delta == 0) {
							this.prompt("Value",w.value,function(v) {
									this.value = Number(v);
									inner_value_change(this, this.value);
								}.bind(w),
								event);
						}
					}

					if( old_value != w.value )
						setTimeout(
							function() {
								inner_value_change(this, this.value);
							}.bind(w),
							20
						);
					this.dirty_canvas = true;
					break;
				case "toggle":
					if (event.type == LiteGraph.pointerevents_method+"down") {
						w.value = !w.value;
						setTimeout(function() {
							inner_value_change(w, w.value);
						}, 20);
					}
					break;
				case "string":
				case "text":
					if (event.type == LiteGraph.pointerevents_method+"down") {
						this.prompt("Value",w.value,function(v) {
								this.value = v;
								inner_value_change(this, v);
							}.bind(w),
							event,w.options ? w.options.multiline : false );
					}
					break;
				default:
					if (w.mouse) {
						this.dirty_canvas = w.mouse(event, [x, y], node);
					}
					break;
			} //end switch

			//value changed
			if( old_value != w.value )
			{
				if(node.onWidgetChanged)
					node.onWidgetChanged(w, old_value);
                (node.graph as any)._version++;
			}

			return w;
        }//end for

        function inner_value_change(widget: IWidget, value: any) {
            widget.value = value;
            if ( widget.options && widget.options.property && node.properties[widget.options.property] !== undefined ) {
                node.setProperty( widget.options.property, value );
            }
            if (widget.callback) {
                widget.callback(widget.value, that, node, pos, event);
            }
        }

        return null;
}

    /** draws every group area in the background */
    drawGroups(canvas: any, ctx: CanvasRenderingContext2D): void {
}

    adjustNodesSize(): void {
}

    /** resizes the canvas to a given size, if no size is passed, then it tries to fill the parentNode */
    resize(width?: number, height?: number): void {
}

    /**
     * switches to live mode (node shapes are not rendered, only the content)
     * this feature was designed when graphs where meant to create user interfaces
     **/
    switchLiveMode(transition?: boolean): void {
}

    onNodeSelectionChange(): void {
}

    touchHandler(event: TouchEvent): void {
}


    showLinkMenu(link: LLink, e: any): false {
}

    convertOffsetToCanvas = DragAndScale.prototype.convertOffsetToCanvas;
    convertCanvasToOffset = DragAndScale.prototype.convertCanvasToOffset;

    /** converts event coordinates from canvas2D to graph coordinates */
    convertEventToCanvasOffset(this: LGraphCanvas, e: MouseEventExt): Vector2 {
        var rect = this.canvas.getBoundingClientRect();
        return this.convertCanvasToOffset([
            e.clientX - rect.left,
            e.clientY - rect.top
        ]);
    }

    /*
     * UI
     *
     */

    static onMenuCollapseAll = LGraphCanvas_UI.onMenuCollapseAll;
    static onMenuNodeEdit = LGraphCanvas_UI.onMenuNodeEdit;
    static onShowPropertyEditor = LGraphCanvas_UI.onShowPropertyEditor;
    static onGroupAdd = LGraphCanvas_UI.onGroupAdd;
    static onMenuAdd = LGraphCanvas_UI.onMenuAdd;
    static showMenuNodeOptionalInputs = LGraphCanvas_UI.showMenuNodeOptionalInputs;
    static showMenuNodeOptionalOutputs = LGraphCanvas_UI.showMenuNodeOptionalOutputs;
    static onShowMenuNodeProperties = LGraphCanvas_UI.onShowMenuNodeProperties;
    static onResizeNode = LGraphCanvas_UI.onResizeNode;
    static onMenuNodeCollapse = LGraphCanvas_UI.onMenuNodeCollapse;
    static onMenuNodePin = LGraphCanvas_UI.onMenuNodePin;
    static onMenuNodeMode = LGraphCanvas_UI.onMenuNodeMode;
    static onMenuNodeColors = LGraphCanvas_UI.onMenuNodeColors;
    static onMenuNodeShapes = LGraphCanvas_UI.onMenuNodeShapes;
    static onMenuNodeRemove = LGraphCanvas_UI.onMenuNodeRemove;
    static onMenuNodeClone = LGraphCanvas_UI.onMenuNodeClone;
    static onMenuNodeToSubgraph = LGraphCanvas_UI.onMenuNodeToSubgraph;

    getCanvasMenuOptions = LGraphCanvas_UI.prototype.getCanvasMenuOptions;
    getNodeMenuOptions = LGraphCanvas_UI.prototype.getNodeMenuOptions;
    getGroupMenuOptions = LGraphCanvas_UI.prototype.getGroupMenuOptions;
    checkPanels = LGraphCanvas_UI.prototype.checkPanels;
    createDialog = LGraphCanvas_UI.prototype.createDialog;
    showSearchBox = LGraphCanvas_UI.prototype.showSearchBox;
    prompt = LGraphCanvas_UI.prototype.prompt;
    showConnectionMenu = LGraphCanvas_UI.prototype.showConnectionMenu;
    showEditPropertyValue = LGraphCanvas_UI.prototype.showEditPropertyValue;
    processContextMenu = LGraphCanvas_UI.prototype.processContextMenu;

    /*
     * Rendering
     */

    setZoom = LGraphCanvas_Rendering.prototype.setZoom;
    bringToFront = LGraphCanvas_Rendering.prototype.bringToFront;
    sendToBack = LGraphCanvas_Rendering.prototype.sendToBack;
    computeVisibleNodes = LGraphCanvas_Rendering.prototype.computeVisibleNodes;
    draw = LGraphCanvas_Rendering.prototype.draw;
    drawFrontCanvas = LGraphCanvas_Rendering.prototype.drawFrontCanvas;
    drawBackCanvas = LGraphCanvas_Rendering.prototype.drawBackCanvas;
    renderInfo = LGraphCanvas_Rendering.prototype.renderInfo;
    drawNode = LGraphCanvas_Rendering.prototype.drawNode;
    drawLinkTooltip = LGraphCanvas_Rendering.prototype.drawLinkTooltip;
    drawNodeShape = LGraphCanvas_Rendering.prototype.drawNodeShape;
    drawConnections = LGraphCanvas_Rendering.prototype.drawConnections;
    renderLink = LGraphCanvas_Rendering.prototype.renderLink;
    computeConnectionPoint = LGraphCanvas_Rendering.prototype.computeConnectionPoint;
    drawExecutionOrder = LGraphCanvas_Rendering.prototype.drawExecutionOrder;
    drawNodeWidgets = LGraphCanvas_Rendering.prototype.drawNodeWidgets;
}

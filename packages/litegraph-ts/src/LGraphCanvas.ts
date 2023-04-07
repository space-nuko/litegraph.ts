import type { ContextMenuEventListener, ContextMenuItem, IContextMenuItem } from "./ContextMenu";
import ContextMenu from "./ContextMenu";
import type { DragEventExt, MouseEventExt, EventExt } from "./DragAndScale";
import DragAndScale from "./DragAndScale";
import type { INodeInputSlot, INodeOutputSlot, default as INodeSlot, SlotNameOrIndex, SlotIndex } from "./INodeSlot";
import type { IComboWidget, WidgetPanelOptions, WidgetPanelCallback } from "./IWidget";
import type IWidget from "./IWidget";
import LGraph from "./LGraph";
import LGraphCanvas_Events from "./LGraphCanvas_Events";
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

export interface IGraphPanel extends HTMLDivElement {
    header: HTMLDivElement;
    title_element: HTMLSpanElement;
    content: HTMLDivElement;
    alt_content: HTMLDivElement;
    footer: HTMLDivElement;
    close: () => void;
    onClose?: () => void;
    toggleAltContent: (force: boolean) => void;
    toggleFooterVisibility: (force: boolean) => void;
    clear: () => void;
    addHTML: (code: string, classname?: string, on_footer?: boolean) => HTMLDivElement;
    addButton: (name: string, callback: EventListener, options?: any) => HTMLButtonElement;
    addSeparator: () => HTMLDivElement;
    addWidget: <T extends IWidget<O, V>, O extends WidgetPanelOptions, V>(type: string, name: string, value: V, options?: O, callback?: WidgetPanelCallback) => IGraphWidgetUI;
    inner_showCodePad: (propname: string) => void;
    onOpen?(): void;
};

export interface INodePanel extends IGraphPanel {
    node?: LGraphNode;
}

export interface ISubgraphPropertiesPanel extends IGraphPanel {
    node?: LGraphNode;
}

export interface IGraphWidgetUI extends HTMLDivElement {
    options: any,
    value: any
}

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
export default class LGraphCanvas
    implements LGraphCanvas_Rendering, LGraphCanvas_UI, LGraphCanvas_Events {
    static DEFAULT_BACKGROUND_IMAGE: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNrs1rEKwjAUhlETUkj3vP9rdmr1Ysammk2w5wdxuLgcMHyptfawuZX4pJSWZTnfnu/lnIe/jNNxHHGNn//HNbbv+4dr6V+11uF527arU7+u63qfa/bnmh8sWLBgwYJlqRf8MEptXPBXJXa37BSl3ixYsGDBMliwFLyCV/DeLIMFCxYsWLBMwSt4Be/NggXLYMGCBUvBK3iNruC9WbBgwYJlsGApeAWv4L1ZBgsWLFiwYJmCV/AK3psFC5bBggULloJX8BpdwXuzYMGCBctgwVLwCl7Be7MMFixYsGDBsu8FH1FaSmExVfAxBa/gvVmwYMGCZbBg/W4vAQYA5tRF9QYlv/QAAAAASUVORK5CYII=";

    static node_colors: Record<
        string,
        {
            color: string;
            bgColor: string;
            groupcolor: string;
        }
    >;
    static link_type_colors: Record<string, string> = {
        [BuiltInSlotType.ACTION]: LiteGraph.ACTION_LINK_COLOR,
        [BuiltInSlotType.EVENT]: LiteGraph.EVENT_LINK_COLOR,
        number: "#AAA",
        node: "#DCA"
    };

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

    static getPropertyPrintableValue(value: any, values?: any): string {
        if (!values)
            return String(value);

        if (values.constructor === Array) {
            return String(value);
        }

        if (values.constructor === Object) {
            var desc_value = "";
            for (var k in values) {
                if (values[k] != value)
                    continue;
                desc_value = k;
                break;
            }
            return String(value) + " (" + desc_value + ")";
        }
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

        this.setCanvas(canvas, options.skip_events);
        this.clear();

        if (!options.skip_render) {
            this.startRendering();
        }

        this.autoresize = options.autoresize;
    }

    static active_canvas: LGraphCanvas | null = null
    static active_node: LGraphNode | null = null;

    node_panel: INodePanel | null = null;
    options_panel: IGraphDialog | null = null;

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
    maxZoom: number | null = null;
    minZoom: number | null = null;

    get scale(): number {
        return this.ds.scale;
    }

    set scale(v: number) {
        this.ds.scale = v;
    }

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
    onDropItem?(e: DragEvent): boolean | void;
    /** Called by `LGraphCanvas.processMouseDown` */
    onMouse?(event: MouseEventExt): boolean;
    onMouseDown?(event: MouseEventExt): boolean;
    /** Called by `LGraphCanvas.drawFrontCanvas` and `LGraphCanvas.drawLinkTooltip` */
    /** called when rendering a tooltip */
    onDrawLinkTooltip?(ctx: CanvasRenderingContext2D, link: LLink | null, _this: LGraphCanvas): boolean | undefined;
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
    onRender?(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
    onRenderBackground?(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): boolean | void; // bg_already_painted
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

    _highlight_input: Vector2 | null = null;
    _highlight_input_slot: INodeSlot | null = null;
    _highlight_output: Vector2 | null = null;

    _graph_stack: LGraph[] | null = null;

    _bg_img: HTMLImageElement | null = null;
    _pattern: CanvasPattern | null = null;
    _pattern_img: HTMLImageElement | null = null;

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

        if (this.onClear) {
            this.onClear();
        }
    }

    /** assigns a graph, you can reassign graphs to the same canvas */
    setGraph(graph: LGraph | null, skipClear: boolean = false): void {
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

        this.adjustCanvasForHiDPI();
    }

    private _events_binded: boolean = false;

    _mousedown_callback?: EventListener;
    _mousewheel_callback?: EventListener;
    _mousemove_callback?: EventListener;
    _mouseup_callback?: EventListener;
    _key_callback?: EventListener;
    _ondrop_callback?: EventListener;

    //used in some events to capture them
    private _doNothing(e: Event) {
        // if (LiteGraph.debug)
        // console.log("pointerevents: _doNothing " + e.type);
        e.preventDefault();
        return false;
    };
    private _doReturnTrue(e: Event) {
        // if (LiteGraph.debug)
        //     console.log("pointerevents: _doReturnTrue " + e.type);
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

        LiteGraph.pointerListenerAdd(canvas, "down", this._mousedown_callback, true); //down do not need to store the binded
        canvas.addEventListener("mousewheel", this._mousewheel_callback, false);

        LiteGraph.pointerListenerAdd(canvas, "up", this._mouseup_callback, true); // CHECK: ??? binded or not
        LiteGraph.pointerListenerAdd(canvas, "move", this._mousemove_callback);

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

        LiteGraph.pointerListenerRemove(this.canvas, "move", this._mousedown_callback);
        LiteGraph.pointerListenerRemove(this.canvas, "up", this._mousedown_callback);
        LiteGraph.pointerListenerRemove(this.canvas, "down", this._mousedown_callback);
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

    adjustCanvasForHiDPI(ratio?: number) {
        ratio ||= window.devicePixelRatio;
        if (ratio == 1 || !this.canvas.parentNode) { return }
        const rect = (this.canvas.parentNode as Element).getBoundingClientRect();
        const { width, height } = rect;
        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
        this.canvas.style.width = width + "px";
        this.canvas.style.height = height + "px";
        this.canvas.getContext("2d").scale(ratio, ratio);
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
    blockClick(): void {
        this.block_click = true;
        this.last_mouseclick = 0;
    }

    resizing_node: LGraphNode | null = null;

    createDefaultNodeForSlot(nodeType: string | "AUTO", opts: {
        nodeFrom?: LGraphNode, // input
        slotFrom?: SlotNameOrIndex | INodeSlot, // input
        nodeTo?: LGraphNode,   // output
        slotTo?: SlotNameOrIndex | INodeSlot,   // output
        position?: Vector2,	// pass the event coords
        posAdd?: Vector2	// adjust x,y
        posSizeFix?: Vector2 // alpha, adjust the position x,y based on the new node size w,h
    } = {
            position: [0, 0], posAdd: [0, 0], posSizeFix: [0, 0]
        }): boolean { // addNodeMenu for connection
        var that = this;

        var isFrom = opts.nodeFrom && opts.slotFrom !== null;
        var isTo = !isFrom && opts.nodeTo && opts.slotTo !== null;

        if (!isFrom && !isTo) {
            console.warn("No data passed to createDefaultNodeForSlot " + opts.nodeFrom + " " + opts.slotFrom + " " + opts.nodeTo + " " + opts.slotTo);
            return false;
        }
        if (!nodeType) {
            console.warn("No type to createDefaultNodeForSlot");
            return false;
        }

        var nodeX: LGraphNode = isFrom ? opts.nodeFrom : opts.nodeTo;
        var slotX: SlotNameOrIndex | INodeSlot = isFrom ? opts.slotFrom : opts.slotTo;

        var iSlotConn: SlotIndex | null = null;
        switch (typeof slotX) {
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
                console.warn("Cant get slot information " + slotX);
                return false;
        }

        slotX = slotX as INodeSlot;

        if (!slotX || !iSlotConn) {
            console.warn("createDefaultNodeForSlot bad slotX " + slotX + " " + iSlotConn);
        }

        // check for defaults nodes for this slottype
        var fromSlotType = slotX.type == BuiltInSlotType.EVENT ? "_event_" : slotX.type;
        var slotTypesDefault = isFrom ? LiteGraph.slot_types_default_out : LiteGraph.slot_types_default_in;
        const fromSlotSpec = slotTypesDefault[fromSlotType];
        if (slotTypesDefault && fromSlotSpec) {
            if ((slotX as INodeInputSlot).link !== null
                || ((slotX as INodeOutputSlot).links && (slotX as INodeOutputSlot).links.length > 0)) {
                // is connected
            } else {
                // is not not connected
            }
            let nodeNewType = null;
            if (typeof fromSlotSpec == "object" && Array.isArray(fromSlotSpec)) {
                for (var typeX of fromSlotSpec) {
                    if (nodeType == slotTypesDefault[fromSlotType][typeX] || nodeType == "AUTO") {
                        nodeNewType = slotTypesDefault[fromSlotType][typeX];
                        if (LiteGraph.debug)
                            console.log("opts.nodeType == slotTypesDefault[fromSlotType][typeX] :: " + nodeType);
                        break; // --------
                    }
                }
            } else {
                if (nodeType == fromSlotSpec || nodeType == "AUTO")
                    nodeNewType = fromSlotSpec;
            }
            if (nodeNewType) {
                var nodeNewOpts: NodeTypeOpts | null = null;
                if (typeof nodeNewType == "object" && nodeNewType.node) {
                    nodeNewOpts = nodeNewType;
                    nodeNewType = nodeNewType.node;
                }

                //that.graph.beforeChange();

                var newNode = LiteGraph.createNode(nodeNewType);
                if (newNode) {
                    // if is object pass options
                    if (nodeNewOpts) {
                        if (nodeNewOpts.properties) {
                            for (var i in nodeNewOpts.properties) {
                                newNode.addProperty(i, nodeNewOpts.properties[i]);
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
                    newNode.pos = [opts.position[0] + opts.posAdd[0] + (opts.posSizeFix[0] ? opts.posSizeFix[0] * newNode.size[0] : 0)
                        , opts.position[1] + opts.posAdd[1] + (opts.posSizeFix[1] ? opts.posSizeFix[1] * newNode.size[1] : 0)]; //that.last_click_position; //[e.canvasX+30, e.canvasX+5];*/

                    //that.graph.afterChange();

                    // connect the two!
                    if (isFrom) {
                        opts.nodeFrom.connectByTypeInput(iSlotConn, newNode, fromSlotType);
                    } else {
                        opts.nodeTo.connectByTypeOutput(iSlotConn, newNode, fromSlotType);
                    }

                    // if connecting in between
                    if (isFrom && isTo) {
                        console.debug("connecting in between");
                        // TODO
                    }

                    return true;

                } else {
                    console.log("failed creating " + nodeNewType);
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
                if (this.node_panel) this.node_panel.close();
                if (this.options_panel) this.options_panel.close();
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

        for (let i = 0; i < selected_nodes_array.length; ++i) {
            let node = selected_nodes_array[i];
            let cloned = node.clone();
            if (!cloned) {
                console.warn("node type not found: " + node.type);
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
            if (posMin) {
                if (posMin[0] > clipboard_info.nodes[i].pos[0]) {
                    posMin[0] = clipboard_info.nodes[i].pos[0];
                    posMinIndexes[0] = i;
                }
                if (posMin[1] > clipboard_info.nodes[i].pos[1]) {
                    posMin[1] = clipboard_info.nodes[i].pos[1];
                    posMinIndexes[1] = i;
                }
            }
            else {
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

                this.graph.add(node, { doProcessChange: false });

                nodes.push(node);
            }
        }

        //create links
        for (var i = 0; i < clipboard_info.links.length; ++i) {
            var link_info = clipboard_info.links[i];
            var origin_node = nodes[link_info[0]];
            var target_node = nodes[link_info[2]];
            if (origin_node && target_node)
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
        var is_inside = !this.viewport || (this.viewport && x >= this.viewport[0] && x < (this.viewport[0] + this.viewport[2]) && y >= this.viewport[1] && y < (this.viewport[1] + this.viewport[3]));
        if (!is_inside) {
            return;
        }

        var pos = [e.canvasX, e.canvasY];

        var node = this.graph ? this.graph.getNodeOnPos(pos[0], pos[1]) : null;

        if (!node) {
            var r = null;
            if (this.onDropItem) {
                r = this.onDropItem(e);
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
            if (node.onDropItem(e)) {
                return true;
            }
        }

        if (this.onDropItem && this.onDropItem(e)) {
            return true;
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
                var node = LiteGraph.createNode(nodetype.typeName);
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
        else {
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

        if (this.onSelectionChange)
            this.onSelectionChange(this.selected_nodes);

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
        if (this.onSelectionChange)
            this.onSelectionChange(this.selected_nodes);
        this.setDirty(true);
    }

    /** deletes all nodes in the current selection from the graph */
    deleteSelectedNodes(): void {
        this.graph.beforeChange();

        for (var i in this.selected_nodes) {
            var node = this.selected_nodes[i];

            if (node.block_delete)
                continue;

            //autoconnect when possible (very basic, only takes into account first input-output)
            if (node.inputs && node.inputs.length && node.outputs && node.outputs.length && LiteGraph.isValidConnection(node.inputs[0].type, node.outputs[0].type) && node.inputs[0].link && node.outputs[0].links && node.outputs[0].links.length) {
                var input_link = node.graph.links[node.inputs[0].link];
                var output_link = node.graph.links[node.outputs[0].links[0]];
                var input_node = node.getInputNode(0);
                var output_node = node.getOutputNodes(0)[0];
                if (input_node && output_node)
                    input_node.connect(input_link.origin_slot, output_node, output_link.target_slot);
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

        // if (LiteGraph.debug)
        //     console.log("pointerevents: adjustMouseEvent " + e.clientX + ":" + e.clientY + " " + clientX_rel + ":" + clientY_rel + " " + e.canvasX + ":" + e.canvasY);
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
            if (!w || w.disabled)
                continue;
            var widget_height = w.computeSize ? w.computeSize(width)[1] : LiteGraph.NODE_WIDGET_HEIGHT;
            var widget_width = w.width || width;
            //outside
            if (w != activeWidget &&
                (x < 6 || x > widget_width - 12 || y < w.last_y || y > w.last_y + widget_height || w.last_y === undefined))
                continue;

            var old_value = w.value;

            //if ( w == activeWidget || (x > 6 && x < widget_width - 12 && y > w.last_y && y < w.last_y + widget_height) ) {
            //inside widget
            switch (w.type) {
                case "button":
                    if (event.type === LiteGraph.pointerevents_method + "down") {
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
                    if (event.type == LiteGraph.pointerevents_method + "move" && w.type == "number") {
                        if (event.deltaX)
                            w.value += event.deltaX * 0.1 * (w.options.step || 1);
                        if (w.options.min != null && w.value < w.options.min) {
                            w.value = w.options.min;
                        }
                        if (w.options.max != null && w.value > w.options.max) {
                            w.value = w.options.max;
                        }
                    } else if (event.type == LiteGraph.pointerevents_method + "down") {
                        var values: string[] = w.options.values;
                        if (values && typeof values === "function") {
                            let fn = w.options.values as ((widget: IComboWidget, node: LGraphNode) => string[]);
                            values = fn(w as IComboWidget, node);
                        }
                        var values_list = null;

                        if (w.type != "number")
                            values_list = Array.isArray(values) ? values : Object.keys(values);

                        var delta = x < 40 ? -1 : x > widget_width - 40 ? 1 : 0;
                        if (w.type == "number") {
                            w.value += delta * 0.1 * (w.options.step || 1);
                            if (w.options.min != null && w.value < w.options.min) {
                                w.value = w.options.min;
                            }
                            if (w.options.max != null && w.value > w.options.max) {
                                w.value = w.options.max;
                            }
                        } else if (delta) { //clicked in arrow, used for combos
                            var index = -1;
                            this.last_mouseclick = 0; //avoids dobl click event
                            if (values.constructor === Object)
                                index = values_list.indexOf(String(w.value)) + delta;
                            else
                                index = values_list.indexOf(w.value) + delta;
                            if (index >= values_list.length) {
                                index = values_list.length - 1;
                            }
                            if (index < 0) {
                                index = 0;
                            }
                            if (Array.isArray(values))
                                w.value = values[index];
                            else
                                w.value = index;
                        } else { //combo clicked
                            var text_values = values != values_list ? Object.values(values) : values;
                            let choices = Array.from(text_values).map((n) => { return { content: n } })
                            var menu = new ContextMenu(choices, {
                                scale: Math.max(1, this.ds.scale),
                                event: event,
                                className: "dark",
                                callback: inner_clicked.bind(w)
                            },
                                ref_window);
                            function inner_clicked(v: IContextMenuItem, option, event) {
                                let newValue: any = v.content;
                                if (values != values_list)
                                    newValue = text_values.indexOf(newValue);
                                this.value = v;
                                inner_value_change(this, v);
                                that.dirty_canvas = true;
                                return false;
                            }
                        }
                    } //end mousedown
                    else if (event.type == LiteGraph.pointerevents_method + "up" && w.type == "number") {
                        var delta = x < 40 ? -1 : x > widget_width - 40 ? 1 : 0;
                        if (event.click_time < 200 && delta == 0) {
                            this.prompt("Value", w.value, function(v) {
                                this.value = Number(v);
                                inner_value_change(this, this.value);
                            }.bind(w),
                                event);
                        }
                    }

                    if (old_value != w.value)
                        setTimeout(
                            function() {
                                inner_value_change(this, this.value);
                            }.bind(w),
                            20
                        );
                    this.dirty_canvas = true;
                    break;
                case "toggle":
                    if (event.type == LiteGraph.pointerevents_method + "down") {
                        w.value = !w.value;
                        setTimeout(function() {
                            inner_value_change(w, w.value);
                        }, 20);
                    }
                    break;
                case "string":
                case "text":
                    if (event.type == LiteGraph.pointerevents_method + "down") {
                        this.prompt("Value", w.value, function(v) {
                            this.value = v;
                            inner_value_change(this, v);
                        }.bind(w),
                            event, w.options ? w.options.multiline : false);
                    }
                    break;
                default:
                    if (w.mouse) {
                        this.dirty_canvas = w.mouse(event, [x, y], node);
                    }
                    break;
            } //end switch

            //value changed
            if (old_value != w.value) {
                if (node.onWidgetChanged)
                    node.onWidgetChanged(w, old_value);
                (node.graph as any)._version++;
            }

            return w;
        }//end for

        function inner_value_change(widget: IWidget, value: any) {
            widget.value = value;
            if (widget.options && widget.options.property && node.properties[widget.options.property] !== undefined) {
                node.setProperty(widget.options.property, value);
            }
            if (widget.callback) {
                widget.callback(widget.value, that, node, pos, event);
            }
        }

        return null;
    }

    adjustNodesSize(): void {
        var nodes = (this.graph as any)._nodes;
        for (var i = 0; i < nodes.length; ++i) {
            nodes[i].size = nodes[i].computeSize();
        }
        this.setDirty(true, true);
    }


    /** resizes the canvas to a given size, if no size is passed, then it tries to fill the parentNode */
    resize(width?: number, height?: number): void {
        if (!width && !height) {
            var parent = this.canvas.parentNode as HTMLElement;
            width = parent.offsetWidth;
            height = parent.offsetHeight;
        }

        if (this.canvas.width == width && this.canvas.height == height) {
            return;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.bgcanvas.width = this.canvas.width;
        this.bgcanvas.height = this.canvas.height;

        this.adjustCanvasForHiDPI();

        this.setDirty(true, true);
    }

    isAreaClicked(this: LGraphCanvas, x: number, y: number, w: number, h: number, hold_click?: boolean) {
        var pos = this.mouse;
        var hover = LiteGraph.isInsideRectangle(pos[0], pos[1], x, y, w, h);
        pos = this.last_click_position;
        var clicked = pos && LiteGraph.isInsideRectangle(pos[0], pos[1], x, y, w, h);
        var was_clicked = clicked && !this.block_click;
        if (clicked && hold_click)
            this.blockClick();
        return was_clicked;
    }

    /**
     * switches to live mode (node shapes are not rendered, only the content)
     * this feature was designed when graphs where meant to create user interfaces
     **/
    switchLiveMode(transition?: boolean): void {
        if (!transition) {
            this.live_mode = !this.live_mode;
            this.dirty_canvas = true;
            this.dirty_bgcanvas = true;
            return;
        }

        var self = this;
        var delta = this.live_mode ? 1.1 : 0.9;
        if (this.live_mode) {
            this.live_mode = false;
            this.editor_alpha = 0.1;
        }

        var t = setInterval(function() {
            self.editor_alpha *= delta;
            self.dirty_canvas = true;
            self.dirty_bgcanvas = true;

            if (delta < 1 && self.editor_alpha < 0.01) {
                clearInterval(t);
                if (delta < 1) {
                    self.live_mode = true;
                }
            }
            if (delta > 1 && self.editor_alpha > 0.99) {
                clearInterval(t);
                self.editor_alpha = 1;
            }
        }, 1);
    }

    onNodeSelectionChange(): void {
    }

    touchHandler(event: TouchEvent): void {
    }

    convertOffsetToCanvas(pos: Vector2): Vector2 {
        return this.ds.convertOffsetToCanvas(pos);
    }

    convertCanvasToOffset(pos: Vector2, out: Vector2 = [0, 0]): Vector2 {
        return this.ds.convertCanvasToOffset(pos, out);
    }

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
    static onMenuResizeNode = LGraphCanvas_UI.onMenuResizeNode;
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
    closePanels = LGraphCanvas_UI.prototype.closePanels;
    createDialog = LGraphCanvas_UI.prototype.createDialog;
    createPanel = LGraphCanvas_UI.prototype.createPanel;
    showSearchBox = LGraphCanvas_UI.prototype.showSearchBox;
    prompt = LGraphCanvas_UI.prototype.prompt;
    showConnectionMenu = LGraphCanvas_UI.prototype.showConnectionMenu;
    showLinkMenu = LGraphCanvas_UI.prototype.showLinkMenu;
    showEditPropertyValue = LGraphCanvas_UI.prototype.showEditPropertyValue;
    showShowNodePanel = LGraphCanvas_UI.prototype.showShowNodePanel;
    showSubgraphPropertiesDialog = LGraphCanvas_UI.prototype.showSubgraphPropertiesDialog;
    showSubgraphPropertiesDialogRight = LGraphCanvas_UI.prototype.showSubgraphPropertiesDialogRight;
    processContextMenu = LGraphCanvas_UI.prototype.processContextMenu;

    /*
     * Events
     */

    processMouseMove = LGraphCanvas_Events.prototype.processMouseMove;
    processMouseDown = LGraphCanvas_Events.prototype.processMouseDown;
    processMouseUp = LGraphCanvas_Events.prototype.processMouseUp;
    processMouseWheel = LGraphCanvas_Events.prototype.processMouseWheel;

    /*
     * Rendering
     */

    setZoom = LGraphCanvas_Rendering.prototype.setZoom;
    bringToFront = LGraphCanvas_Rendering.prototype.bringToFront;
    sendToBack = LGraphCanvas_Rendering.prototype.sendToBack;
    computeVisibleNodes = LGraphCanvas_Rendering.prototype.computeVisibleNodes;
    draw = LGraphCanvas_Rendering.prototype.draw;
    drawFrontCanvas = LGraphCanvas_Rendering.prototype.drawFrontCanvas;
    drawSubgraphPanel = LGraphCanvas_Rendering.prototype.drawSubgraphPanel;
    drawSubgraphPanelLeft = LGraphCanvas_Rendering.prototype.drawSubgraphPanelLeft;
    drawSubgraphPanelRight = LGraphCanvas_Rendering.prototype.drawSubgraphPanelRight;
    drawButton = LGraphCanvas_Rendering.prototype.drawButton;
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
    drawGroups = LGraphCanvas_Rendering.prototype.drawGroups;
}

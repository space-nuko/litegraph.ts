import type LGraph from "./LGraph";
import type { LGraphNodeConstructor, LGraphNodeConstructorFactory, NodeTypeSpec, PropertyLayout, SearchboxExtra, SerializedLGraphNode, SlotLayout } from "./LGraphNode";
import { default as LGraphNode } from "./LGraphNode";
import type { PointerEventsMethod, SlotType, Vector2, Vector4 } from "./types";
import { NodeMode } from "./types";
import { BuiltInSlotType } from "./types";
import { getStaticProperty } from "./utils";

type TypeID = number;

export type LiteGraphCreateNodeOptions = {
    constructorArgs?: any[],
    instanceProps?: Record<any, any>
}

export default class LiteGraph {
    static VERSION: number = 10.0;

    static CANVAS_GRID_SIZE: number = 10;

    static NODE_TITLE_HEIGHT: number = 20;
    static NODE_TITLE_TEXT_Y: number = 15;
    static NODE_SLOT_HEIGHT: number = 20;
    static NODE_WIDGET_HEIGHT: number = 20;
    static NODE_WIDTH: number = 140;
    static NODE_MIN_WIDTH: number = 50;
    static NODE_COLLAPSED_RADIUS: number = 10;
    static NODE_COLLAPSED_WIDTH: number = 80;
    static NODE_TITLE_COLOR: string = "#999";
    static NODE_SELECTED_TITLE_COLOR: string = "#FFF";
    static NODE_TEXT_SIZE: number = 14;
    static NODE_TEXT_COLOR: string = "#AAA";
    static NODE_SUBTEXT_SIZE: number = 12;
    static NODE_DEFAULT_COLOR: string = "#333";
    static NODE_DEFAULT_BGCOLOR: string = "#353535";
    static NODE_DEFAULT_BOXCOLOR: string = "#666";
    static NODE_DEFAULT_SHAPE: string = "box";
    static NODE_BOX_OUTLINE_COLOR: string = "#FFF";
    static DEFAULT_SHADOW_COLOR: string = "rgba(0,0,0,0.5)";
    static DEFAULT_GROUP_FONT_SIZE: number = 24;

    static WIDGET_BGCOLOR: string = "#222";
    static WIDGET_OUTLINE_COLOR: string = "#666";
    static WIDGET_TEXT_COLOR: string = "#DDD";
    static WIDGET_SECONDARY_TEXT_COLOR: string = "#999";

    static LINK_COLOR: string = "#9A9";
    static EVENT_LINK_COLOR: string = "#A86";
    static ACTION_LINK_COLOR: string = "#86A";
    static CONNECTING_LINK_COLOR: string = "#AFA";

    static MAX_NUMBER_OF_NODES: number = 1000; //avoid infinite loops
    static DEFAULT_POSITION: Vector2 = [100, 100]; //default node position

    static proxy: any = null; //used to redirect calls
    static node_images_path: string = "";

    static debug: boolean = false;
    static catch_exceptions: boolean = true;
    static throw_errors: boolean = true;
    /** if set to true some nodes like Formula would be allowed to evaluate code that comes from unsafe sources (like node configuration), which could lead to exploits */
    static allow_scripts: boolean = false;
    /** node types by string */
    static registered_node_types: Record<string, LGraphNodeConstructor> = {};
    /** used for dropping files in the canvas */
    static node_types_by_file_extension: Record<string, LGraphNodeConstructor> = {};
    /** node types by class name */
    static Nodes: Record<string, LGraphNodeConstructor> = {};
    /** used to store vars between graphs **/
    static Globals: Record<any, any> = {};

    /** used to add extra features to the search box */
    static searchbox_extras: Record<string, SearchboxExtra> = {};

    // [true!] If set to true, will automatically sort node types / categories in the context menus
    static auto_sort_node_types: boolean = false;

    // [true!] this make the nodes box (top left circle) coloured when triggered (execute/action), visual feedback
    static node_box_coloured_when_on: boolean = false;
    // [true!] nodebox based on node mode; visual feedback
    static node_box_coloured_by_mode: boolean = false;

    // [false on mobile] better true if not touch device, TODO add an helper/listener to close if false
    static dialog_close_on_mouse_leave: boolean = true;
    static dialog_close_on_mouse_leave_delay: number = 500;

    // [false!] prefer false if results too easy to break links - implement with ALT or TODO custom keys
    static shift_click_do_break_link_from: boolean = false;
    // [false!]prefer false, way too easy to break links
    static click_do_break_link_to: boolean = false;

    // [false on mobile] better true if not touch device, TODO add an helper/listener to close if false
    static search_hide_on_mouse_leave: boolean = true;
    // [true!] enable filtering slots type in the search widget, !requires auto_load_slot_types or manual set registered_slot_[in/out]_types and slot_types_[in/out]
    static search_filter_enabled: boolean = false;
    // [true!] opens the results list when opening the search widget
    static search_show_all_on_open: boolean = true;

    // [if want false, use true, run, get vars values to be statically set, than disable] nodes types and nodeclass association with node types need to be calculated, if dont want this, calculate once and set registered_slot_[in/out]_types and slot_types_[in/out]
    static auto_load_slot_types: boolean = false;

    // slot types for nodeclass
    static registered_slot_in_types: Record<string, { nodes: string[] }> = {};
    // slot types for nodeclass
    static registered_slot_out_types: Record<string, { nodes: string[] }> = {};
    // slot types IN
    static slot_types_in: Array<string> = [];
    // slot types OUT
    static slot_types_out: Array<string> = [];
    // specify for each IN slot type a(/many) default node(s), use single string, array, or object (with node, title, parameters, ..) like for search
    static slot_types_default_in: Record<string, NodeTypeSpec[]> = {}
    // specify for each OUT slot type a(/many) default node(s), use single string, array, or object (with node, title, parameters, ..) like for search
    static slot_types_default_out: Record<string, NodeTypeSpec[]> = {}

    // [true!] very handy, ALT click to clone and drag the new node
    static alt_drag_do_clone_nodes: boolean = false;

    // [true!] will create and connect event slots when using action/events connections, !WILL CHANGE node mode when using onTrigger (enable mode colors), onExecuted does not need this
    static do_add_triggers_slots: boolean = false;

    // [false!] being events, it is strongly reccomended to use them sequentially, one by one
    static allow_multi_output_for_events: boolean = true;

    //[true!] allows to create and connect a ndoe clicking with the third button (wheel)
    static middle_click_slot_add_default_node: boolean = false;

    //[true!] dragging a link to empty space will open a menu, add from list, search or defaults
    static release_link_on_empty_shows_menu: boolean = false;

    //[false!] do not allow interacting with widgets
    static ignore_all_widget_events: boolean = false;

    // use mouse for retrocompatibility issues? (none found @ now)
    static pointerevents_method: PointerEventsMethod = "mouse";

    // if true, all newly created nodes/links will use string UUIDs for their id fields instead of integers.
    // use this if you must have node IDs that are unique across all graphs and subgraphs.
    static use_uuids: boolean = false;

    // delay in milliseconds between typing in the search box and refreshing the list
    static search_box_refresh_interval_ms: number = 250;

    // use a combo widget for selecting graph input/output types instead of a text box
    static graph_inputs_outputs_use_combo_widget: boolean = false;

    // if true, save a _data entry in serialized node outputs for debugging
    static serialize_slot_data: boolean = false;

    /** Register a node class so it can be listed when the user wants to create a new one */
    static registerNodeType<T extends LGraphNode>(config: LGraphNodeConstructor): void {
        if (LiteGraph.debug) {
            console.log("Node registered: " + config.type);
        }

        const classname = config.name;
        const type = config.type;

        if (!type) {
            throw ("Config has no type: " + config);
        }
        if (LiteGraph.debug) {
            console.debug(classname, type)
        }

        if (config.category == null || config.category === "") {
            const pos = type.lastIndexOf("/");
            config.category = type.substring(0, pos);
        }

        if (!config.title) {
            config.title = classname;
        }

        const prev = LiteGraph.registered_node_types[type];
        if (prev) {
            console.warn("replacing node type: " + type);
        }

        //used to know which nodes to create when dragging files to the canvas
        if (config.supported_extensions) {
            for (let i in config.supported_extensions) {
                const ext = config.supported_extensions[i];
                if (ext && ext.constructor === String) {
                    LiteGraph.node_types_by_file_extension[ext.toLowerCase()] = config;
                }
            }
        }

        (config.class as any).__LITEGRAPH_TYPE__ = type;

        LiteGraph.registered_node_types[type] = config;
        if (config.class.name) {
            LiteGraph.Nodes[classname] = config;
        }
        if (LiteGraph.onNodeTypeRegistered) {
            LiteGraph.onNodeTypeRegistered(type, config);
        }
        if (prev && LiteGraph.onNodeTypeReplaced) {
            LiteGraph.onNodeTypeReplaced(type, config, prev);
        }

        // TODO one would want to know input and ouput :: this would allow through registerNodeAndSlotType to get all the slots types
        // if (LiteGraph.auto_load_slot_types) {
        //     new (regConfig as any)(regConfig.title || "tmpnode");
        // }
    }

    static onNodeTypeRegistered?(type: string, regConfig: LGraphNodeConstructor): void;
    static onNodeTypeReplaced?(type: string, regConfig: LGraphNodeConstructor, prev: LGraphNodeConstructor): void;

    /** removes a node type from the system */
    static unregisterNodeType(type: string | LGraphNodeConstructor): void {
        let regConfig: LGraphNodeConstructor;
        if (typeof type === "string") {
            regConfig = LiteGraph.registered_node_types[type];
        }
        else {
            regConfig = type;
        }
        if (!regConfig)
            throw ("node type not found: " + type);
        delete LiteGraph.registered_node_types[regConfig.type];
        if ((regConfig.constructor as any).name)
            delete LiteGraph.Nodes[(regConfig.constructor as any).name];
    }

    /**
     * Save a slot type and his node
     * @method registerSlotType
     * @param {String|Object} type name of the node or the node constructor itself
     * @param {String} slot_type name of the slot type (variable type), eg. string, number, array, boolean, ..
     */
    static registerNodeAndSlotType(type: string | LGraphNodeConstructor | LGraphNode, slot_type: SlotType, out: boolean = false) {
        let regConfig: LGraphNodeConstructor;

        if (typeof type === "string") {
            // if (LiteGraph.registered_node_types[type] !== "anonymous") {
            regConfig = LiteGraph.registered_node_types[type];
            // }
            // else {
            //     regConfig = type;
            // }
        }
        else if ("type" in type)
            regConfig = LiteGraph.registered_node_types[type.type]
        else {
            regConfig = type;
        }

        if (!regConfig) {
            throw "Node not registered!" + type
        }

        var sCN = (regConfig.class as any).__litegraph_type__;

        if (typeof slot_type == "string") {
            var aTypes = slot_type.split(",");
        } else if (slot_type == BuiltInSlotType.EVENT || slot_type == BuiltInSlotType.ACTION) {
            var aTypes = ["_event_"];
        } else {
            var aTypes = ["*"];
        }

        for (var i = 0; i < aTypes.length; ++i) {
            var sT = aTypes[i]; //.toLowerCase();
            if (sT === "") {
                sT = "*";
            }
            var registerTo = out ? "registered_slot_out_types" : "registered_slot_in_types";
            if (typeof this[registerTo][sT] == "undefined") this[registerTo][sT] = { nodes: [] };
            this[registerTo][sT].nodes.push(sCN);

            // check if is a new type
            if (sT !== "_event_" && sT !== "*") {
                if (!out) {
                    if (!LiteGraph.slot_types_in.includes(sT.toLowerCase())) {
                        LiteGraph.slot_types_in.push(sT.toLowerCase());
                        LiteGraph.slot_types_in.sort();
                    }
                } else {
                    if (!LiteGraph.slot_types_out.includes(sT.toLowerCase())) {
                        LiteGraph.slot_types_out.push(sT.toLowerCase());
                        LiteGraph.slot_types_out.sort();
                    }
                }
            }
        }
    }

    /** Removes all previously registered node's types. */
    static clearRegisteredTypes(): void {
        LiteGraph.registered_node_types = {};
        LiteGraph.node_types_by_file_extension = {};
        LiteGraph.Nodes = {};
        LiteGraph.searchbox_extras = {};
    }

    /**
     * Create a new node type by passing a function, it wraps it with a proper class and generates inputs according to the parameters of the function.
     * Useful to wrap simple methods that do not require properties, and that only process some input to generate an output.
     * @param name node name with namespace (p.e.: 'math/sum')
     * @param func
     * @param param_types an array containing the type of every parameter, otherwise parameters will accept any type
     * @param return_type string with the return type, otherwise it will be generic
     * @param properties properties to be configurable
     */
    // static wrapFunctionAsNode(
    //     name: string,
    //     func: (...args: any[]) => any,
    //     param_types?: string[],
    //     return_type?: string,
    //     properties?: object
    // ): void {
    //     var params = Array(func.length);
    //     var code = "";
    //     var names = LiteGraph.getParameterNames(func);
    //     for (var i = 0; i < names.length; ++i) {
    //         code +=
    //         "this.addInput('" +
    //             names[i] +
    //             "'," +
    //             (param_types && param_types[i]
    //                 ? "'" + param_types[i] + "'"
    //                 : "0") +
    //             ");\n";
    //     }
    //     code +=
    //     "this.addOutput('out'," +
    //         (return_type ? "'" + return_type + "'" : 0) +
    //         ");\n";
    //     if (properties) {
    //         code +=
    //         "this.properties = " + JSON.stringify(properties) + ";\n";
    //     }
    //     var classobj = Function(code) as any;
    //     classobj.title = name.split("/").pop();
    //     classobj.desc = "Generated from " + func.name;
    //     classobj.prototype.onExecute = function onExecute() {
    //         for (var i = 0; i < params.length; ++i) {
    //             params[i] = this.getInputData(i);
    //         }
    //         var r = func.apply(this, params);
    //         this.setOutputData(0, r);
    //     };
    //     LiteGraph.registerNodeType(name, classobj);
    // }

    /**
     * Adds this method to all node types, existing and to be created
     * (You can add it to LGraphNode.prototype but then existing node types wont have it)
     */
    // static addNodeMethod(name: string, func: (...args: any[]) => any): void {
    //     LGraphNode.prototype[name] = func;
    //     for (var i in LiteGraph.registered_node_types) {
    //         var type = LiteGraph.registered_node_types[i];
    //         if (type.prototype[name]) {
    //             type.prototype["_" + name] = type.prototype[name];
    //         } //keep old in case of replacing
    //         type.prototype[name] = func;
    //     }
    // }

    /**
     * Create a node of a given type with a name. The node is not attached to any graph yet.
     * @param type full name of the node class. p.e. "math/sin"
     * @param name a name to distinguish from other nodes
     * @param options to set options
     */
    static createNode<T extends LGraphNode>(type: string | LGraphNodeConstructorFactory<T>, title?: string, options: LiteGraphCreateNodeOptions = {}): T {
        let regConfig: LGraphNodeConstructor | null = null;
        let typeID: string; // serialization ID like "basic/const"

        if (typeof type === "string") {
            typeID = type;
        }
        else {
            typeID = (type as any).__LITEGRAPH_TYPE__
            if (!typeID) {
                console.error(type);
                throw "Node was not registered yet!"
            }
        }

        regConfig = LiteGraph.registered_node_types[typeID];

        if (!regConfig) {
            console.warn(
                'GraphNode type "' + type + '" not registered.'
            );
            return null;
        }

        title = title || regConfig.title || typeID;

        var node: T = null;
        const args = options.constructorArgs || []

        if (LiteGraph.catch_exceptions) {
            try {
                node = new regConfig.class(title, ...args) as T;
            } catch (err) {
                console.error("Error creating node!", err);
                return null;
            }
        } else {
            node = new regConfig.class(title, ...args) as T;
        }

        node.class = regConfig.class
        node.type = typeID;

        if (!node.title && title) {
            node.title = title;
        }
        if (!node.properties) {
            node.properties = {};
        }
        if (!node.properties_info) {
            node.properties_info = [];
        }
        if (!node.flags) {
            node.flags = {};
        }
        if (!node.size) {
            node.size = node.computeSize();
            //call onresize?
        }
        if (!node.pos) {
            node.pos = [LiteGraph.DEFAULT_POSITION[0], LiteGraph.DEFAULT_POSITION[1]]
        }
        if (!node.mode) {
            node.mode = NodeMode.ALWAYS;
        }

        //extra options
        if (options.instanceProps) {
            for (var i in options.instanceProps) {
                node[i] = options.instanceProps[i];
            }
        }

        const propertyLayout = getStaticProperty<PropertyLayout>(regConfig.class, "propertyLayout")
        if (propertyLayout) {
            if (LiteGraph.debug)
                console.debug("Found property layout!", propertyLayout);
            for (const item of propertyLayout) {
                const { name, defaultValue, type, options } = item;
                node.addProperty(name, defaultValue, type, options)
            }
        }

        const slotLayout = getStaticProperty<SlotLayout>(regConfig.class, "slotLayout")
        if (slotLayout) {
            if (LiteGraph.debug)
                console.debug("Found slot layout!", slotLayout);
            if (slotLayout.inputs) {
                for (const item of slotLayout.inputs) {
                    const { name, type, options } = item;
                    node.addInput(name, type, options);
                }
            }
            if (slotLayout.outputs) {
                for (const item of slotLayout.outputs) {
                    const { name, type, options } = item;
                    node.addOutput(name, type, options);
                }
            }
        }

        // callback
        if (node.onNodeCreated) {
            node.onNodeCreated();
        }

        return node;
    }

    /**
     * Returns a registered node type with a given name
     * @param type full name of the node class. p.e. "math/sin"
     */
    static getNodeType<T extends LGraphNode>(type: string): LGraphNodeConstructor<T> {
        return LiteGraph.registered_node_types[type] as LGraphNodeConstructor<T>;
    }

    /**
     * Returns a list of node types matching one category
     * @method getNodeTypesInCategory
     * @param {String} category category name
     * @param {String} filter only nodes with ctor.filter equal can be shown
     * @return {Array} array with all the node classes
     */
    static getNodeTypesInCategory(
        category: string,
        filter: string
    ): LGraphNodeConstructor[] {
        var r = [];
        for (var i in LiteGraph.registered_node_types) {
            var type = LiteGraph.registered_node_types[i];
            if (type.filter != filter) {
                continue;
            }

            if (category == "") {
                if (type.category == null) {
                    r.push(type);
                }
            } else if (type.category == category) {
                r.push(type);
            }
        }

        if (LiteGraph.auto_sort_node_types) {
            r.sort(function(a, b) { return a.title.localeCompare(b.title) });
        }

        return r;
    }

    /**
     * Returns a list with all the node type categories
     * @method getNodeTypesCategories
     * @param {String} filter only nodes with ctor.filter equal can be shown
     * @return {Array} array with all the names of the categories
     */
    static getNodeTypesCategories(filter: string): string[] {
        var categories = { "": 1 };
        for (var i in LiteGraph.registered_node_types) {
            var type = LiteGraph.registered_node_types[i];
            if (type.category && !type.hide_in_node_lists) {
                if (type.filter != filter)
                    continue;
                categories[type.category] = 1;
            }
        }
        var result = [];
        for (var i in categories) {
            result.push(i);
        }
        return LiteGraph.auto_sort_node_types ? result.sort() : result;
    }

    /** debug purposes: reloads all the js scripts that matches a wildcard */
    static reloadNodes(folder_wildcard: string): void {
        var tmp = document.getElementsByTagName("script");
        //weird, this array changes by its own, so we use a copy
        var script_files = [];
        for (var i = 0; i < tmp.length; i++) {
            script_files.push(tmp[i]);
        }

        var docHeadObj = document.getElementsByTagName("head")[0];
        folder_wildcard = document.location.href + folder_wildcard;

        for (var i = 0; i < script_files.length; i++) {
            var src = script_files[i].src;
            if (
                !src ||
                src.substr(0, folder_wildcard.length) != folder_wildcard
            ) {
                continue;
            }

            try {
                if (LiteGraph.debug) {
                    console.log("Reloading: " + src);
                }
                var dynamicScript = document.createElement("script");
                dynamicScript.type = "text/javascript";
                dynamicScript.src = src;
                docHeadObj.appendChild(dynamicScript);
                docHeadObj.removeChild(script_files[i]);
            } catch (err) {
                if (LiteGraph.throw_errors) {
                    throw err;
                }
                if (LiteGraph.debug) {
                    console.log("Error while reloading " + src);
                }
            }
        }

        if (LiteGraph.debug) {
            console.log("Nodes reloaded");
        }
    }

    // TODO move

    //separated just to improve if it doesn't work
    static cloneObject<T>(obj?: T, target?: T): T {
        if (obj == null) {
            return null;
        }
        var r = JSON.parse(JSON.stringify(obj));
        if (!target) {
            return r;
        }

        for (var i in r) {
            target[i] = r[i];
        }
        return target;
    }

    /**
     * Returns if the types of two slots are compatible (taking into account wildcards, etc)
     * @method isValidConnection
     * @param {String} type_a
     * @param {String} type_b
     * @return {Boolean} true if they can be connected
     */
    static isValidConnection(type_a: SlotType, type_b: SlotType) {
        if (type_a == "" || type_a === "*") type_a = BuiltInSlotType.DEFAULT;
        if (type_b == "" || type_b === "*") type_b = BuiltInSlotType.DEFAULT;
        if (
            !type_a //generic output
            || !type_b // generic input
            || type_a == type_b //same type (is valid for triggers)
            || (type_a == BuiltInSlotType.EVENT && type_b == BuiltInSlotType.ACTION)
            || (type_a == BuiltInSlotType.ACTION && type_b == BuiltInSlotType.EVENT)
        ) {
            return true;
        }

        // Enforce string type to handle toLowerCase call (-1 number not ok)
        type_a = String(type_a);
        type_b = String(type_b);
        type_a = type_a.toLowerCase();
        type_b = type_b.toLowerCase();

        // For nodes supporting multiple connection types
        if (type_a.indexOf(",") == -1 && type_b.indexOf(",") == -1) {
            return type_a == type_b;
        }

        // Check all permutations to see if one is valid
        var supported_types_a = type_a.split(",");
        var supported_types_b = type_b.split(",");
        for (var i = 0; i < supported_types_a.length; ++i) {
            for (var j = 0; j < supported_types_b.length; ++j) {
                if (this.isValidConnection(supported_types_a[i], supported_types_b[j])) {
                    //if (supported_types_a[i] == supported_types_b[j]) {
                    return true;
                }
            }
        }

        return false;
    }

    static getTime(): number {
        return Date.now();
    }

    // static LLink: typeof LLink;
    // static LGraph: typeof LGraph;
    // static DragAndScale: typeof DragAndScale;

    static compareObjects(a: object, b: object): boolean {
        for (var i in a) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }

    static distance(a: Vector2, b: Vector2): number {
        return Math.sqrt(
            (b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1])
        );
    }

    static colorToString(c: number[]): string {
        return (
            "rgba(" +
            Math.round(c[0] * 255).toFixed() +
            "," +
            Math.round(c[1] * 255).toFixed() +
            "," +
            Math.round(c[2] * 255).toFixed() +
            "," +
            (c.length == 4 ? c[3].toFixed(2) : "1.0") +
            ")"
        );
    }

    static isInsideRectangle(
        x: number,
        y: number,
        left: number,
        top: number,
        width: number,
        height: number
    ): boolean {
        if (left < x && left + width > x && top < y && top + height > y) {
            return true;
        }
        return false;
    }

    // [minx,miny,maxx,maxy]
    static growBounding(bounding: Vector4, x: number, y: number): Vector4 {
        if (x < bounding[0]) {
            bounding[0] = x;
        } else if (x > bounding[2]) {
            bounding[2] = x;
        }

        if (y < bounding[1]) {
            bounding[1] = y;
        } else if (y > bounding[3]) {
            bounding[3] = y;
        }

        return bounding;
    }

    static isInsideBounding(p: Vector2, bb: Vector4): boolean {
        if (
            p[0] < bb[0][0] ||
            p[1] < bb[0][1] ||
            p[0] > bb[1][0] ||
            p[1] > bb[1][1]
        ) {
            return false;
        }
        return true;
    }

    // bounding overlap, format: [ startx, starty, width, height ]
    static overlapBounding(a: Float32Array, b: Float32Array) {
        var A_end_x = a[0] + a[2];
        var A_end_y = a[1] + a[3];
        var B_end_x = b[0] + b[2];
        var B_end_y = b[1] + b[3];

        if (
            a[0] > B_end_x ||
            a[1] > B_end_y ||
            A_end_x < b[0] ||
            A_end_y < b[1]
        ) {
            return false;
        }
        return true;
    }

    // Convert a hex value to its decimal value - the inputted hex must be in the
    // format of a hex triplet - the kind we use for HTML colours. The function
    // will return an array with three values.
    static hex2num(hex: string): [number, number, number] {
        if (hex.charAt(0) == "#") {
            hex = hex.slice(1);
        } //Remove the '#' char - if there is one.
        hex = hex.toUpperCase();
        var hex_alphabets = "0123456789ABCDEF";
        let value: [number, number, number];
        var k = 0;
        var int1, int2;
        for (var i = 0; i < 6; i += 2) {
            int1 = hex_alphabets.indexOf(hex.charAt(i));
            int2 = hex_alphabets.indexOf(hex.charAt(i + 1));
            value[k] = int1 * 16 + int2;
            k++;
        }
        return value;
    }

    //Give a array with three values as the argument and the function will return
    //	the corresponding hex triplet.
    static num2hex(triplet: [number, number, number]): string {
        var hex_alphabets = "0123456789ABCDEF";
        var hex = "#";
        var int1, int2;
        for (var i = 0; i < 3; i++) {
            int1 = triplet[i] / 16;
            int2 = triplet[i] % 16;

            hex += hex_alphabets.charAt(int1) + hex_alphabets.charAt(int2);
        }
        return hex;
    }

    // ContextMenu: typeof ContextMenu;
    // static extendClass<A, B>(target: A, origin: B): A & B;

    // static getParameterNames(func: string | Function): string[];

    /* helper for interaction: pointer, touch, mouse Listeners
       used by LGraphCanvas DragAndScale ContextMenu*/
    static pointerListenerAdd(oDOM: Node, sEvIn: string, fCall: EventListener, capture = false) {
        if (!oDOM || !oDOM.addEventListener || !sEvIn || typeof fCall !== "function") {
            //console.log("cant pointerListenerAdd "+oDOM+", "+sEvent+", "+fCall);
            return; // -- break --
        }

        var sMethod = LiteGraph.pointerevents_method;
        var sEvent = sEvIn;

        // UNDER CONSTRUCTION
        // convert pointerevents to touch event when not available
        if (sMethod == "pointer" && !window.PointerEvent) {
            console.warn("sMethod=='pointer' && !window.PointerEvent");
            console.log("Converting pointer[" + sEvent + "] : down move up cancel enter TO touchstart touchmove touchend, etc ..");
            switch (sEvent) {
                case "down": {
                    sMethod = "touch";
                    sEvent = "start";
                    break;
                }
                case "move": {
                    sMethod = "touch";
                    //sEvent = "move";
                    break;
                }
                case "up": {
                    sMethod = "touch";
                    sEvent = "end";
                    break;
                }
                case "cancel": {
                    sMethod = "touch";
                    //sEvent = "cancel";
                    break;
                }
                case "enter": {
                    console.log("debug: Should I send a move event?"); // ???
                    break;
                }
                // case "over": case "out": not used at now
                default: {
                    console.warn("PointerEvent not available in this browser ? The event " + sEvent + " would not be called");
                }
            }
        }

        switch (sEvent) {
            //both pointer and move events
            case "down": case "up": case "move": case "over": case "out": case "enter":
                {
                    oDOM.addEventListener(sMethod + sEvent, fCall, capture);
                }
            // only pointerevents
            case "leave": case "cancel": case "gotpointercapture": case "lostpointercapture":
                {
                    if (sMethod != "mouse") {
                        return oDOM.addEventListener(sMethod + sEvent, fCall, capture);
                    }
                }
            // not "pointer" || "mouse"
            default:
                return oDOM.addEventListener(sEvent, fCall, capture);
        }
    }

    static pointerListenerRemove(oDOM, sEvent, fCall, capture = false) {
        if (!oDOM || !oDOM.removeEventListener || !sEvent || typeof fCall !== "function") {
            //console.log("cant pointerListenerRemove "+oDOM+", "+sEvent+", "+fCall);
            return; // -- break --
        }
        switch (sEvent) {
            //both pointer and move events
            case "down": case "up": case "move": case "over": case "out": case "enter":
                {
                    if (LiteGraph.pointerevents_method == "pointer" || LiteGraph.pointerevents_method == "mouse") {
                        oDOM.removeEventListener(LiteGraph.pointerevents_method + sEvent, fCall, capture);
                    }
                }
            // only pointerevents
            case "leave": case "cancel": case "gotpointercapture": case "lostpointercapture":
                {
                    if (LiteGraph.pointerevents_method == "pointer") {
                        return oDOM.removeEventListener(LiteGraph.pointerevents_method + sEvent, fCall, capture);
                    }
                }
            // not "pointer" || "mouse"
            default:
                return oDOM.removeEventListener(sEvent, fCall, capture);
        }
    }
};

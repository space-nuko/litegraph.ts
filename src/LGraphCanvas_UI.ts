import type { ContextMenuEventListener, ContextMenuItem, IContextMenuItem, IContextMenuOptions } from "./ContextMenu";
import ContextMenu from "./ContextMenu";
import type { MouseEventExt } from "./DragAndScale";
import type { default as INodeSlot, SlotNameOrIndex, SlotIndex } from "./INodeSlot";
import type { IGraphDialog, IGraphPanel, IGraphWidgetUI, ISubgraphPropertiesPanel } from "./LGraphCanvas";
import LGraphCanvas from "./LGraphCanvas";
import LGraphGroup from "./LGraphGroup";
import LGraphNode from "./LGraphNode";
import type LLink from "./LLink";
import LiteGraph from "./LiteGraph";
import { NODE_MODE_NAMES, NodeMode, SLOT_SHAPE_NAMES, type SlotShape, type SlotType, type Vector2 } from "./types";
import { BuiltInSlotType } from "./types";
import Subgraph from "./nodes/basic/Subgraph"

export default class LGraphCanvas_UI {

    // TODO refactor :: this is used fot title but not for properties!
    static onShowPropertyEditor: ContextMenuEventListener = function(
        item: ContextMenuItem,
        options,
        e: MouseEventExt,
        menu: ContextMenu,
        node?: LGraphNode
    ): void {
        var property = /* TODO refactor :: item.property || */ "title";
        var value = node[property];

        // TODO refactor :: use createDialog ?

        var dialog = document.createElement("div") as IGraphDialog;
        dialog.is_modified = false;
        dialog.className = "graphdialog";
        dialog.innerHTML =
            "<span class='name'></span><input autofocus type='text' class='value'/><button>OK</button>";
        dialog.close = function() {
            if (dialog.parentNode) {
                dialog.parentNode.removeChild(dialog);
            }
        };
        var title = dialog.querySelector(".name") as HTMLDivElement;
        title.innerText = property;
        var input = dialog.querySelector(".value") as HTMLInputElement;
        if (input) {
            input.value = value;
            input.addEventListener("blur", function(e) {
                this.focus();
            });
            input.addEventListener("keydown", function(e) {
                dialog.is_modified = true;
                if (e.keyCode == 27) {
                    //ESC
                    dialog.close();
                } else if (e.keyCode == 13) {
                    inner(); // save
                } else if (e.keyCode != 13 && e.target instanceof Element && e.target.localName != "textarea") {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
            });
        }

        var graphcanvas = LGraphCanvas.active_canvas;
        var canvas = graphcanvas.canvas;

        var rect = canvas.getBoundingClientRect();
        var offsetx = -20;
        var offsety = -20;
        if (rect) {
            offsetx -= rect.left;
            offsety -= rect.top;
        }

        if (e) {
            dialog.style.left = e.clientX + offsetx + "px";
            dialog.style.top = e.clientY + offsety + "px";
        } else {
            dialog.style.left = canvas.width * 0.5 + offsetx + "px";
            dialog.style.top = canvas.height * 0.5 + offsety + "px";
        }

        var button = dialog.querySelector("button");
        button.addEventListener("click", inner);
        canvas.parentNode.appendChild(dialog);

        if(input) input.focus();

        var dialogCloseTimer = null;
        dialog.addEventListener("mouseleave", function(e) {
            if(LiteGraph.dialog_close_on_mouse_leave)
                if (!dialog.is_modified && LiteGraph.dialog_close_on_mouse_leave)
                    dialogCloseTimer = setTimeout(dialog.close, LiteGraph.dialog_close_on_mouse_leave_delay); //dialog.close();
        });
        dialog.addEventListener("mouseenter", function(e) {
            if(LiteGraph.dialog_close_on_mouse_leave)
                if(dialogCloseTimer) clearTimeout(dialogCloseTimer);
        });

        function inner() {
            if(input) setValue(input.value);
        }

        function setValue(value: any) {
            // TODO refactor
            // if (item.type == "Number") {
            //     value = Number(value);
            // } else if (item.type == "Boolean") {
            //     value = Boolean(value);
            // }
            node[property] = value;
            if (dialog.parentNode) {
                dialog.parentNode.removeChild(dialog);
            }
            node.setDirtyCanvas(true, true);
        }
    }

    /** Create menu for `Add Group` */
    static onGroupAdd: ContextMenuEventListener = function(value: IContextMenuItem, options, mouseEvent, menu, node: LGraphNode) {
        var canvas = LGraphCanvas.active_canvas;
        var ref_window = canvas.getCanvasWindow();

        var group = new LGraphGroup();
        group.pos = canvas.convertEventToCanvasOffset(mouseEvent);
        canvas.graph.addGroup(group);
    }

    /** Create menu for `Add Node` */
    static onMenuAdd: ContextMenuEventListener = function(value: IContextMenuItem, options, mouseEvent, prevMenu, node: LGraphNode, callback?) {
        var canvas = LGraphCanvas.active_canvas;
        var ref_window = canvas.getCanvasWindow();
        var graph = canvas.graph;
        if (!graph)
            return;

        function inner_onMenuAdded(base_category: string, prevMenu?: ContextMenu){

            var categories  = LiteGraph.getNodeTypesCategories(canvas.filter || graph.filter).filter(function(category){return category.startsWith(base_category)});
            var entries: IContextMenuItem[] = [];

            categories.map(function(category){

                if (!category)
                    return;

                var base_category_regex = new RegExp('^(' + base_category + ')');
                var category_name = category.replace(base_category_regex,"").split('/')[0];
                var category_path = base_category  === '' ? category_name + '/' : base_category + category_name + '/';

                var name = category_name;
                if(name.indexOf("::") != -1) //in case it has a namespace like "shader::math/rand" it hides the namespace
                    name = name.split("::")[1];

                var index = entries.findIndex(function(entry){return entry.value === category_path});
                if (index === -1) {
                    entries.push(
                        {
                            value: category_path,
                            content: name,
                            has_submenu: true,
                            callback: function(value, _event, _mouseEvent, contextMenu){
                                inner_onMenuAdded(value.value, contextMenu)
                            }
                        }
                    );
                }

            });

            var nodes = LiteGraph.getNodeTypesInCategory(base_category.slice(0, -1), canvas.filter || graph.filter );
            nodes.map(function(node){

                if (node.skip_list)
                    return;

                var entry: IContextMenuItem = {
                    value: node.type,
                    content: node.title,
                    has_submenu: false,
                    callback: function(value, _event, _mouseEvent, contextMenu){
                        var firstEvent = contextMenu.getFirstEvent();
                        canvas.graph.beforeChange();
                        var node = LiteGraph.createNode(value.value);
                        if (node) {
                            node.pos = canvas.convertEventToCanvasOffset(firstEvent as MouseEventExt);
                            canvas.graph.add(node);
                        }
                        if(callback)
                            callback(node);
                        canvas.graph.afterChange();
                    }
                };

                entries.push(entry);

            });

            new ContextMenu( entries, { event: mouseEvent, parentMenu: prevMenu }, ref_window );
        }

        inner_onMenuAdded('', prevMenu);
        return false;

    }

    static showMenuNodeOptionalInputs: ContextMenuEventListener = function(_value: IContextMenuItem, _options, mouseEvent, prevMenu, node?: LGraphNode) {
        if (!node) {
            return;
        }

        var that = this;
        var canvas = LGraphCanvas.active_canvas;
        var ref_window = canvas.getCanvasWindow();

        var options = node.optional_outputs;
        if (node.onGetOutputs) {
            options = node.onGetOutputs();
        }

        var entries: IContextMenuItem[] = [];
        if (options) {
            for (var i=0; i < options.length; i++) {
                var entry = options[i];
                if (!entry) {
                    //separator?
                    entries.push(null);
                    continue;
                }
                let [ label, slotType, opts ] = entry;

                if (
                    node.flags &&
                    node.flags.skip_repeated_outputs &&
                    node.findOutputSlotIndexByName(entry[0]) != -1
                ) {
                    continue;
                } //skip the ones already on
				if(opts)
					opts = {};
                if (opts.label) {
                    label = opts.label;
                }
				opts.removable = true;
                var data: IContextMenuItem = { content: label, value: [ label, slotType, opts ] };
                if (slotType == BuiltInSlotType.EVENT) {
                    data.className = "event";
                }
                entries.push(data);
            }
        }

        if (this.onMenuNodeOutputs) {
            entries = this.onMenuNodeOutputs(entries);
        }
        if (LiteGraph.do_add_triggers_slots){ //canvas.allow_addOutSlot_onExecuted
            if (node.findOutputSlotIndexByName("onExecuted") == -1){
                entries.push({content: "On Executed", value: ["onExecuted", BuiltInSlotType.EVENT, {nameLocked: true}], className: "event"}); //, opts: {}
            }
        }
        // add callback for modifing the menu elements onMenuNodeOutputs
        if (node.onMenuNodeOutputs) {
            var retEntries = node.onMenuNodeOutputs(entries);
            if(retEntries) entries = retEntries;
        }

        if (!entries.length) {
            return;
        }

        let innerClicked: ContextMenuEventListener = function(v: IContextMenuItem, _options, e: MouseEventExt, prev: ContextMenu) {
            if (!node) {
                return;
            }

            if (v.callback) {
                v.callback.call(that, node, v, e, prev);
            }

            if (!v.value) {
                return;
            }

            var value = v.value[1];

            if (
                value &&
                    (value.constructor === Object || value.constructor === Array)
            ) {
                //submenu why?
                var entries: IContextMenuItem[] = [];
                for (var i in value) {
                    entries.push({ content: i, value: value[i] });
                }
                new ContextMenu(entries, {
                    event: e,
                    callback: innerClicked,
                    parentMenu: prevMenu,
                    node: node
                });
                return false;
            } else {
                node.graph.beforeChange();
                node.addOutput(v.value[0], v.value[1], v.value[2]);

                if (node.onNodeOutputAdd) { // a callback to the node when adding a slot
                    node.onNodeOutputAdd(v.value);
                }
                node.setDirtyCanvas(true, true);
                node.graph.afterChange();
            }
        }

        var menu = new ContextMenu(
            entries,
            {
                event: mouseEvent,
                callback: innerClicked,
                parentMenu: prevMenu,
                node: node
            },
            ref_window
        );

        return false;
    }

    static showMenuNodeOptionalOutputs: ContextMenuEventListener = function(_value: IContextMenuItem, _options, mouseEvent, prevMenu, node?: LGraphNode) {
        if (!node) {
            return;
        }

        var that = this;
        var canvas = LGraphCanvas.active_canvas;
        var ref_window = canvas.getCanvasWindow();

        var options = node.optional_outputs;
        if (node.onGetOutputs) {
            options = node.onGetOutputs();
        }

        var entries: IContextMenuItem[] = [];
        if (options) {
            for (var i=0; i < options.length; i++) {
                var entry = options[i];
                if (!entry) {
                    //separator?
                    entries.push(null);
                    continue;
                }

                if (
                    node.flags &&
                    node.flags.skip_repeated_outputs &&
                    node.findOutputSlotIndexByName(entry[0]) != -1
                ) {
                    continue;
                } //skip the ones already on
                var label = entry[0];
				if(!entry[2])
					entry[2] = {};
                if (entry[2].label) {
                    label = entry[2].label;
                }
				entry[2].removable = true;
                var data: IContextMenuItem = { content: label, value: entry };
                if (entry[1] == BuiltInSlotType.EVENT) {
                    data.className = "event";
                }
                entries.push(data);
            }
        }

        if (this.onMenuNodeOutputs) {
            entries = this.onMenuNodeOutputs(entries);
        }
        if (LiteGraph.do_add_triggers_slots){ //canvas.allow_addOutSlot_onExecuted
            if (node.findOutputSlotIndexByName("onExecuted") == -1){
                entries.push({content: "On Executed", value: ["onExecuted", BuiltInSlotType.EVENT, {nameLocked: true}], className: "event"}); //, opts: {}
            }
        }
        // add callback for modifing the menu elements onMenuNodeOutputs
        if (node.onMenuNodeOutputs) {
            var retEntries = node.onMenuNodeOutputs(entries);
            if(retEntries) entries = retEntries;
        }

        if (!entries.length) {
            return;
        }

        let innerClicked: ContextMenuEventListener = function(v: ContextMenuItem, _options, mouseEvent: MouseEventExt, prev: ContextMenu) {
            if (!node) {
                return;
            }

            if (v.callback) {
                v.callback.call(that, node, v, e, prev);
            }

            if (!v.value) {
                return;
            }

            var value = v.value[1];

            if (
                value &&
                (value.constructor === Object || value.constructor === Array)
            ) {
                //submenu why?
                var entries: IContextMenuItem[] = [];
                for (var i in value) {
                    entries.push({ content: i, value: value[i] });
                }
                new ContextMenu(entries, {
                    event: mouseEvent,
                    callback: innerClicked,
                    parentMenu: prevMenu,
                    node: node
                });
                return false;
            } else {
				node.graph.beforeChange();
                node.addOutput(v.value[0], v.value[1], v.value[2]);

                if (node.onNodeOutputAdd) { // a callback to the node when adding a slot
                    node.onNodeOutputAdd(v.value);
                }
                node.setDirtyCanvas(true, true);
				node.graph.afterChange();
            }
        }

        var menu = new ContextMenu(
            entries,
            {
                event: mouseEvent,
                callback: innerClicked,
                parentMenu: prevMenu,
                node: node
            },
            ref_window
        );


        return false;
    }

    static onMenuCollapseAll(): void {}
    static onMenuNodeEdit(): void {}

    static onShowMenuNodeProperties: ContextMenuEventListener = function(_value: IContextMenuItem, _options, e, prevMenu, node: LGraphNode) {
        if (!node || !node.properties) {
            return;
        }

        var that = this;
        var canvas = LGraphCanvas.active_canvas;
        var ref_window = canvas.getCanvasWindow();

        var entries = [];
        for (var i in node.properties) {
            var value = node.properties[i] !== undefined ? node.properties[i] : " ";
			if( typeof value == "object" )
				value = JSON.stringify(value);
			var info = node.getPropertyInfo(i);
			if(info.type == "enum" || info.type == "combo")
				value = LGraphCanvas.getPropertyPrintableValue( value, info.values );

            //value could contain invalid html characters, clean that
            value = LGraphCanvas.decodeHTML(value);
            entries.push({
                content:
                    "<span class='property_name'>" +
                    (info.label ? info.label : i) +
                    "</span>" +
                    "<span class='property_value'>" +
                    value +
                    "</span>",
                value: i
            });
        }
        if (!entries.length) {
            return;
        }

        var menu = new ContextMenu(
            entries,
            {
                event: e,
                callback: inner_clicked,
                parentMenu: prevMenu,
                allow_html: true,
                node: node
            },
            ref_window
        );

        function inner_clicked(v, options, e, prev) {
            if (!node) {
                return;
            }
            var rect = this.getBoundingClientRect();
            canvas.showEditPropertyValue(node, v.value, {
                position: [rect.left, rect.top]
            });
        }

        return false;
    }

    static onResizeNode: ContextMenuEventListener function(_value: IContextMenuItem, _options, _e, _menu, node: LGraphNode) {
        if(!node)
            return;
        node.size = node.computeSize();
        node.setDirtyCanvas(true,true);
    }

    static onMenuNodeCollapse: ContextMenuEventListener = function(_value: IContextMenuItem, _options, _e, _menu, node: LGraphNode) {
		node.graph.beforeChange(/*?*/);

		var fApplyMultiNode = function(node){
			node.collapse();
		}

		var graphcanvas = LGraphCanvas.active_canvas;
		if (!graphcanvas.selected_nodes || Object.keys(graphcanvas.selected_nodes).length <= 1){
			fApplyMultiNode(node);
		}else{
			for (var i in graphcanvas.selected_nodes) {
				fApplyMultiNode(graphcanvas.selected_nodes[i]);
			}
		}

		node.graph.afterChange(/*?*/);
    }

    static onMenuNodePin: ContextMenuEventListener = function(value, options, e, menu, node: LGraphNode) {
        node.pin();
    }

    static onMenuNodeMode: ContextMenuEventListener = function(value, options, e, menu, node: LGraphNode) {
        let items: IContextMenuItem[] = Array.from(NODE_MODE_NAMES).map((s) => { return { content: s } });
        new ContextMenu(items,
            { event: e, callback: inner_clicked, parentMenu: menu, node: node }
        );

        function inner_clicked(v: IContextMenuItem) {
            if (!node) {
                return;
            }
            var kV: NodeMode = Object.values(NODE_MODE_NAMES).indexOf(v.content);
            var fApplyMultiNode = function(node: LGraphNode){
				if (kV>=NodeMode.ALWAYS && NODE_MODE_NAMES[kV])
					node.changeMode(kV);
				else{
					console.warn("unexpected mode: "+v);
					node.changeMode(NodeMode.ALWAYS);
				}
			}

			var graphcanvas = LGraphCanvas.active_canvas;
			if (!graphcanvas.selected_nodes || Object.keys(graphcanvas.selected_nodes).length <= 1){
				fApplyMultiNode(node);
			}else{
				for (var i in graphcanvas.selected_nodes) {
					fApplyMultiNode(graphcanvas.selected_nodes[i]);
				}
			}
        }

        return false;
    }

    static onMenuNodeColors: ContextMenuEventListener = function(value, options, e, menu, node) {
        if (!node) {
            throw "no node for color";
        }

        var values = [];
        values.push({
            value: null,
            content:
                "<span style='display: block; padding-left: 4px;'>No color</span>"
        });

        for (let i in LGraphCanvas.node_colors) {
            var color = LGraphCanvas.node_colors[i];
            let value = {
                value: i,
                content:
                    "<span style='display: block; color: #999; padding-left: 4px; border-left: 8px solid " +
                    color.color +
                    "; background-color:" +
                    color.bgColor +
                    "'>" +
                    i +
                    "</span>"
            };
            values.push(value);
        }
        new ContextMenu(values, {
            event: e,
            callback: inner_clicked,
            parentMenu: menu,
            node: node,
            allow_html: true
        });

        function inner_clicked(v) {
            if (!node) {
                return;
            }

            var color = v.value ? LGraphCanvas.node_colors[v.value] : null;

			var fApplyColor = function(node: LGraphNode | LGraphGroup){
				if (color) {
					if (node instanceof LGraphGroup) {
						node.color = color.groupcolor;
					} else {
						node.color = color.color;
						node.bgcolor = color.bgColor;
					}
				} else {
					delete node.color;
                    if (node instanceof LGraphNode) {
                        delete node.bgcolor;
                    }
				}
			}

			var graphcanvas = LGraphCanvas.active_canvas;
			if (!graphcanvas.selected_nodes || Object.keys(graphcanvas.selected_nodes).length <= 1){
				fApplyColor(node);
			}else{
				for (var i in graphcanvas.selected_nodes) {
					fApplyColor(graphcanvas.selected_nodes[i]);
				}
			}
            node.setDirtyCanvas(true, true);
        }

        return false;
    }

    static onMenuNodeShapes: ContextMenuEventListener = function(value, options, e, menu, node) {
        if (!node) {
            throw "no node passed";
        }

        const names = Array.from(SLOT_SHAPE_NAMES).map((n) => { return { content: n } })

        new ContextMenu(names, {
            event: e,
            callback: inner_clicked,
            parentMenu: menu,
            node: node
        });

        function inner_clicked(v: ContextMenuItem) {
            if (!node) {
                return;
            }
			node.graph.beforeChange(/*?*/); //node

			var fApplyMultiNode = function(node: LGraphNode){
				node.shape = SLOT_SHAPE_NAMES.indexOf(v.content) as SlotShape;
			}

			var graphcanvas = LGraphCanvas.active_canvas;
			if (!graphcanvas.selected_nodes || Object.keys(graphcanvas.selected_nodes).length <= 1){
				fApplyMultiNode(node);
			}else{
				for (var i in graphcanvas.selected_nodes) {
					fApplyMultiNode(graphcanvas.selected_nodes[i]);
				}
			}

			node.graph.afterChange(/*?*/); //node
            node.setDirtyCanvas(true);
        }

        return false;
    }

    static onMenuNodeRemove: ContextMenuEventListener = function(value, options, e, menu, node) {
        if (!node) {
            throw "no node passed";
        }

		var graph = node.graph;
		graph.beforeChange();


		var fApplyMultiNode = function(node: LGraphNode){
			if (node.removable === false) {
				return;
			}
			graph.remove(node);
		}

		var graphcanvas = LGraphCanvas.active_canvas;
		if (!graphcanvas.selected_nodes || Object.keys(graphcanvas.selected_nodes).length <= 1){
			fApplyMultiNode(node);
		}else{
			for (var i in graphcanvas.selected_nodes) {
				fApplyMultiNode(graphcanvas.selected_nodes[i]);
			}
		}

		graph.afterChange();
        node.setDirtyCanvas(true, true);
    };

    static onMenuNodeToSubgraph: ContextMenuEventListener = function(value, options, e, menu, node) {
		var graph = node.graph;
		var graphcanvas = LGraphCanvas.active_canvas;
		if(!graphcanvas) //??
			return;

		var nodes_list = Object.values( graphcanvas.selected_nodes || {} );
		if( !nodes_list.length )
			nodes_list = [ node ];

		var subgraph_node = LiteGraph.createNode<Subgraph>("graph/subgraph");
		subgraph_node.pos = node.pos.concat();
		graph.add(subgraph_node);

		subgraph_node.buildFromNodes( nodes_list );

		graphcanvas.deselectAllNodes();
        node.setDirtyCanvas(true, true);
    };

    static onMenuNodeClone: ContextMenuEventListener;


    // refactor: there are different dialogs, some uses createDialog some dont
    prompt(
        this: LGraphCanvas,
        title: string = "",
        value: any,
        callback: Function,
        event: any,
        multiline: boolean = false
    ): IGraphDialog {
        var that = this;

        var dialog = document.createElement("div") as IGraphDialog;
        dialog.is_modified = false;
        dialog.className = "graphdialog rounded";
        if(multiline)
            dialog.innerHTML = "<span class='name'></span> <textarea autofocus class='value'></textarea><button class='rounded'>OK</button>";
        else
            dialog.innerHTML = "<span class='name'></span> <input autofocus type='text' class='value'/><button class='rounded'>OK</button>";
        dialog.close = function() {
            that.prompt_box = null;
            if (dialog.parentNode) {
                dialog.parentNode.removeChild(dialog);
            }
        };

        var graphcanvas = LGraphCanvas.active_canvas;
        var canvas = graphcanvas.canvas;
        canvas.parentNode.appendChild(dialog);

        if (this.ds.scale > 1) {
            dialog.style.transform = "scale(" + this.ds.scale + ")";
        }

        var dialogCloseTimer = null;
        var prevent_timeout = 0;
        LiteGraph.pointerListenerAdd(dialog,"leave", function(e) {
            if (prevent_timeout)
                return;
            if(LiteGraph.dialog_close_on_mouse_leave)
                if (!dialog.is_modified && LiteGraph.dialog_close_on_mouse_leave)
                    dialogCloseTimer = setTimeout(dialog.close, LiteGraph.dialog_close_on_mouse_leave_delay); //dialog.close();
        });
        LiteGraph.pointerListenerAdd(dialog,"enter", function(e) {
            if(LiteGraph.dialog_close_on_mouse_leave)
                if(dialogCloseTimer) clearTimeout(dialogCloseTimer);
        });
        var selInDia = dialog.querySelectorAll("select");
        if (selInDia){
            // if filtering, check focus changed to comboboxes and prevent closing
            selInDia.forEach(function(selIn) {
                selIn.addEventListener("click", function(e) {
                    prevent_timeout++;
                });
                selIn.addEventListener("blur", function(e) {
                    prevent_timeout = 0;
                });
                selIn.addEventListener("change", function(e) {
                    prevent_timeout = -1;
                });
            });
        }

        if (that.prompt_box) {
            that.prompt_box.close();
        }
        that.prompt_box = dialog;

        var first = null;
        var timeout = null;
        var selected = null;

        var name_element = dialog.querySelector(".name") as HTMLDivElement;
        name_element.innerText = title;
        let value_element = dialog.querySelector(".value") as HTMLInputElement;
        value_element.value = value;

        var input = value_element;
        input.addEventListener("keydown", function(e) {
            dialog.is_modified = true;
            if (e.keyCode == 27) {
                //ESC
                dialog.close();
            } else if (e.keyCode == 13 && e.target instanceof Element && e.target.localName != "textarea") {
                if (callback) {
                    callback(this.value);
                }
                dialog.close();
            } else {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
        });

        var button = dialog.querySelector("button");
        button.addEventListener("click", function(e) {
            if (callback) {
                callback(input.value);
            }
            that.setDirty(true);
            dialog.close();
        });

        var rect = canvas.getBoundingClientRect();
        var offsetx = -20;
        var offsety = -20;
        if (rect) {
            offsetx -= rect.left;
            offsety -= rect.top;
        }

        if (event) {
            dialog.style.left = event.clientX + offsetx + "px";
            dialog.style.top = event.clientY + offsety + "px";
        } else {
            dialog.style.left = canvas.width * 0.5 + offsetx + "px";
            dialog.style.top = canvas.height * 0.5 + offsety + "px";
        }

        setTimeout(function() {
            input.focus();
        }, 10);

        return dialog;
    }

    showSearchBox(this: LGraphCanvas, _event: MouseEvent, options: {
        slotFrom?: SlotNameOrIndex | INodeSlot, node_from?: LGraphNode, node_to?: LGraphNode, do_type_filter?: boolean,
        type_filter_in?: SlotType, type_filter_out?: SlotType,
        show_general_if_none_on_typefilter?: boolean,
        show_general_after_typefiltered?: boolean,
        hide_on_mouse_leave?: boolean, show_all_if_empty?: boolean,
        show_all_on_open?: boolean
    } = {}
                 ): IGraphDialog {
        // proposed defaults
        var def_options = { slotFrom: null
                            ,node_from: null
                            ,node_to: null
                            ,do_type_filter: LiteGraph.search_filter_enabled // TODO check for registered_slot_[in/out]_types not empty // this will be checked for functionality enabled : filter on slot type, in and out
                            ,type_filter_in: null                          // these are default: pass to set initially set values
                            ,type_filter_out: null
                            ,show_general_if_none_on_typefilter: true
                            ,show_general_after_typefiltered: true
                            ,hide_on_mouse_leave: LiteGraph.search_hide_on_mouse_leave
                            ,show_all_if_empty: true
                            ,show_all_on_open: LiteGraph.search_show_all_on_open
                          };
        options = Object.assign(def_options, options);

        //console.log(options);

        var that = this;
        var input_html = "";
        var graphcanvas = LGraphCanvas.active_canvas;
        var canvas = graphcanvas.canvas;
        var root_document = canvas.ownerDocument || document;

        let event = _event as MouseEventExt;

        var dialog = document.createElement("div") as IGraphDialog;
        dialog.className = "litegraph litesearchbox graphdialog rounded";
        dialog.innerHTML = "<span class='name'>Search</span> <input autofocus type='text' class='value rounded'/>";
        if (options.do_type_filter){
            dialog.innerHTML += "<select class='slot_in_type_filter'><option value=''></option></select>";
            dialog.innerHTML += "<select class='slot_out_type_filter'><option value=''></option></select>";
        }
        dialog.innerHTML += "<div class='helper'></div>";

        if( root_document.fullscreenElement )
            root_document.fullscreenElement.appendChild(dialog);
        else
        {
            root_document.body.appendChild(dialog);
            root_document.body.style.overflow = "hidden";
        }
        // dialog element has been appended

        if (options.do_type_filter){
            var selIn = dialog.querySelector(".slot_in_type_filter");
            var selOut = dialog.querySelector(".slot_out_type_filter");
        }

        dialog.close = function() {
            that.search_box = null;
            this.blur();
            canvas.focus();
            root_document.body.style.overflow = "";

            setTimeout(function() {
                that.canvas.focus();
            }, 20); //important, if canvas loses focus keys wont be captured
            if (dialog.parentNode) {
                dialog.parentNode.removeChild(dialog);
            }
        };

        if (this.ds.scale > 1) {
            dialog.style.transform = "scale(" + this.ds.scale + ")";
        }

        // hide on mouse leave
        if(options.hide_on_mouse_leave){
            var prevent_timeout = 0;
            var timeout_close = null;
            LiteGraph.pointerListenerAdd(dialog,"enter", function(e) {
                if (timeout_close) {
                    clearTimeout(timeout_close);
                    timeout_close = null;
                }
            });
            LiteGraph.pointerListenerAdd(dialog,"leave", function(e) {
                if (prevent_timeout){
                    return;
                }
                timeout_close = setTimeout(function() {
                    dialog.close();
                }, 500);
            });
            // if filtering, check focus changed to comboboxes and prevent closing
            if (options.do_type_filter){
                selIn.addEventListener("click", function(e) {
                    prevent_timeout++;
                });
                selIn.addEventListener("blur", function(e) {
                    prevent_timeout = 0;
                });
                selIn.addEventListener("change", function(e) {
                    prevent_timeout = -1;
                });
                selOut.addEventListener("click", function(e) {
                    prevent_timeout++;
                });
                selOut.addEventListener("blur", function(e) {
                    prevent_timeout = 0;
                });
                selOut.addEventListener("change", function(e) {
                    prevent_timeout = -1;
                });
            }
        }

        if (that.search_box) {
            that.search_box.close();
        }
        that.search_box = dialog;

        var helper = dialog.querySelector(".helper") as HTMLElement;

        var first = null;
        var timeout = null;
        var selected = null;

        var input = dialog.querySelector("input");
        if (input) {
            input.addEventListener("blur", function(e) {
                this.focus();
            });
            input.addEventListener("keydown", function(e) {
                if (e.keyCode == 38) {
                    //UP
                    changeSelection(false);
                } else if (e.keyCode == 40) {
                    //DOWN
                    changeSelection(true);
                } else if (e.keyCode == 27) {
                    //ESC
                    dialog.close();
                } else if (e.keyCode == 13) {
                    if (selected) {
                        select(selected.innerHTML);
                    } else if (first) {
                        select(first);
                    } else {
                        dialog.close();
                    }
                } else {
                    if (timeout) {
                        clearInterval(timeout);
                    }
                    timeout = setTimeout(refreshHelper, 250);
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return true;
            });
        }

        // if should filter on type, load and fill selected and choose elements if passed
        if (options.do_type_filter){
            if (selIn){
                var aSlots = LiteGraph.slot_types_in;
                var nSlots = aSlots.length; // this for object :: Object.keys(aSlots).length;

                if (options.type_filter_in == BuiltInSlotType.EVENT || options.type_filter_in == BuiltInSlotType.ACTION)
                    options.type_filter_in = "_event_";
                /* this will filter on * .. but better do it manually in case
                   else if(options.type_filter_in === "" || options.type_filter_in === 0)
                   options.type_filter_in = "*";*/

                for (var iK=0; iK<nSlots; iK++){
                    var opt = document.createElement('option');
                    opt.value = aSlots[iK];
                    opt.innerHTML = aSlots[iK];
                    selIn.appendChild(opt);
                    if(options.type_filter_in !== null && (options.type_filter_in+"").toLowerCase() == (aSlots[iK]+"").toLowerCase()){
                        //selIn.selectedIndex ..
                        opt.selected = true;
                        //console.log("comparing IN "+options.type_filter_in+" :: "+aSlots[iK]);
                    }else{
                        //console.log("comparing OUT "+options.type_filter_in+" :: "+aSlots[iK]);
                    }
                }
                selIn.addEventListener("change",function(){
                    refreshHelper();
                });
            }
            if (selOut){
                var aSlots = LiteGraph.slot_types_out;
                var nSlots = aSlots.length; // this for object :: Object.keys(aSlots).length;

                if (options.type_filter_out == BuiltInSlotType.EVENT || options.type_filter_out == BuiltInSlotType.ACTION)
                    options.type_filter_out = "_event_";
                /* this will filter on * .. but better do it manually in case
                   else if(options.type_filter_out === "" || options.type_filter_out === 0)
                   options.type_filter_out = "*";*/

                for (var iK=0; iK<nSlots; iK++){
                    var opt = document.createElement('option');
                    opt.value = aSlots[iK];
                    opt.innerHTML = aSlots[iK];
                    selOut.appendChild(opt);
                    if(options.type_filter_out !== null && (options.type_filter_out+"").toLowerCase() == (aSlots[iK]+"").toLowerCase()){
                        //selOut.selectedIndex ..
                        opt.selected = true;
                    }
                }
                selOut.addEventListener("change",function(){
                    refreshHelper();
                });
            }
        }

        //compute best position
        var rect = canvas.getBoundingClientRect();

        var left = ( event ? event.clientX : (rect.left + rect.width * 0.5) ) - 80;
        var top = ( event ? event.clientY : (rect.top + rect.height * 0.5) ) - 20;
        dialog.style.left = left + "px";
        dialog.style.top = top + "px";

        //To avoid out of screen problems
        if(event.layerY > (rect.height - 200))
            helper.style.maxHeight = (rect.height - event.layerY - 20) + "px";

        /*
          var offsetx = -20;
          var offsety = -20;
          if (rect) {
          offsetx -= rect.left;
          offsety -= rect.top;
          }

          if (event) {
          dialog.style.left = event.clientX + offsetx + "px";
          dialog.style.top = event.clientY + offsety + "px";
          } else {
          dialog.style.left = canvas.width * 0.5 + offsetx + "px";
          dialog.style.top = canvas.height * 0.5 + offsety + "px";
          }
          canvas.parentNode.appendChild(dialog);
        */

        input.focus();
        if (options.show_all_on_open) refreshHelper();

        function select(name) {
            if (name) {
                if (that.onSearchBoxSelection) {
                    that.onSearchBoxSelection(name, event, graphcanvas);
                } else {
                    var extra = LiteGraph.searchbox_extras[name.toLowerCase()];
                    if (extra) {
                        name = extra.type;
                    }

                    graphcanvas.graph.beforeChange();
                    var node = LiteGraph.createNode(name);
                    if (node) {
                        node.pos = graphcanvas.convertEventToCanvasOffset(
                            event
                        );
                        graphcanvas.graph.add(node);
                    }

                    if (extra && extra.data) {
                        if (extra.data.properties) {
                            for (var i in extra.data.properties) {
                                node.addProperty( "" + i, extra.data.properties[i] );
                            }
                        }
                        if (extra.data.inputs) {
                            node.inputs = [];
                            for (var i in extra.data.inputs) {
                                node.addInput(
                                    extra.data.inputs[i][0],
                                    extra.data.inputs[i][1]
                                );
                            }
                        }
                        if (extra.data.outputs) {
                            node.outputs = [];
                            for (var i in extra.data.outputs) {
                                node.addOutput(
                                    extra.data.outputs[i][0],
                                    extra.data.outputs[i][1]
                                );
                            }
                        }
                        if (extra.data.title) {
                            node.title = extra.data.title;
                        }
                        if (extra.data.json) {
                            node.configure(extra.data.json);
                        }

                    }

                    // join node after inserting
                    if (options.node_from){
                        var iS: SlotNameOrIndex | null = null;
                        switch (typeof options.slotFrom){
                            case "string":
                                iS = options.node_from.findOutputSlotIndexByName(options.slotFrom);
                                break;
                                case "object":
                                    if (options.slotFrom.name){
                                        iS = options.node_from.findOutputSlotIndexByName(options.slotFrom.name);
                                    }else{
                                        iS = -1;
                                    }
                                    if (iS==-1 && typeof options.slotFrom.slot_index !== "undefined") iS = options.slotFrom.slot_index;
                                break;
                            case "number":
                                iS = options.slotFrom;
                                break;
                            default:
                                iS = 0; // try with first if no name set
                        }
                        iS = iS as SlotIndex;
                        if (typeof options.node_from.outputs[iS] !== undefined){
                            if (iS !== null && iS>-1){
                                options.node_from.connectByTypeInput( iS, node, options.node_from.outputs[iS].type );
                            }
                        }else{
                            // console.warn("cant find slot " + options.slotFrom);
                        }
                    }
                    if (options.node_to){
                        var iS: SlotNameOrIndex | null = null;
                        switch (typeof options.slotFrom){
                            case "string":
                                iS = options.node_to.findInputSlotIndexByName(options.slotFrom);
                                break;
                                // case "object":
                                //     if (options.slotFrom.name){
                                //         iS = options.node_to.findInputSlot(options.slotFrom.name);
                                //     }else{
                                //         iS = -1;
                                //     }
                                //     if (iS==-1 && typeof options.slotFrom.slot_index !== "undefined") iS = options.slotFrom.slot_index;
                                // break;
                            case "number":
                                iS = options.slotFrom;
                                break;
                            default:
                                iS = 0; // try with first if no name set
                        }
                        if (typeof options.node_to.inputs[iS] !== undefined){
                            if (iS !== null && iS>-1){
                                // try connection
                                options.node_to.connectByTypeOutput(iS,node,options.node_to.inputs[iS].type);
                            }
                        }else{
                            // console.warn("cant find slot_nodeTO " + options.slotFrom);
                        }
                    }

                    graphcanvas.graph.afterChange();
                }
            }

            dialog.close();
        }

        function changeSelection(forward?: boolean) {
            var prev = selected;
            if (selected) {
                selected.classList.remove("selected");
            }
            if (!selected) {
                selected = forward
                    ? helper.childNodes[0]
                    : helper.childNodes[helper.childNodes.length];
            } else {
                selected = forward
                    ? selected.nextSibling
                    : selected.previousSibling;
                if (!selected) {
                    selected = prev;
                }
            }
            if (!selected) {
                return;
            }
            selected.classList.add("selected");
            selected.scrollIntoView({block: "end", behavior: "smooth"});
        }

        function refreshHelper() {
            timeout = null;
            var str = input.value;
            first = null;
            helper.innerHTML = "";
            if (!str && !options.show_all_if_empty) {
                return;
            }

            if (that.onSearchBox) {
                var list = that.onSearchBox(helper, str, graphcanvas);
                if (list) {
                    for (var i = 0; i < list.length; ++i) {
                        addResult(list[i]);
                    }
                }
            } else {
                var c = 0;
                str = str.toLowerCase();
                var filter = graphcanvas.filter || graphcanvas.graph.filter;

                // filter by type preprocess
                if(options.do_type_filter && that.search_box){
                    var sIn = that.search_box.querySelector(".slot_in_type_filter");
                    var sOut = that.search_box.querySelector(".slot_out_type_filter");
                }else{
                    var sIn = false;
                    var sOut = false;
                }

                //extras
                for (const i in LiteGraph.searchbox_extras) {
                    var extra = LiteGraph.searchbox_extras[i];
                    if ((!options.show_all_if_empty || str) && extra.desc.toLowerCase().indexOf(str) === -1) {
                        continue;
                    }
                    var ctor = LiteGraph.registered_node_types[ extra.type ];
                    if( ctor && ctor.filter != filter )
                        continue;
                    if( ! inner_test_filter(extra.type) )
                        continue;
                    addResult( extra.desc, "searchbox_extra" );
                    if ( LGraphCanvas.search_limit !== -1 && c++ > LGraphCanvas.search_limit ) {
                        break;
                    }
                }

                var filtered: string[] | null = null;
                if (Array.prototype.filter) { //filter supported
                    var keys = Object.keys( LiteGraph.registered_node_types ); //types
                    var filtered = keys.filter( inner_test_filter );
                } else {
                    filtered = [];
                    for (const i in LiteGraph.registered_node_types) {
                        if( inner_test_filter(i) )
                            filtered.push(i);
                    }
                }

                for (var i = 0; i < filtered.length; i++) {
                    addResult(filtered[i]);
                    if ( LGraphCanvas.search_limit !== -1 && c++ > LGraphCanvas.search_limit ) {
                        break;
                    }
                }

                // add general type if filtering
                if (options.show_general_after_typefiltered
                    && (sIn.value || sOut.value)
                   ){
                    filtered_extra = [];
                    for (var i in LiteGraph.registered_node_types) {
                        if( inner_test_filter(i, {inTypeOverride: sIn&&sIn.value?"*":false, outTypeOverride: sOut&&sOut.value?"*":false}) )
                            filtered_extra.push(i);
                    }
                    for (var i = 0; i < filtered_extra.length; i++) {
                        addResult(filtered_extra[i], "generic_type");
                        if ( LGraphCanvas.search_limit !== -1 && c++ > LGraphCanvas.search_limit ) {
                            break;
                        }
                    }
                }

                // check il filtering gave no results
                if ((sIn.value || sOut.value) &&
                    ( (helper.childNodes.length == 0 && options.show_general_if_none_on_typefilter) )
                   ){
                    filtered_extra = [];
                    for (var i in LiteGraph.registered_node_types) {
                        if( inner_test_filter(i, {skipFilter: true}) )
                            filtered_extra.push(i);
                    }
                    for (var i = 0; i < filtered_extra.length; i++) {
                        addResult(filtered_extra[i], "not_in_filter");
                        if ( LGraphCanvas.search_limit !== -1 && c++ > LGraphCanvas.search_limit ) {
                            break;
                        }
                    }
                }

                function inner_test_filter( type, optsIn = {} )
                {
                    var optsIn = optsIn || {};
                    var optsDef = { skipFilter: false
                                    ,inTypeOverride: false
                                    ,outTypeOverride: false
                                  };
                    var opts = Object.assign(optsDef,optsIn);
                    var ctor = LiteGraph.registered_node_types[ type ];
                    if(filter && ctor.filter != filter )
                        return false;
                    if ((!options.show_all_if_empty || str) && type.toLowerCase().indexOf(str) === -1)
                        return false;

                    // filter by slot IN, OUT types
                    if(options.do_type_filter && !opts.skipFilter){
                        var sType = type;

                        var sV = sIn.value;
                        if (opts.inTypeOverride!==false) sV = opts.inTypeOverride;
                        //if (sV.toLowerCase() == "_event_") sV = LiteGraph.EVENT; // -1

                        if(sIn && sV){
                            //console.log("will check filter against "+sV);
                            if (LiteGraph.registered_slot_in_types[sV] && LiteGraph.registered_slot_in_types[sV].nodes){ // type is stored
                                //console.debug("check "+sType+" in "+LiteGraph.registered_slot_in_types[sV].nodes);
                                var doesInc = LiteGraph.registered_slot_in_types[sV].nodes.includes(sType);
                                if (doesInc!==false){
                                    //console.log(sType+" HAS "+sV);
                                }else{
                                    /*console.debug(LiteGraph.registered_slot_in_types[sV]);
                                      console.log(+" DONT includes "+type);*/
                                    return false;
                                }
                            }
                        }

                        var sV = sOut.value;
                        if (opts.outTypeOverride!==false) sV = opts.outTypeOverride;
                        //if (sV.toLowerCase() == "_event_") sV = LiteGraph.EVENT; // -1

                        if(sOut && sV){
                            //console.log("search will check filter against "+sV);
                            if (LiteGraph.registered_slot_out_types[sV] && LiteGraph.registered_slot_out_types[sV].nodes){ // type is stored
                                //console.debug("check "+sType+" in "+LiteGraph.registered_slot_out_types[sV].nodes);
                                var doesInc = LiteGraph.registered_slot_out_types[sV].nodes.includes(sType);
                                if (doesInc!==false){
                                    //console.log(sType+" HAS "+sV);
                                }else{
                                    /*console.debug(LiteGraph.registered_slot_out_types[sV]);
                                      console.log(+" DONT includes "+type);*/
                                    return false;
                                }
                            }
                        }
                    }
                    return true;
                }
            }

            function addResult(type: string, className?: string) {
                var help = document.createElement("div");
                if (!first) {
                    first = type;
                }
                help.innerText = type;
                help.dataset["type"] = escape(type);
                help.className = "litegraph lite-search-item";
                if (className) {
                    help.className += " " + className;
                }
                help.addEventListener("click", function(e) {
                    select(unescape(this.dataset["type"]));
                });
                helper.appendChild(help);
            }
        }

        return dialog;
    }

    showShowNodePanel(this: LGraphCanvas, node: LGraphNode) {
        // this.SELECTED_NODE = node;
        this.closePanels();
        var ref_window = this.getCanvasWindow();
        var that = this;
        var graphcanvas = this;
        var panel = this.createPanel(node.title || "",{
            closable: true
            ,window: ref_window
            ,onOpen: function(){
                graphcanvas.NODEPANEL_IS_OPEN = true;
            }
            ,onClose: function(){
                graphcanvas.NODEPANEL_IS_OPEN = false;
                graphcanvas.node_panel = null;
            }
        });
        graphcanvas.node_panel = panel;
        panel.id = "node-panel";
        panel.node = node;
        panel.classList.add("settings");

        function inner_refresh()
        {
            panel.content.innerHTML = ""; //clear
            panel.addHTML("<span class='node_type'>"+node.type+"</span><span class='node_desc'>"+(node.constructor.desc || "")+"</span><span class='separator'></span>");

            panel.addHTML("<h3>Properties</h3>");

            var fUpdate = function(name,value){
                graphcanvas.graph.beforeChange(node);
                switch(name){
                    case "Title":
                        node.title = value;
                        break;
                    case "Mode":
                        var kV = Object.values(LiteGraph.NODE_MODES).indexOf(value);
                        if (kV>=0 && LiteGraph.NODE_MODES[kV]){
                            node.changeMode(kV);
                        }else{
                            console.warn("unexpected mode: "+value);
                        }
                        break;
                    case "Color":
                        if (LGraphCanvas.node_colors[value]){
                            node.color = LGraphCanvas.node_colors[value].color;
                            node.bgcolor = LGraphCanvas.node_colors[value].bgcolor;
                        }else{
                            console.warn("unexpected color: "+value);
                        }
                        break;
                    default:
                        node.setProperty(name,value);
                        break;
                }
                graphcanvas.graph.afterChange();
                graphcanvas.dirty_canvas = true;
            };

            panel.addWidget( "string", "Title", node.title, {}, fUpdate);

            panel.addWidget( "combo", "Mode", LiteGraph.NODE_MODES[node.mode], {values: LiteGraph.NODE_MODES}, fUpdate);

            var nodeCol = "";
            if (node.color !== undefined){
                nodeCol = Object.keys(LGraphCanvas.node_colors).filter(function(nK){ return LGraphCanvas.node_colors[nK].color == node.color; });
            }

            panel.addWidget( "combo", "Color", nodeCol, {values: Object.keys(LGraphCanvas.node_colors)}, fUpdate);

            for(var pName in node.properties)
            {
                var value = node.properties[pName];
                var info = node.getPropertyInfo(pName);
                var type = info.type || "string";

                //in case the user wants control over the side panel widget
                if( node.onAddPropertyToPanel && node.onAddPropertyToPanel(pName,panel) )
                    continue;

                panel.addWidget( info.widget || info.type, pName, value, info, fUpdate);
            }

            panel.addSeparator();

            if(node.onShowCustomPanelInfo)
                node.onShowCustomPanelInfo(panel);

            panel.footer.innerHTML = ""; // clear
            panel.addButton("Delete",function(){
                if(node.block_delete)
                    return;
                node.graph.remove(node);
                panel.close();
            }).classList.add("delete");
        }

        panel.inner_showCodePad = function( propname: string ): void
        {
            panel.classList.remove("settings");
            panel.classList.add("centered");


            /*if(window.CodeFlask) //disabled for now
              {
              panel.content.innerHTML = "<div class='code'></div>";
              var flask = new CodeFlask( "div.code", { language: 'js' });
              flask.updateCode(node.properties[propname]);
              flask.onUpdate( function(code) {
              node.setProperty(propname, code);
              });
              }
              else
              {*/
            panel.alt_content.innerHTML = "<textarea class='code'></textarea>";
            var textarea = panel.alt_content.querySelector("textarea");
            var fDoneWith = function(){
                panel.toggleAltContent(false); //if(node_prop_div) node_prop_div.style.display = "block"; // panel.close();
                panel.toggleFooterVisibility(true);
                textarea.parentNode.removeChild(textarea);
                panel.classList.add("settings");
                panel.classList.remove("centered");
                inner_refresh();
            }
            textarea.value = node.properties[propname];
            textarea.addEventListener("keydown", function(e){
                if(e.code == "Enter" && e.ctrlKey )
                {
                    node.setProperty(propname, textarea.value);
                    fDoneWith();
                }
            });
            panel.toggleAltContent(true);
            panel.toggleFooterVisibility(false);
            textarea.style.height = "calc(100% - 40px)";
            /*}*/
            var assign = panel.addButton( "Assign", function(){
                node.setProperty(propname, textarea.value);
                fDoneWith();
            });
            panel.alt_content.appendChild(assign); //panel.content.appendChild(assign);
            var button = panel.addButton( "Close", fDoneWith);
            button.style.float = "right";
            panel.alt_content.appendChild(button); // panel.content.appendChild(button);
        }

        inner_refresh();

        this.canvas.parentNode.appendChild( panel );
    }

	showSubgraphPropertiesDialog(this: LGraphCanvas, node: LGraphNode) {
		console.log("showing subgraph properties dialog");

		var old_panel = this.canvas.parentNode.querySelector(".subgraph_dialog") as ISubgraphPropertiesPanel;
		if(old_panel)
			old_panel.close();

		var panel = this.createPanel("Subgraph Inputs",{closable:true, width: 500}) as ISubgraphPropertiesPanel;
		panel.node = node;
		panel.classList.add("subgraph_dialog");

		function inner_refresh()
		{
			panel.clear();

			//show currents
			if(node.inputs)
				for(var i = 0; i < node.inputs.length; ++i)
				{
					var input = node.inputs[i];
					if(input.not_subgraph_input)
						continue;
					var html = `
<button>&#10005;</button>
<span class='bullet_icon'></span>
<span class='name'></span>
<span class='type'></span>`;
					var elem = panel.addHTML(html,"subgraph_property");
					elem.dataset["name"] = input.name;
					elem.dataset["slot"] = "" + i;
					elem.querySelector<HTMLSpanElement>(".name").innerText = input.name;
					elem.querySelector<HTMLSpanElement>(".type").innerText = "" + input.type;
					elem.querySelector<HTMLButtonElement>("button").addEventListener("click",function(e){
						node.removeInput( Number( (this.parentNode as HTMLElement).dataset["slot"] ) );
						inner_refresh();
					});
				}
		}

		//add extra
		var html = `
+
<span class='label'>Name</span>
<input class='name'/>
<span class='label'>Type</span>
<input class='type'></input>
<button>+</button>`;
		var elem = panel.addHTML(html,"subgraph_property extra", true);
		elem.querySelector("button").addEventListener("click", function(e){
			var elem = this.parentNode;
			var name = elem.querySelector<HTMLSpanElement>(".name").value;
			var type = elem.querySelector<HTMLSpanElement>(".type").value;
			if(!name || node.findInputSlotIndexByName(name) != -1)
				return;
			node.addInput(name,type);
			elem.querySelector<HTMLInputElement>(".name").value = "";
			elem.querySelector<HTMLInputElement>(".type").value = "";
			inner_refresh();
		});

		inner_refresh();
	    this.canvas.parentNode.appendChild(panel);
		return panel;
	}

    showSubgraphPropertiesDialogRight(this: LGraphCanvas, node: LGraphNode) {
        // console.log("showing subgraph properties dialog");
        var that = this;
        // old_panel if old_panel is exist close it
        var old_panel = this.canvas.parentNode.querySelector(".subgraph_dialog") as ISubgraphPropertiesPanel;
        if (old_panel)
            old_panel.close();
        // new panel
        var panel = this.createPanel("Subgraph Outputs", { closable: true, width: 500 }) as ISubgraphPropertiesPanel;
        panel.node = node;
        panel.classList.add("subgraph_dialog");

        function inner_refresh() {
            panel.clear();
            //show currents
            if (node.outputs)
                for (var i = 0; i < node.outputs.length; ++i) {
                    var output = node.outputs[i];
                    if (output.not_subgraph_output)
                        continue;
                    var html = `
<button>&#10005;</button>
<span class='bullet_icon'></span>
<span class='name'></span>
<span class='type'></span>`;
                    var elem = panel.addHTML(html, "subgraph_property");
                    elem.dataset["name"] = output.name;
                    elem.dataset["slot"] = "" + i;
                    elem.querySelector<HTMLSpanElement>(".name").innerText = output.name;
                    elem.querySelector<HTMLSpanElement>(".type").innerText = "" + output.type;
                    elem.querySelector<HTMLButtonElement>("button").addEventListener("click", function (e) {
                        node.removeOutput(Number((this.parentNode as HTMLElement).dataset["slot"]));
                        inner_refresh();
                    });
                }
        }

        //add extra
        var html = `
+
<span class='label'>Name</span>
<input class='name'/>
<span class='label'>Type</span>
<input class='type'></input>
<button>+</button>`;
        var elem = panel.addHTML(html, "subgraph_property extra", true);
        elem.querySelector<HTMLInputElement>(".name").addEventListener("keydown", function (e) {
            if (e.keyCode == 13) {
                addOutput.apply(this)
            }
        })
        elem.querySelector<HTMLButtonElement>("button").addEventListener("click", function (e) {
            addOutput.apply(this)
        });
        function addOutput() {
            var elem = this.parentNode;
            var name = elem.querySelector(".name").value;
            var type = elem.querySelector(".type").value;
            if (!name || node.findOutputSlotIndexByName(name) != -1)
                return;
            node.addOutput(name, type);
            elem.querySelector(".name").value = "";
            elem.querySelector(".type").value = "";
            inner_refresh();
        }

        inner_refresh();
        this.canvas.parentNode.appendChild(panel);
        return panel;
    }

    showConnectionMenu(this: LGraphCanvas, optPass: {
        nodeFrom?: LGraphNode,
        slotFrom?: SlotNameOrIndex | INodeSlot,
        nodeTo?: LGraphNode,
        slotTo?: SlotNameOrIndex | INodeSlot,
        e?: Event
    } = {}) { // addNodeMenu for connection
        var opts = Object.assign({   nodeFrom: null  // input
                                     ,slotFrom: null // input
                                     ,nodeTo: null   // output
                                     ,slotTo: null   // output
                                     ,e: null
                                 }
                                 ,optPass
                                );
        var that = this;

        var isFrom = opts.nodeFrom && opts.slotFrom;
        var isTo = !isFrom && opts.nodeTo && opts.slotTo;

        if (!isFrom && !isTo){
            console.warn("No data passed to showConnectionMenu");
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
            default:
                // bad ?
                //iSlotConn = 0;
                console.warn("Cant get slot information "+slotX);
                return false;
        }

        slotX = slotX as INodeSlot;

        var options: IContextMenuItem[] = [{ content: "Add Node" }, null];

        if (that.allow_searchbox){
            options.push({ content: "Search" });
            options.push(null);
        }

        // get defaults nodes for this slottype
        var fromSlotType = slotX.type == BuiltInSlotType.EVENT ? "_event_" : slotX.type;
        var slotTypesDefault = isFrom ? LiteGraph.slot_types_default_out : LiteGraph.slot_types_default_in;
        const fromSlotSpec = slotTypesDefault[fromSlotType];
        if(slotTypesDefault && slotTypesDefault[fromSlotType]){
            if(Array.isArray(fromSlotSpec)){
                for(var typeX of fromSlotSpec){
                    options.push({ content: fromSlotSpec[typeX] });
                }
            } else if (typeof fromSlotSpec === "object") {
                options.push({ content: fromSlotSpec.node });
            }
            else {
                options.push({ content: fromSlotSpec });
            }
        }

        // build menu
        var menu = new ContextMenu(options, {
            event: opts.e,
            title: (slotX && slotX.name!="" ? (slotX.name + (fromSlotType?" | ":"")) : "")+(slotX && fromSlotType ? fromSlotType : ""),
            callback: inner_clicked
        });

        // callback
        function inner_clicked(v: ContextMenuItem, options, e) {
            //console.log("Process showConnectionMenu selection");
            switch (v.content) {
                case "Add Node":
                    LGraphCanvas.onMenuAdd(null, null, e, menu, function(node){
                        if (isFrom){
                            opts.nodeFrom.connectByType( iSlotConn, node, fromSlotType );
                        }else{
                            opts.nodeTo.connectByTypeOutput( iSlotConn, node, fromSlotType );
                        }
                    });
                    break;
                case "Search":
                    if(isFrom){
                        that.showSearchBox(e,{node_from: opts.nodeFrom, slotFrom: slotX, type_filter_in: fromSlotType});
                    }else{
                        that.showSearchBox(e,{node_to: opts.nodeTo, slotFrom: slotX, type_filter_out: fromSlotType});
                    }
                    break;
                default:
					// check for defaults nodes for this slottype
					var nodeCreated = that.createDefaultNodeForSlot(v.content, Object.assign(opts,{ position: [opts.e.canvasX, opts.e.canvasY]}));
					if (nodeCreated){
						// new node created
						//console.log("node "+v+" created")
					}else{
						// failed or v is not in defaults
					}
					break;
            }
        }

        return false;
    }

    showLinkMenu(this: LGraphCanvas, link: LLink, e: any): false {
        var that = this;
		// console.log(link);
		var node_left = that.graph.getNodeById( link.origin_id );
		var node_right = that.graph.getNodeById( link.target_id );
		var fromType: SlotType | null = null;
		if (node_left && node_left.outputs && node_left.outputs[link.origin_slot])
            fromType = node_left.outputs[link.origin_slot].type;
        var destType: SlotType | null = null;
		if (node_right && node_right.outputs && node_right.outputs[link.target_slot])
            destType = node_right.inputs[link.target_slot].type;

		var options: IContextMenuItem[] = [{ content: "Add Node" }, null, { content: "Delete" }, null];


        var menu = new ContextMenu(options, {
            event: e,
			title: link.data != null ? link.data.constructor.name : null,
            callback: inner_clicked
        });

        function inner_clicked(v: ContextMenuItem, options,e) {
            switch (v.content) {
                case "Add Node":
					LGraphCanvas.onMenuAdd(null, null, e, menu, null, function(node){
						// console.debug("node autoconnect");
						if(!node.inputs || !node.inputs.length || !node.outputs || !node.outputs.length){
							return;
						}
						// leave the connection type checking inside connectByType
						if (node_left.connectByTypeInput( link.origin_slot, node, fromType )){
                        	node.connectByTypeInput( link.target_slot, node_right, destType );
                            node.pos[0] -= node.size[0] * 0.5;
                        }
					});
					break;

                case "Delete":
                    that.graph.removeLink(link.id);
                    break;
                default:
					/*var nodeCreated = createDefaultNodeForSlot({   nodeFrom: node_left
																	,slotFrom: link.origin_slot
																	,nodeTo: node
																	,slotTo: link.target_slot
																	,e: e
																	,nodeType: "AUTO"
																});
					if(nodeCreated) console.log("new node in beetween "+v+" created");*/
            }
        }

        return false;
    }

    showEditPropertyValue(this: LGraphCanvas, node: LGraphNode, property: any, options: any): IGraphDialog {
        if (!node || node.properties[property] === undefined) {
            return;
        }

        options = options || {};
        var that = this;

        var info = node.getPropertyInfo(property);
        var type = info.type;

        var input_html = "";

        if (type == "string" || type == "number" || type == "array" || type == "object") {
            input_html = "<input autofocus type='text' class='value'/>";
        } else if ( (type == "enum" || type == "combo") && info.values) {
            input_html = "<select autofocus type='text' class='value'>";
            for (var i in info.values) {
                var v = i;
                if( info.values instanceof Array )
                    v = info.values[i];

                input_html +=
                "<option value='" +
                    v +
                    "' " +
                    (v == node.properties[property] ? "selected" : "") +
                    ">" +
                    info.values[i] +
                    "</option>";
            }
            input_html += "</select>";
        } else if (type == "boolean" || type == "toggle") {
            input_html =
                "<input autofocus type='checkbox' class='value' " +
                (node.properties[property] ? "checked" : "") +
                "/>";
        } else {
            console.warn("unknown type: " + type);
            return;
        }

        var dialog = this.createDialog(
            "<span class='name'>" +
                (info.label ? info.label : property) +
                "</span>" +
                input_html +
                "<button>OK</button>",
            options
        );

        var input = null;
        if ((type == "enum" || type == "combo") && info.values) {
            input = dialog.querySelector("select");
            input.addEventListener("change", function(e) {
                dialog.modified();
                setValue(e.target.value);
                //var index = e.target.value;
                //setValue( e.options[e.selectedIndex].value );
            });
        } else if (type == "boolean" || type == "toggle") {
            input = dialog.querySelector("input");
            if (input) {
                input.addEventListener("click", function(e) {
                    dialog.modified();
                    setValue(!!input.checked);
                });
            }
        } else {
            input = dialog.querySelector("input");
            if (input) {
                input.addEventListener("blur", function(e) {
                    this.focus();
                });

                let v = node.properties[property] !== undefined ? node.properties[property] : "";
                if (type !== 'string') {
                    v = JSON.stringify(v);
                }

                input.value = v;
                input.addEventListener("keydown", function(e) {
                    if (e.keyCode == 27) {
                        //ESC
                        dialog.close();
                    } else if (e.keyCode == 13) {
                        // ENTER
                        inner(); // save
                    } else if (e.keyCode != 13) {
                        dialog.modified();
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                });
            }
        }
        if (input) input.focus();

        var button = dialog.querySelector("button");
        button.addEventListener("click", inner);

        function inner() {
            setValue(input.value);
        }

        function setValue(value: any) {
            if(info && info.values && info.values.constructor === Object && info.values[value] != undefined )
                value = info.values[value];

            if (typeof node.properties[property] == "number") {
                value = Number(value);
            }
            if (type == "array" || type == "object") {
                value = JSON.parse(value);
            }
            node.properties[property] = value;
            if (node.graph) {
                (node.graph as any)._version++;
            }
            if (node.onPropertyChanged) {
                node.onPropertyChanged(property, value);
            }
            if(options.onclose)
                options.onclose();
            dialog.close();
            node.setDirtyCanvas(true, true);
        }

        return dialog;
    }

    // TODO refactor, theer are different dialog, some uses createDialog, some dont
    createDialog(
        this: LGraphCanvas,
        html: string,
        options?: { position?: Vector2; event?: MouseEvent, checkForInput?: boolean, closeOnLeave?: boolean, closeOnLeave_checkModified?: boolean }
    ): IGraphDialog {
        var def_options = { checkForInput: false, closeOnLeave: true, closeOnLeave_checkModified: true };
        options = Object.assign(def_options, options || {});

        var dialog = document.createElement("div") as IGraphDialog;
        dialog.className = "graphdialog";
        dialog.innerHTML = html;
        dialog.is_modified = false;

        var rect = this.canvas.getBoundingClientRect();
        var offsetx = -20;
        var offsety = -20;
        if (rect) {
            offsetx -= rect.left;
            offsety -= rect.top;
        }

        if (options.position) {
            offsetx += options.position[0];
            offsety += options.position[1];
        } else if (options.event) {
            offsetx += options.event.clientX;
            offsety += options.event.clientY;
        } //centered
        else {
            offsetx += this.canvas.width * 0.5;
            offsety += this.canvas.height * 0.5;
        }

        dialog.style.left = offsetx + "px";
        dialog.style.top = offsety + "px";

        this.canvas.parentNode.appendChild(dialog);

        // acheck for input and use default behaviour: save on enter, close on esc
        if (options.checkForInput){
            var aI = dialog.querySelectorAll("input");
            var focused = false;
            if (aI){
                aI.forEach(function(iX) {
                    iX.addEventListener("keydown",function(e){
                        dialog.modified();
                        if (e.keyCode == 27) {
                            dialog.close();
                        } else if (e.keyCode != 13) {
                            return;
                        }
                        // set value ?
                        e.preventDefault();
                        e.stopPropagation();
                    });
                    if (!focused) iX.focus();
                });
            }
        }

        dialog.modified = function(){
            dialog.is_modified = true;
        }
        dialog.close = function() {
            if (dialog.parentNode) {
                dialog.parentNode.removeChild(dialog);
            }
        };

        var dialogCloseTimer = null;
        var prevent_timeout = 0;
        dialog.addEventListener("mouseleave", function(e) {
            if (prevent_timeout)
                return;
            if(options.closeOnLeave || LiteGraph.dialog_close_on_mouse_leave)
                if (!dialog.is_modified && LiteGraph.dialog_close_on_mouse_leave)
                    dialogCloseTimer = setTimeout(dialog.close, LiteGraph.dialog_close_on_mouse_leave_delay); //dialog.close();
        });
        dialog.addEventListener("mouseenter", function(e) {
            if(options.closeOnLeave || LiteGraph.dialog_close_on_mouse_leave)
                if(dialogCloseTimer) clearTimeout(dialogCloseTimer);
        });
        var selInDia = dialog.querySelectorAll("select");
        if (selInDia){
            // if filtering, check focus changed to comboboxes and prevent closing
            selInDia.forEach(function(selIn) {
                selIn.addEventListener("click", function(e) {
                    prevent_timeout++;
                });
                selIn.addEventListener("blur", function(e) {
                    prevent_timeout = 0;
                });
                selIn.addEventListener("change", function(e) {
                    prevent_timeout = -1;
                });
            });
        }

        return dialog;
    }


    getCanvasMenuOptions(this: LGraphCanvas): ContextMenuItem[] {
        var options = null;
        var that = this;
        if (this.getMenuOptions) {
            options = this.getMenuOptions(this);
        } else {
            options = [
                {
                    content: "Add Node",
                    has_submenu: true,
                    callback: LGraphCanvas.onMenuAdd
                },
                { content: "Add Group", callback: LGraphCanvas.onGroupAdd },
                //{ content: "Arrange", callback: that.graph.arrange },
                //{content:"Collapse All", callback: LGraphCanvas.onMenuCollapseAll }
            ];
            /*if (LiteGraph.showCanvasOptions){
              options.push({ content: "Options", callback: that.showShowGraphOptionsPanel });
              }*/

            if (this._graph_stack && this._graph_stack.length > 0) {
                options.push(null, {
                    content: "Close subgraph",
                    callback: this.closeSubgraph.bind(this)
                });
            }
        }

        if (this.getExtraMenuOptions) {
            var extra = this.getExtraMenuOptions(this, options);
            if (extra) {
                options = options.concat(extra);
            }
        }

        return options;
    }

    getNodeMenuOptions(node: LGraphNode): ContextMenuItem[] {
        let options: IContextMenuItem[] = [];

        if (node.getMenuOptions) {
            options = node.getMenuOptions(this);
        } else {
            options = [
                {
                    content: "Inputs",
                    has_submenu: true,
                    disabled: true,
                    callback: LGraphCanvas.showMenuNodeOptionalInputs
                },
                {
                    content: "Outputs",
                    has_submenu: true,
                    disabled: true,
                    callback: LGraphCanvas.showMenuNodeOptionalOutputs
                },
                null,
                {
                    content: "Properties",
                    has_submenu: true,
                    callback: LGraphCanvas.onShowMenuNodeProperties
                },
                null,
                {
                    content: "Title",
                    callback: LGraphCanvas.onShowPropertyEditor
                },
                {
                    content: "Mode",
                    has_submenu: true,
                    callback: LGraphCanvas.onMenuNodeMode
                }];
            if(node.resizable !== false){
                options.push({
                    content: "Resize", callback: LGraphCanvas.onMenuResizeNode
                });
            }
            options.push(
                {
                    content: "Collapse",
                    callback: LGraphCanvas.onMenuNodeCollapse
                },
                { content: "Pin", callback: LGraphCanvas.onMenuNodePin },
                {
                    content: "Colors",
                    has_submenu: true,
                    callback: LGraphCanvas.onMenuNodeColors
                },
                {
                    content: "Shapes",
                    has_submenu: true,
                    callback: LGraphCanvas.onMenuNodeShapes
                },
                null
            );
        }

        if (node.onGetInputs) {
            var inputs = node.onGetInputs();
            if (inputs && inputs.length) {
                options[0].disabled = false;
            }
        }

        if (node.onGetOutputs) {
            var outputs = node.onGetOutputs();
            if (outputs && outputs.length) {
                options[1].disabled = false;
            }
        }

        if (node.getExtraMenuOptions) {
            var extra = node.getExtraMenuOptions(this, options);
            if (extra) {
                extra.push(null);
                options = extra.concat(options);
            }
        }

        if (node.clonable !== false) {
            options.push({
                content: "Clone",
                callback: LGraphCanvas.onMenuNodeClone
            });
        }

        // if(0) //TODO
        //     options.push({
        //         content: "To Subgraph",
        //         callback: LGraphCanvas.onMenuNodeToSubgraph
        //     });

        options.push(null, {
            content: "Remove",
            disabled: !(node.removable !== false && !node.block_delete ),
            callback: LGraphCanvas.onMenuNodeRemove
        });

        if (node.graph && node.graph.onGetNodeMenuOptions) {
            options = node.graph.onGetNodeMenuOptions(options, node);
        }

        return options;
    }

    getGroupMenuOptions(node: LGraphNode): ContextMenuItem[] {
        var o = [
            { content: "Title", callback: LGraphCanvas.onShowPropertyEditor },
            {
                content: "Color",
                has_submenu: true,
                callback: LGraphCanvas.onMenuNodeColors
            },
            {
                content: "Font size",
                property: "font_size",
                type: "Number",
                callback: LGraphCanvas.onShowPropertyEditor
            },
            null,
            { content: "Remove", callback: LGraphCanvas.onMenuNodeRemove }
        ];

        return o;
    }

    /** Called when mouse right click */
    processContextMenu(this: LGraphCanvas, node: LGraphNode, _event: Event): void {
        var that = this;
        var canvas = LGraphCanvas.active_canvas;
        var ref_window = canvas.getCanvasWindow();

        let event = _event as MouseEventExt;

        var menu_info = null;
        var options: any = {
            event: event,
            callback: inner_option_clicked,
            extra: node
        };

        if(node)
            options.title = node.type;

        //check if mouse is in input
        var slot = null;
        if (node) {
            slot = node.getSlotInPosition(event.canvasX, event.canvasY);
            LGraphCanvas.active_node = node;
        }

        if (slot) {
            //on slot
            menu_info = [];
            if (node.getSlotMenuOptions) {
                menu_info = node.getSlotMenuOptions(slot);
            } else {
                if (
                    slot &&
                        slot.output &&
                        slot.output.links &&
                        slot.output.links.length
                ) {
                    menu_info.push({ content: "Disconnect Links", slot: slot });
                }
                var _slot = slot.input || slot.output;
                if (_slot.removable){
                    menu_info.push(
                        _slot.locked
                            ? "Cannot remove"
                            : { content: "Remove Slot", slot: slot }
                    );
                }
                if (!_slot.nameLocked){
                    menu_info.push({ content: "Rename Slot", slot: slot });
                }

            }
            options.title =
                (slot.input ? slot.input.type : slot.output.type) || "*";
            if (slot.input && slot.input.type == BuiltInSlotType.ACTION) {
                options.title = "Action";
            }
            if (slot.output && slot.output.type == BuiltInSlotType.EVENT) {
                options.title = "Event";
            }
        } else {
            if (node) {
                //on node
                menu_info = this.getNodeMenuOptions(node);
            } else {
                menu_info = this.getCanvasMenuOptions();
                var group = this.graph.getGroupOnPos(
                    event.canvasX,
                    event.canvasY
                );
                if (group) {
                    //on group
                    menu_info.push(null, {
                        content: "Edit Group",
                        has_submenu: true,
                        submenu: {
                            title: "Group",
                            extra: group,
                            options: this.getGroupMenuOptions(group)
                        }
                    });
                }
            }
        }

        //show menu
        if (!menu_info) {
            return;
        }

        var menu = new ContextMenu(menu_info, options, ref_window);

        function inner_option_clicked(v, options, e) {
            if (!v) {
                return;
            }

            if (v.content == "Remove Slot") {
                var info = v.slot;
                node.graph.beforeChange();
                if (info.input) {
                    node.removeInput(info.slot);
                } else if (info.output) {
                    node.removeOutput(info.slot);
                }
                node.graph.afterChange();
                return;
            } else if (v.content == "Disconnect Links") {
                var info = v.slot;
                node.graph.beforeChange();
                if (info.output) {
                    node.disconnectOutput(info.slot);
                } else if (info.input) {
                    node.disconnectInput(info.slot);
                }
                node.graph.afterChange();
                return;
            } else if (v.content == "Rename Slot") {
                var info = v.slot;
                var slot_info = info.input
                    ? node.getInputInfo(info.slot)
                    : node.getOutputInfo(info.slot);
                var dialog = that.createDialog(
                    "<span class='name'>Name</span><input autofocus type='text'/><button>OK</button>",
                    options
                );
                var input = dialog.querySelector("input");
                if (input && slot_info) {
                    input.value = slot_info.label || "";
                }
                var inner = function(){
                    node.graph.beforeChange();
                    if (input.value) {
                        if (slot_info) {
                            slot_info.label = input.value;
                        }
                        that.setDirty(true);
                    }
                    dialog.close();
                    node.graph.afterChange();
                }
                dialog.querySelector("button").addEventListener("click", inner);
                input.addEventListener("keydown", function(e) {
                    dialog.is_modified = true;
                    if (e.keyCode == 27) {
                        //ESC
                        dialog.close();
                    } else if (e.keyCode == 13) {
                        inner(); // save
                    } else if (e.keyCode != 13 && e.target.localName != "textarea") {
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                });
                input.focus();
            }

            //if(v.callback)
            //	return v.callback.call(that, node, options, e, menu, that, event );
        }
    }

    createPanel(title: string, options:
                { window?: Window, width?: number, height?: number, closable?: boolean, }
        = {}) {
        var ref_window = options.window || window;
        var root = document.createElement("div") as IGraphPanel;
        root.className = "litegraph dialog";
        root.innerHTML = `
<div class='dialog-header'><span class='dialog-title'></span></div>
<div class='dialog-content'></div>
<div style='display:none;' class='dialog-alt-content'></div>
<div class='dialog-footer'></div>`
        root.header = root.querySelector(".dialog-header") as HTMLDivElement;

		if(options.width)
			root.style.width = options.width + (options.width.constructor === Number ? "px" : "");
		if(options.height)
			root.style.height = options.height + (options.height.constructor === Number ? "px" : "");
		if(options.closable)
		{
			var close = document.createElement("span");
			close.innerHTML = "&#10005;";
			close.classList.add("close");
			close.addEventListener("click",function(){
				root.close();
			});
			root.header.appendChild(close);
		}
		root.title_element = root.querySelector(".dialog-title") as HTMLSpanElement;
		root.title_element.innerText = title;
		root.content = root.querySelector(".dialog-content") as HTMLDivElement;
        root.alt_content = root.querySelector(".dialog-alt-content") as HTMLDivElement;
		root.footer = root.querySelector(".dialog-footer") as HTMLDivElement;

		root.close = function()
		{
		    if (root.onClose && typeof root.onClose == "function"){
		        root.onClose();
		    }
            if(root.parentNode)
		        root.parentNode.removeChild(root);
		    /* XXX CHECK THIS */
		    if(this.parentNode){
		    	this.parentNode.removeChild(this);
		    }
		    /* XXX this was not working, was fixed with an IF, check this */
		}

        // function to swap panel content
        root.toggleAltContent = function(force: boolean = false){
            if (typeof force != "undefined"){
                var vTo = force ? "block" : "none";
                var vAlt = force ? "none" : "block";
            }else{
                var vTo = root.alt_content.style.display != "block" ? "block" : "none";
                var vAlt = root.alt_content.style.display != "block" ? "none" : "block";
            }
            root.alt_content.style.display = vTo;
            root.content.style.display = vAlt;
        }

        root.toggleFooterVisibility = function(force: boolean = false): void {
            if (typeof force != "undefined"){
                var vTo = force ? "block" : "none";
            }else{
                var vTo = root.footer.style.display != "block" ? "block" : "none";
            }
            root.footer.style.display = vTo;
        }

		root.clear = function(): void
		{
			this.content.innerHTML = "";
		}

		root.addHTML = function(code: string, classname?: string, on_footer?: boolean): HTMLDivElement
		{
			var elem = document.createElement("div");
			if(classname)
				elem.className = classname;
			elem.innerHTML = code;
			if(on_footer)
				root.footer.appendChild(elem);
			else
				root.content.appendChild(elem);
			return elem;
		}

		root.addButton = function( name: string, callback: EventListener, options?: any ): HTMLButtonElement
		{
			var elem = document.createElement("button") as HTMLButtonElement;
			elem.innerText = name;
			(elem as any).options = options;
			elem.classList.add("btn");
			elem.addEventListener("click",callback);
			root.footer.appendChild(elem);
			return elem;
		}

		root.addSeparator = function()
		{
			var elem = document.createElement("div");
			elem.className = "separator";
			root.content.appendChild(elem);
            return elem;
		}

		root.addWidget = function(type: string, name: string, value: any, options?: any, callback?: ContextMenuEventListener): IGraphWidgetUI
		{
			options = options || {};
			var str_value = String(value);
			type = type.toLowerCase();
			if(type == "number")
				str_value = value.toFixed(3);

			var elem = document.createElement("div") as IGraphWidgetUI;
			elem.className = "property";
			elem.innerHTML = "<span class='property_name'></span><span class='property_value'></span>";
            let propertyNameElem = elem.querySelector(".property_name") as HTMLSpanElement;
			propertyNameElem.innerText = options.label || name;
			var value_element = elem.querySelector(".property_value") as HTMLSpanElement;
			value_element.innerText = str_value;
			elem.dataset["property"] = name;
			elem.dataset["type"] = options.type || type;
			elem.options = options;
			elem.value = value;

			if( type == "code" )
				elem.addEventListener("click", function(e){ root.inner_showCodePad( this.dataset["property"] ); });
			else if (type == "boolean")
			{
				elem.classList.add("boolean");
				if(value)
					elem.classList.add("bool-on");
				elem.addEventListener("click", function(this: IGraphWidgetUI){
					//var v = node.properties[this.dataset["property"]];
					//node.setProperty(this.dataset["property"],!v); this.innerText = v ? "true" : "false";
					var propname = this.dataset["property"];
					this.value = !this.value;
					this.classList.toggle("bool-on");
                    const propertyValueElem = this.querySelector(".property_value") as HTMLSpanElement;
					propertyValueElem.innerText = this.value ? "true" : "false";
					innerChange(propname, this.value );
				});
			}
			else if (type == "string" || type == "number")
			{
				value_element.setAttribute("contenteditable","true");
				value_element.addEventListener("keydown", function(e){
					if(e.code == "Enter" && (type != "string" || !e.shiftKey)) // allow for multiline
					{
						e.preventDefault();
						this.blur();
					}
				});
				value_element.addEventListener("blur", function(){
					let v: any = this.innerText;
                    const parentNode = this.parentNode as HTMLElement;
					var propname = parentNode.dataset["property"];
					var proptype = parentNode.dataset["type"];
					if( proptype == "number")
						v = Number(v);
					innerChange(propname, v);
				});
			}
			else if (type == "enum" || type == "combo") {
				var str_value = LGraphCanvas.getPropertyPrintableValue( value, options.values );
				value_element.innerText = str_value;

                value_element.addEventListener("click", function(event: MouseEvent){
                    var values = options.values || [];
                    let parentNode = this.parentNode as HTMLElement;
                    var propname = parentNode.dataset["property"];
                    var elem_that = this;
                    var menu = new ContextMenu(values, {
                        event: event as MouseEventExt,
                        className: "dark",
                        callback: inner_clicked
                    }, ref_window);
                    function inner_clicked(v: ContextMenuItem, option: IContextMenuOptions, event: MouseEventExt) {
                        //node.setProperty(propname,v);
                        //graphcanvas.dirty_canvas = true;
                        elem_that.innerText = "" + v;
                        innerChange(propname, v);
                        return false;
                    }
                });
            }

			root.content.appendChild(elem);

			function innerChange(name: string, value: any)
			{
				//console.log("change",name,value);
				//that.dirty_canvas = true;
				if(options.callback)
					options.callback(name,value,options);
				if(callback)
					callback(name as any,value,options);
			}

			return elem;
		}

        if (root.onOpen && typeof root.onOpen == "function")
            root.onOpen();

		return root;
	};

    checkPanels(this: LGraphCanvas) {
        if(!this.canvas)
            return;

        var panels = this.canvas.parentNode.querySelectorAll(".litegraph.dialog");
        for(var i = 0; i < panels.length; ++i)
        {
            var panel = panels[i] as IGraphDialog;
            if( !panel.node )
                continue;
            if( !panel.node.graph || panel.graph != this.graph )
                panel.close();
        }
    }

    closePanels(){
        var panel = document.querySelector("#node-panel") as IGraphDialog;
		if(panel)
			panel.close();
        var panel = document.querySelector("#option-panel") as IGraphDialog;
		if(panel)
			panel.close();
    }
}

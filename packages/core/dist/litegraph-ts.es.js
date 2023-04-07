class ne {
  constructor(e, i, n, s, r, a) {
    this.data = null, this._pos = [0, 0], this._last_time = 0, this.id = e, this.type = i, this.origin_id = n, this.origin_slot = s, this.target_id = r, this.target_slot = a;
  }
  static configure(e) {
    return e instanceof Array ? new ne(e[0], e[5], e[1], e[2], e[3], e[4]) : new ne(e.id, e.type, e.origin_id, e.origin_slot, e.target_id, e.target_slot);
  }
  serialize() {
    return [
      this.id,
      this.origin_id,
      this.origin_slot,
      this.target_id,
      this.target_slot,
      this.type
    ];
  }
}
var k = /* @__PURE__ */ ((t) => (t[t.UP = 1] = "UP", t[t.DOWN = 2] = "DOWN", t[t.LEFT = 3] = "LEFT", t[t.RIGHT = 4] = "RIGHT", t[t.CENTER = 5] = "CENTER", t))(k || {}), j = /* @__PURE__ */ ((t) => (t[t.ALWAYS = 0] = "ALWAYS", t[t.ON_EVENT = 1] = "ON_EVENT", t[t.NEVER = 2] = "NEVER", t[t.ON_TRIGGER = 3] = "ON_TRIGGER", t[t.ON_REQUEST = 4] = "ON_REQUEST", t))(j || {});
const ie = ["Always", "On Event", "Never", "On Trigger"], ye = ["#666", "#422", "#333", "#224", "#626"];
var S = /* @__PURE__ */ ((t) => (t[t.DEFAULT = 0] = "DEFAULT", t[t.BOX_SHAPE = 1] = "BOX_SHAPE", t[t.ROUND_SHAPE = 2] = "ROUND_SHAPE", t[t.CIRCLE_SHAPE = 3] = "CIRCLE_SHAPE", t[t.CARD_SHAPE = 4] = "CARD_SHAPE", t[t.ARROW_SHAPE = 5] = "ARROW_SHAPE", t[t.GRID_SHAPE = 6] = "GRID_SHAPE", t))(S || {});
const be = ["default", "box", "round", "circle", "card", "arrow", "square"];
var W = /* @__PURE__ */ ((t) => (t[t.INPUT = 0] = "INPUT", t[t.OUTPUT = 1] = "OUTPUT", t))(W || {}), le = /* @__PURE__ */ ((t) => (t[t.STRAIGHT_LINK = 0] = "STRAIGHT_LINK", t[t.LINEAR_LINK = 1] = "LINEAR_LINK", t[t.SPLINE_LINK = 2] = "SPLINE_LINK", t))(le || {});
const we = ["Straight", "Linear", "Spline"];
var ee = /* @__PURE__ */ ((t) => (t[t.NORMAL_TITLE = 0] = "NORMAL_TITLE", t[t.NO_TITLE = 1] = "NO_TITLE", t[t.TRANSPARENT_TITLE = 2] = "TRANSPARENT_TITLE", t[t.AUTOHIDE_TITLE = 3] = "AUTOHIDE_TITLE", t))(ee || {}), A = /* @__PURE__ */ ((t) => (t[t.EVENT = -2] = "EVENT", t[t.ACTION = -1] = "ACTION", t[t.DEFAULT = 0] = "DEFAULT", t))(A || {}), se = /* @__PURE__ */ ((t) => (t.VERTICAL_LAYOUT = "vertical", t.HORIZONTAL_LAYOUT = "horizontal", t))(se || {});
function Te(t, e) {
  return e in t ? t[e] : null;
}
function de(t, e) {
  return e in t.constructor ? t.constructor[e] : null;
}
const ge = class {
  constructor(t) {
    this.desc = "", this.pos = [0, 0], this.subgraph = null, this.skip_subgraph_button = !1, this.priority = 0, this.removable = !0, this.clonable = !0, this.collapsable = !0, this.titleMode = ee.NORMAL_TITLE, this.serialize_widgets = !1, this.skip_list = !1, this.block_delete = !1, this.ignore_remove = !1, this.last_serialization = null, this._relative_id = null, this.exec_version = 0, this.action_call = null, this.execute_triggered = 0, this.action_triggered = 0, this.console = [], this.title = t || "Unnamed", this.size = [u.NODE_WIDTH, 60], this.graph = null, this.pos = [10, 10], this.id = -1, this.type = null, this.inputs = [], this.outputs = [], this.connections = [], this.properties = {}, this.properties_info = [], this.flags = {};
  }
  get slotLayout() {
    return "slotLayout" in this.constructor ? this.constructor.slotLayout : null;
  }
  /** configure a node from an object containing the serialized info */
  configure(t) {
    this.graph && this.graph._version++;
    for (var e in t) {
      if (e == "properties") {
        for (var i in t.properties)
          this.properties[i] = t.properties[i], this.onPropertyChanged && this.onPropertyChanged(i, t.properties[i]);
        continue;
      }
      t[e] != null && (typeof t[e] == "object" ? this[e] && this[e].configure ? this[e].configure(t[e]) : this[e] = u.cloneObject(t[e], this[e]) : this[e] = t[e]);
    }
    if (t.title || (this.title = de(this, "title") || this.title), this.inputs)
      for (let r = 0; r < this.inputs.length; ++r) {
        let a = this.inputs[r], l = this.graph ? this.graph.links[a.link] : null;
        this.onConnectionsChange && this.onConnectionsChange(W.INPUT, r, !0, l, a), this.onInputAdded && this.onInputAdded(a);
      }
    if (this.outputs)
      for (var n = 0; n < this.outputs.length; ++n) {
        let r = this.outputs[n];
        if (r.links) {
          for (let a = 0; a < r.links.length; ++a) {
            let l = this.graph ? this.graph.links[r.links[a]] : null;
            this.onConnectionsChange && this.onConnectionsChange(W.OUTPUT, n, !0, l, r);
          }
          this.onOutputAdded && this.onOutputAdded(r);
        }
      }
    if (this.widgets) {
      for (var n = 0; n < this.widgets.length; ++n) {
        var s = this.widgets[n];
        s && s.options && s.options.property && this.properties[s.options.property] && (s.value = JSON.parse(JSON.stringify(this.properties[s.options.property])));
      }
      if (t.widgets_values)
        for (var n = 0; n < t.widgets_values.length; ++n)
          this.widgets[n] && (this.widgets[n].value = t.widgets_values[n]);
    }
    this.onConfigure && this.onConfigure(t);
  }
  /** serialize the content */
  serialize() {
    let t = {
      id: this.id,
      type: this.type,
      pos: this.pos,
      size: this.size,
      flags: u.cloneObject(this.flags),
      order: this.order,
      mode: this.mode
    };
    if (this.constructor === ge && this.last_serialization)
      return this.last_serialization;
    if (this.inputs && (t.inputs = this.inputs), this.outputs) {
      for (var e = 0; e < this.outputs.length; e++)
        delete this.outputs[e]._data;
      t.outputs = this.outputs;
    }
    if (this.title && this.title != this.constructor.title && (t.title = this.title), this.properties && (t.properties = u.cloneObject(this.properties)), this.widgets && this.serialize_widgets) {
      t.widgets_values = [];
      for (var e = 0; e < this.widgets.length; ++e)
        this.widgets[e] ? t.widgets_values[e] = this.widgets[e].value : t.widgets_values[e] = null;
    }
    return t.type || (t.type = this.constructor.type), this.color && (t.color = this.color), this.bgColor && (t.bgcolor = this.bgColor), this.boxcolor && (t.boxcolor = this.boxcolor), this.shape && (t.shape = this.shape), this.onSerialize && this.onSerialize(t) && console.warn(
      "node onSerialize shouldnt return anything, data should be stored in the object pass in the first parameter"
    ), t;
  }
  /** Creates a clone of this node  */
  clone() {
    var t = u.createNode(this.type);
    if (!t)
      return null;
    var e = u.cloneObject(this.serialize());
    if (e.inputs)
      for (var i = 0; i < e.inputs.length; ++i)
        e.inputs[i].link = null;
    if (e.outputs)
      for (var i = 0; i < e.outputs.length; ++i)
        e.outputs[i].links && (e.outputs[i].links.length = 0);
    return delete e.id, t.configure(e), t;
  }
  /** serialize and stringify */
  toString() {
    return JSON.stringify(this.serialize());
  }
  /** get the title string */
  getTitle() {
    return this.title || this.constructor.title;
  }
  /** sets the value of a property */
  setProperty(t, e) {
    if (this.properties || (this.properties = {}), e !== this.properties[t]) {
      var i = this.properties[t];
      if (this.properties[t] = e, this.graph && this.graph._version++, this.onPropertyChanged && this.onPropertyChanged(t, e, i) === !1 && (this.properties[t] = i), this.widgets)
        for (var n = 0; n < this.widgets.length; ++n) {
          var s = this.widgets[n];
          if (s && s.options.property == t) {
            s.value = e;
            break;
          }
        }
    }
  }
  /** sets the output data */
  setOutputData(t, e) {
    if (this.outputs && !(t == -1 || t >= this.outputs.length)) {
      var i = this.outputs[t];
      if (i && (i._data = e, this.outputs[t].links))
        for (var n = 0; n < this.outputs[t].links.length; n++) {
          var s = this.outputs[t].links[n], r = this.graph.links[s];
          r && (r.data = e);
        }
    }
  }
  /** sets the output data */
  setOutputDataType(t, e) {
    if (this.outputs && !(t == -1 || t >= this.outputs.length)) {
      var i = this.outputs[t];
      if (i && (i.type = e, this.outputs[t].links))
        for (var n = 0; n < this.outputs[t].links.length; n++) {
          var s = this.outputs[t].links[n];
          this.graph.links[s].type = e;
        }
    }
  }
  /**
   * Retrieves the input data (data traveling through the connection) from one slot
   * @param slot
   * @param force_update if set to true it will force the connected node of this slot to output data into this link
   * @return data or if it is not connected returns undefined
   */
  getInputData(t, e) {
    if (this.inputs && !(t >= this.inputs.length || this.inputs[t].link == null)) {
      var i = this.inputs[t].link, n = this.graph.links[i];
      if (!n)
        return console.error(`No input node found in slot ${t}!`, this, this.inputs[t]), null;
      if (!e)
        return n.data;
      var s = this.graph.getNodeById(n.origin_id);
      return s && (s.updateOutputData ? s.updateOutputData(n.origin_slot) : s.onExecute && s.onExecute(null, {})), n.data;
    }
  }
  /**
   * Retrieves the input data type (in case this supports multiple input types)
   * @param slot
   * @return datatype in string format
   */
  getInputDataType(t) {
    if (!this.inputs || t >= this.inputs.length || this.inputs[t].link == null)
      return null;
    var e = this.inputs[t].link, i = this.graph.links[e];
    if (!i)
      return console.error(`No input node found in slot ${t}!`, this, this.inputs[t]), null;
    var n = this.graph.getNodeById(i.origin_id);
    if (!n)
      return i.type;
    var s = n.outputs[i.origin_slot];
    return s && s.type != -1 ? s.type : null;
  }
  /**
   * Retrieves the input data from one slot using its name instead of slot number
   * @param slot_name
   * @param force_update if set to true it will force the connected node of this slot to output data into this link
   * @return data or if it is not connected returns null
   */
  getInputDataByName(t, e) {
    var i = this.findInputSlotIndexByName(t);
    return i == -1 ? null : this.getInputData(i, e);
  }
  /** tells you if there is a connection in one input slot */
  isInputConnected(t) {
    return this.inputs ? t < this.inputs.length && this.inputs[t].link != null : !1;
  }
  /** tells you info about an input connection (which node, type, etc) */
  getInputInfo(t) {
    return this.inputs && t < this.inputs.length ? this.inputs[t] : null;
  }
  /**
   * Returns the link info in the connection of an input slot
   * @param {number} slot
   * @return {LLink} object or null
   */
  getInputLink(t) {
    if (!this.inputs)
      return null;
    if (t < this.inputs.length) {
      var e = this.inputs[t];
      return this.graph.links[e.link];
    }
    return null;
  }
  /** returns the node connected in the input slot */
  getInputNode(t) {
    if (!this.inputs)
      return null;
    if (t < this.inputs.length) {
      const i = this.inputs[t].link, n = this.graph.links[i];
      if (!n)
        return console.error(`No input node found in slot ${t}!`, this, this.inputs[t]), null;
      var e = this.graph.getNodeById(n.origin_id);
      if (e)
        return e;
    }
    return null;
  }
  /** returns the value of an input with this name, otherwise checks if there is a property with that name */
  getInputOrProperty(t) {
    if (!this.inputs || !this.inputs.length)
      return this.properties ? this.properties[t] : null;
    for (var e = 0, i = this.inputs.length; e < i; ++e) {
      var n = this.inputs[e];
      if (t == n.name && n.link != null) {
        var s = this.graph.links[n.link];
        if (s)
          return s.data;
      }
    }
    return this.properties[t];
  }
  /** tells you the last output data that went in that slot */
  getOutputData(t) {
    if (!this.outputs || t >= this.outputs.length)
      return null;
    var e = this.outputs[t];
    return e._data;
  }
  /**
   * Returns the link info in the connection of an output slot
   * @param {number} slot
   * @return {LLink} object or null
   */
  getOutputLinks(t) {
    if (!this.outputs)
      return null;
    if (t >= 0 && t < this.outputs.length) {
      var e = this.outputs[t], i = [];
      for (const n in e.links)
        i.push(this.graph.links[n]);
      return i;
    }
    return null;
  }
  /** tells you info about an output connection (which node, type, etc) */
  getOutputInfo(t) {
    return this.outputs && t < this.outputs.length ? this.outputs[t] : null;
  }
  /** tells you if there is a connection in one output slot */
  isOutputConnected(t) {
    return this.outputs ? t < this.outputs.length && this.outputs[t].links && this.outputs[t].links.length > 0 : !1;
  }
  /** tells you if there is any connection in the output slots */
  isAnyOutputConnected() {
    if (!this.outputs)
      return !1;
    for (var t = 0; t < this.outputs.length; ++t)
      if (this.outputs[t].links && this.outputs[t].links.length)
        return !0;
    return !1;
  }
  /** retrieves all the nodes connected to this output slot */
  getOutputNodes(t) {
    if (!this.outputs || this.outputs.length == 0 || t >= this.outputs.length)
      return null;
    var e = this.outputs[t];
    if (!e.links || e.links.length == 0)
      return null;
    for (var i = [], n = 0; n < e.links.length; n++) {
      var s = e.links[n], r = this.graph.links[s];
      if (r) {
        var a = this.graph.getNodeById(r.target_id);
        a && i.push(a);
      }
    }
    return i;
  }
  addOnTriggerInput() {
    var t = this.findInputSlotIndexByName("onTrigger");
    if (t == -1) {
      //!trigS ||
      return this.addInput("onTrigger", A.EVENT, { optional: !0, nameLocked: !0 }), this.findInputSlotIndexByName("onTrigger");
    }
    return t;
  }
  addOnExecutedOutput() {
    var t = this.findOutputSlotIndexByName("onExecuted");
    if (t == -1) {
      //!trigS ||
      return this.addOutput("onExecuted", A.ACTION, { optional: !0, nameLocked: !0 }), this.findOutputSlotIndexByName("onExecuted");
    }
    return t;
  }
  onAfterExecuteNode(t, e) {
    var i = this.findOutputSlotIndexByName("onExecuted");
    i != -1 && this.triggerSlot(i, t, null, e);
  }
  changeMode(t) {
    switch (t) {
      case j.ON_EVENT:
        break;
      case j.ON_TRIGGER:
        this.addOnTriggerInput(), this.addOnExecutedOutput();
        break;
      case j.NEVER:
        break;
      case j.ALWAYS:
        break;
      case j.ON_REQUEST:
        break;
      default:
        return !1;
    }
    return this.mode = t, !0;
  }
  doExecute(t, e = {}) {
    this.onExecute && (e.action_call || (e.action_call = this.id + "_exec_" + Math.floor(Math.random() * 9999)), this.graph.nodes_executing[this.id] = !0, this.onExecute(t, e), this.graph.nodes_executing[this.id] = !1, this.exec_version = this.graph.iteration, e && e.action_call && (this.action_call = e.action_call, this.graph.nodes_executedAction[this.id] = e.action_call)), this.execute_triggered = 2, this.onAfterExecuteNode && this.onAfterExecuteNode(t, e);
  }
  /**
   * Triggers an action, wrapped by logics to control execution flow
   * @method actionDo
   * @param {String} action name
   * @param {*} param
   */
  actionDo(t, e, i = {}) {
    this.onAction && (i.action_call || (i.action_call = this.id + "_" + (t || "action") + "_" + Math.floor(Math.random() * 9999)), this.graph.nodes_actioning[this.id] = t || "actioning", this.onAction(t, e, i), this.graph.nodes_actioning[this.id] = !1, i && i.action_call && (this.action_call = i.action_call, this.graph.nodes_executedAction[this.id] = i.action_call)), this.action_triggered = 2, this.onAfterExecuteNode && this.onAfterExecuteNode(e, i);
  }
  /**  Triggers an event in this node, this will trigger any output with the same name */
  trigger(t, e, i) {
    if (!(!this.outputs || !this.outputs.length)) {
      this.graph && (this.graph._last_trigger_time = u.getTime());
      for (var n = 0; n < this.outputs.length; ++n) {
        var s = this.outputs[n];
        !s || s.type !== A.EVENT || t && s.name != t || this.triggerSlot(n, e, null, i);
      }
    }
  }
  /**
   * Triggers an slot event in this node
   * @param slot the index of the output slot
   * @param param
   * @param link_id in case you want to trigger and specific output link in a slot
   */
  triggerSlot(t, e, i, n = {}) {
    if (this.outputs) {
      if (t == null) {
        console.error("slot must be a number");
        return;
      }
      typeof t != "number" && console.warn("slot must be a number, use node.trigger('name') if you want to use a string");
      var s = this.outputs[t];
      if (s) {
        var r = s.links;
        if (!(!r || !r.length)) {
          this.graph && (this.graph._last_trigger_time = u.getTime());
          for (var a = 0; a < r.length; ++a) {
            var l = r[a];
            if (!(i != null && i != l)) {
              var o = this.graph.links[r[a]];
              if (o) {
                o._last_time = u.getTime();
                var h = this.graph.getNodeById(o.target_id);
                if (h) {
                  var p = h.inputs[o.target_slot];
                  if (h.mode === j.ON_TRIGGER)
                    n.action_call || (n.action_call = this.id + "_trigg_" + Math.floor(Math.random() * 9999)), h.onExecute && h.doExecute(e, n);
                  else if (h.onAction) {
                    n.action_call || (n.action_call = this.id + "_act_" + Math.floor(Math.random() * 9999));
                    var p = h.inputs[o.target_slot];
                    h.actionDo(p.name, e, n);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  /**
   * clears the trigger slot animation
   * @param slot the index of the output slot
   * @param link_id in case you want to trigger and specific output link in a slot
   */
  clearTriggeredSlot(t, e) {
    if (this.outputs) {
      var i = this.outputs[t];
      if (i) {
        var n = i.links;
        if (!(!n || !n.length))
          for (var s = 0; s < n.length; ++s) {
            var r = n[s];
            if (!(e != null && e != r)) {
              var a = this.graph.links[n[s]];
              a && (a._last_time = 0);
            }
          }
      }
    }
  }
  /**
   * changes node size and triggers callback
   * @method setSize
   * @param {vec2} size
   */
  setSize(t) {
    this.size = t, this.onResize && this.onResize(this.size);
  }
  /**
   * add a new property to this node
   * @param name
   * @param default_value
   * @param type string defining the output type ("vec3","number",...)
   * @param extra_info this can be used to have special properties of the property (like values, etc)
   */
  addProperty(t, e, i, n) {
    var s = { name: t, type: i, default_value: e };
    if (n)
      for (var r in n)
        s[r] = n[r];
    return this.properties_info || (this.properties_info = []), this.properties_info.push(s), this.properties || (this.properties = {}), this.properties[t] = e, s;
  }
  /**
   * add a new output slot to use in this node
   * @param name
   * @param type string defining the output type ("vec3","number",...)
   * @param extra_info this can be used to have special properties of an output (label, special color, position, etc)
   */
  addOutput(t, e = A.DEFAULT, i) {
    var n = { name: t, type: e, links: null };
    if (i)
      for (var s in i)
        n[s] = i[s];
    return e == "array" && (n.shape == null || n.shape == S.DEFAULT) && (n.shape = S.GRID_SHAPE), this.outputs || (this.outputs = []), this.outputs.push(n), this.onOutputAdded && this.onOutputAdded(n), u.auto_load_slot_types && u.registerNodeAndSlotType(this, e, !0), this.setSize(this.computeSize()), this.setDirtyCanvas(!0, !0), n;
  }
  /** remove an existing output slot */
  removeOutput(t) {
    const e = this.outputs[t];
    this.disconnectOutput(t), this.outputs.splice(t, 1);
    for (var i = t; i < this.outputs.length; ++i)
      if (!(!this.outputs[i] || !this.outputs[i].links))
        for (var n = this.outputs[i].links, s = 0; s < n.length; ++s) {
          var r = this.graph.links[n[s]];
          r && (r.origin_slot -= 1);
        }
    this.setSize(this.computeSize()), this.onOutputRemoved && this.onOutputRemoved(t, e), this.setDirtyCanvas(!0, !0);
  }
  /**
   * add a new input slot to use in this node
   * @param name
   * @param type string defining the input type ("vec3","number",...), it its a generic one use 0
   * @param extra_info this can be used to have special properties of an input (label, color, position, etc)
   */
  addInput(t, e = A.DEFAULT, i) {
    var n = { name: t, type: e, link: null };
    if (i)
      for (var s in i)
        n[s] = i[s];
    return e == "array" && (n.shape == null || n.shape == S.DEFAULT) && (n.shape = S.GRID_SHAPE), this.inputs || (this.inputs = []), this.inputs.push(n), this.setSize(this.computeSize()), this.onInputAdded && this.onInputAdded(n), u.registerNodeAndSlotType(this, e), this.setDirtyCanvas(!0, !0), n;
  }
  /** remove an existing input slot */
  removeInput(t) {
    this.disconnectInput(t);
    for (var e = this.inputs.splice(t, 1), i = t; i < this.inputs.length; ++i)
      if (this.inputs[i]) {
        var n = this.graph.links[this.inputs[i].link];
        n && (n.target_slot -= 1);
      }
    this.setSize(this.computeSize()), this.onInputRemoved && this.onInputRemoved(t, e[0]), this.setDirtyCanvas(!0, !0);
  }
  /**
   * add an special connection to this node (used for special kinds of graphs)
   * @param name
   * @param type string defining the input type ("vec3","number",...)
   * @param pos position of the connection inside the node
   * @param direction if is input or output
   */
  addConnection(t, e, i, n) {
    let s = {
      name: t,
      type: e,
      pos: i,
      direction: n,
      links: null
    };
    return this.connections.push(s), s;
  }
  /** computes the size of a node according to its inputs and output slots */
  computeSize(t = [0, 0]) {
    const e = de(this, "overrideSize");
    if (e)
      return e.concat();
    var i = Math.max(
      this.inputs ? this.inputs.length : 1,
      this.outputs ? this.outputs.length : 1
    ), n = t;
    i = Math.max(i, 1);
    var s = u.NODE_TEXT_SIZE, r = g(this.title), a = 0, l = 0;
    if (this.inputs)
      for (var o = 0, h = this.inputs.length; o < h; ++o) {
        var p = this.inputs[o], d = p.label || p.name || "", c = g(d);
        a < c && (a = c);
      }
    if (this.outputs)
      for (var o = 0, h = this.outputs.length; o < h; ++o) {
        var _ = this.outputs[o], d = _.label || _.name || "", c = g(d);
        l < c && (l = c);
      }
    n[0] = Math.max(a + l + 10, r), n[0] = Math.max(n[0], u.NODE_WIDTH), this.widgets && this.widgets.length && (n[0] = Math.max(n[0], u.NODE_WIDTH * 1.5)), n[1] = (this.constructor.slot_start_y || 0) + i * u.NODE_SLOT_HEIGHT;
    var f = 0;
    if (this.widgets && this.widgets.length) {
      for (var o = 0, h = this.widgets.length; o < h; ++o)
        this.widgets[o].computeSize ? f += this.widgets[o].computeSize(n[0])[1] + 4 : f += u.NODE_WIDGET_HEIGHT + 4;
      f += 8;
    }
    this.widgets_up ? n[1] = Math.max(n[1], f) : this.widgets_start_y != null ? n[1] = Math.max(n[1], f + this.widgets_start_y) : n[1] += f;
    function g(m) {
      return m ? s * m.length * 0.6 : 0;
    }
    return this.constructor.min_height && n[1] < this.constructor.min_height && (n[1] = this.constructor.min_height), n[1] += 6, n;
  }
  /**
   * returns all the info available about a property of this node.
   *
   * @method getPropertyInfo
   * @param {String} property name of the property
   * @return {Object} the object with all the available info
  */
  getPropertyInfo(t) {
    var e = null;
    if (this.properties_info) {
      for (var i = 0; i < this.properties_info.length; ++i)
        if (this.properties_info[i].name == t) {
          e = this.properties_info[i];
          break;
        }
    }
    return this.constructor["@" + t] && (e = this.constructor["@" + t]), this.constructor.widgets_info && this.constructor.widgets_info[t] && (e = this.constructor.widgets_info[t]), !e && this.onGetPropertyInfo && (e = this.onGetPropertyInfo(t)), e || (e = {}), e.type || (e.type = typeof this.properties[t]), e.widget == "combo" && (e.type = "enum"), e;
  }
  /**
   * https://github.com/jagenjo/litegraph.js/blob/master/guides/README.md#node-widgets
   * @return created widget
   */
  addWidget(t, e, i, n, s) {
    this.widgets || (this.widgets = []), !s && n && n.constructor === Object && (s = n, n = null), s && s.constructor === String && (s = { property: s }), n && n.constructor === String && (s || (s = {}), s.property = n, n = null), n && n.constructor !== Function && (console.warn("addWidget: callback must be a function"), n = null);
    var r = {
      type: t.toLowerCase(),
      name: e,
      value: i,
      callback: n,
      options: s || {}
    };
    if (r.options.y !== void 0 && (r.y = r.options.y), !n && !r.options.callback && !r.options.property && console.warn("LiteGraph addWidget(...) without a callback or property assigned"), t == "combo" && !r.options.values)
      throw "LiteGraph addWidget('combo',...) requires to pass values in options: { values:['red','blue'] }";
    return this.widgets.push(r), this.setSize(this.computeSize()), r;
  }
  addCustomWidget(t) {
    return this.widgets || (this.widgets = []), this.widgets.push(t), t;
  }
  /**
   * returns the bounding of the object, used for rendering purposes
   * @return [x, y, width, height]
   */
  getBounding(t) {
    return t = t || new Float32Array(4), t[0] = this.pos[0] - 4, t[1] = this.pos[1] - u.NODE_TITLE_HEIGHT, t[2] = this.size[0] + 4, t[3] = this.flags.collapsed ? u.NODE_TITLE_HEIGHT : this.size[1] + u.NODE_TITLE_HEIGHT, this.onBounding && this.onBounding(t), t;
  }
  /** checks if a point is inside the shape of a node */
  isPointInside(t, e, i = 0, n = !1) {
    var s = this.graph && this.graph.isLive() ? 0 : u.NODE_TITLE_HEIGHT;
    if (n && (s = 0), this.flags && this.flags.collapsed) {
      if (u.isInsideRectangle(
        t,
        e,
        this.pos[0] - i,
        this.pos[1] - u.NODE_TITLE_HEIGHT - i,
        (this._collapsed_width || u.NODE_COLLAPSED_WIDTH) + 2 * i,
        u.NODE_TITLE_HEIGHT + 2 * i
      ))
        return !0;
    } else if (this.pos[0] - 4 - i < t && this.pos[0] + this.size[0] + 4 + i > t && this.pos[1] - s - i < e && this.pos[1] + this.size[1] + i > e)
      return !0;
    return !1;
  }
  /** checks if a point is inside a node slot, and returns info about which slot */
  getSlotInPosition(t, e) {
    var i = [0, 0];
    if (this.inputs)
      for (var n = 0, s = this.inputs.length; n < s; ++n) {
        var r = this.inputs[n];
        if (this.getConnectionPos(!0, n, i), u.isInsideRectangle(
          t,
          e,
          i[0] - 10,
          i[1] - 5,
          20,
          10
        ))
          return { input: r, slot: n, link_pos: i };
      }
    if (this.outputs)
      for (var n = 0, s = this.outputs.length; n < s; ++n) {
        var a = this.outputs[n];
        if (this.getConnectionPos(!1, n, i), u.isInsideRectangle(
          t,
          e,
          i[0] - 10,
          i[1] - 5,
          20,
          10
        ))
          return { output: a, slot: n, link_pos: i };
      }
    return null;
  }
  /**
   * returns the input slot with a given name (used for dynamic slots), -1 if not found
   * @param name the name of the slot
   * @return the slot (-1 if not found)
   */
  findInputSlotIndexByName(t, e = !1, i) {
    if (!this.inputs)
      return -1;
    for (var n = 0, s = this.inputs.length; n < s; ++n)
      if (!(e && this.inputs[n].link && this.inputs[n].link != null) && !(i && i.includes(this.inputs[n].type)) && (!t || t == this.inputs[n].name))
        return n;
    return -1;
  }
  findInputSlotByName(t, e = !1, i) {
    if (!this.inputs)
      return null;
    for (var n = 0, s = this.inputs.length; n < s; ++n)
      if (!(e && this.inputs[n].link && this.inputs[n].link != null) && !(i && i.includes(this.inputs[n].type)) && (!t || t == this.inputs[n].name))
        return this.inputs[n];
    return null;
  }
  /**
   * returns the output slot with a given name (used for dynamic slots), -1 if not found
   * @param name the name of the slot
   * @return  the slot (-1 if not found)
   */
  findOutputSlotIndexByName(t, e = !1, i) {
    if (!this.outputs)
      return -1;
    for (var n = 0, s = this.outputs.length; n < s; ++n)
      if (!(e && this.outputs[n].links && this.outputs[n].links != null) && !(i && i.includes(this.outputs[n].type)) && (!t || t == this.outputs[n].name))
        return n;
    return -1;
  }
  findOutputSlotByName(t, e = !1, i) {
    if (!this.outputs)
      return null;
    for (var n = 0, s = this.outputs.length; n < s; ++n)
      if (!(e && this.outputs[n].links && this.outputs[n].links != null) && !(i && i.includes(this.outputs[n].type)) && (!t || t == this.outputs[n].name))
        return this.outputs[n];
    return null;
  }
  /**
   * findSlotByType for INPUTS
   */
  findInputSlotIndexByType(t, e = !1, i = !1) {
    return this.findSlotByType(!0, t, !1, e, i);
  }
  /**
   * findSlotByType for OUTPUTS
   */
  findOutputSlotIndexByType(t, e = !1, i = !1) {
    return this.findSlotByType(!1, t, !1, e, i);
  }
  /**
   * findSlotByType for INPUTS
   */
  findInputSlotByType(t, e = !1, i = !1) {
    return this.findSlotByType(!0, t, !1, e, i);
  }
  /**
   * findSlotByType for OUTPUTS
   */
  findOutputSlotByType(t, e = !1, i = !1) {
    return this.findSlotByType(!1, t, !1, e, i);
  }
  /**
   * returns the output (or input) slot with a given type, -1 if not found
   * @method findSlotByType
   * @param {boolean} input uise inputs instead of outputs
   * @param {string} type the type of the slot
   * @param {boolean} preferFreeSlot if we want a free slot (if not found, will return the first of the type anyway)
   * @return {number_or_object} the slot (-1 if not found)
   */
  findSlotByType(t, e, i, n = !1, s = !1) {
    n = n || !1, s = s || !1;
    var r = t ? this.inputs : this.outputs;
    if (!r)
      return i ? null : -1;
    (e == "" || e == "*") && (e = 0);
    for (var a = 0, l = r.length; a < l; ++a) {
      var o = (e + "").toLowerCase().split(","), h = r[a].type == "0" || r[a].type == "*" ? "0" : r[a].type;
      let p = (h + "").toLowerCase().split(",");
      for (let d = 0; d < o.length; d++)
        for (let c = 0; c < p.length; c++)
          if (o[d] == "_event_" && (o[d] = A.EVENT), p[d] == "_event_" && (p[d] = A.EVENT), o[d] == "*" && (o[d] = A.DEFAULT), p[d] == "*" && (p[d] = A.DEFAULT), o[d] == p[c]) {
            let _ = r[a];
            if (n && _.links && _.links !== null || _.link && _.link !== null)
              continue;
            return i ? _ : a;
          }
    }
    if (n && !s)
      for (var a = 0, l = r.length; a < l; ++a) {
        var o = (e + "").toLowerCase().split(","), h = r[a].type == "0" || r[a].type == "*" ? "0" : r[a].type;
        let f = (h + "").toLowerCase().split(",");
        for (let g = 0; g < o.length; g++)
          for (let m = 0; m < f.length; m++)
            if (o[g] == "*" && (o[g] = A.DEFAULT), f[g] == "*" && (f[g] = A.DEFAULT), o[g] == f[m])
              return i ? r[a] : a;
      }
    return i ? null : -1;
  }
  /**
   * connect this node output to the input of another node BY TYPE
   * @method connectByType
   * @param {number_or_string} slot (could be the number of the slot or the string with the name of the slot)
   * @param {LGraphNode} node the target node
   * @param {string} target_type the input slot type of the target node
   * @return {Object} the link_info is created, otherwise null
   */
  connectByTypeInput(t, e, i, n = {}) {
    var s = {
      createEventInCase: !0,
      firstFreeIfOutputGeneralInCase: !0,
      generalTypeInCase: !0
    }, r = Object.assign(s, n);
    e && e.constructor === Number && (e = this.graph.getNodeById(e));
    let a = e.findInputSlotIndexByType(i, !0);
    if (a >= 0 && a !== null)
      return u.debug && console.debug("CONNbyTYPE type " + i + " for " + a), this.connect(t, e, a);
    if (u.debug && console.log("type " + i + " not found or not free?"), r.createEventInCase && i == A.EVENT)
      return u.debug && console.debug("connect WILL CREATE THE onTrigger " + i + " to " + e), this.connect(t, e, -1);
    if (r.generalTypeInCase) {
      let l = e.findInputSlotIndexByType(A.DEFAULT, !0, !0);
      if (u.debug && console.debug("connect TO a general type (*, 0), if not found the specific type ", i, " to ", e, "RES_SLOT:", l), l >= 0)
        return this.connect(t, e, l);
    }
    if (r.firstFreeIfOutputGeneralInCase && (i == 0 || i == "*" || i == "")) {
      let l = e.findInputSlotIndexByName(null, !0, [A.EVENT]);
      if (u.debug && console.debug("connect TO TheFirstFREE ", i, " to ", e, "RES_SLOT:", l), l >= 0)
        return this.connect(t, e, l);
    }
    return u.debug && console.error("no way to connect type: ", i, " to targetNODE ", e), null;
  }
  /**
   * connect this node input to the output of another node BY TYPE
   * @method connectByType
   * @param {number_or_string} slot (could be the number of the slot or the string with the name of the slot)
   * @param {LGraphNode} node the target node
   * @param {string} target_type the output slot type of the target node
   * @return {Object} the link_info is created, otherwise null
   */
  connectByTypeOutput(t, e, i, n = {}) {
    var s = {
      createEventInCase: !0,
      firstFreeIfInputGeneralInCase: !0,
      generalTypeInCase: !0
    }, r = Object.assign(s, n);
    if (e && e.constructor === Number && (e = this.graph.getNodeById(e)), a = e.findOutputSlotIndexByType(i, !0), a >= 0 && a !== null)
      return console.debug("CONNbyTYPE OUT! type " + i + " for " + a), e.connect(a, this, t);
    if (r.generalTypeInCase) {
      var a = e.findOutputSlotIndexByType(0, !0, !0);
      if (a >= 0)
        return e.connect(a, this, t);
    }
    if (r.createEventInCase && i == A.EVENT && u.do_add_triggers_slots) {
      var a = e.addOnExecutedOutput();
      return e.connect(a, this, t);
    }
    if (r.firstFreeIfInputGeneralInCase && (i == 0 || i == "*" || i == "")) {
      let l = e.findOutputSlotIndexByName(null, !0, [A.EVENT]);
      if (l >= 0)
        return e.connect(l, this, t);
    }
    return console.error("no way to connect byOUT type: ", i, " to sourceNODE ", e), console.error("type OUT! " + i + " not found or not free?"), null;
  }
  /**
   * connect this node output to the input of another node
   * @param slot (could be the number of the slot or the string with the name of the slot)
   * @param  targetNode the target node
   * @param  targetSlot the input slot of the target node (could be the number of the slot or the string with the name of the slot, or -1 to connect a trigger)
   * @return {Object} the linkInfo is created, otherwise null
   */
  connect(t, e, i) {
    if (i = i || 0, !this.graph)
      return console.log(
        "Connect: Error, node doesn't belong to any graph. Nodes must be added first to a graph before connecting them."
      ), null;
    if (typeof t == "string") {
      if (t = this.findOutputSlotIndexByName(t), t == -1)
        return u.debug && console.log("Connect: Error, no slot of name " + t), null;
    } else if (!this.outputs || t >= this.outputs.length)
      return u.debug && console.log("Connect: Error, slot number not found"), null;
    if (e && e.constructor === Number && (e = this.graph.getNodeById(e)), !e)
      throw "target node is null";
    if (e == this)
      return null;
    if (typeof i == "string") {
      if (i = e.findInputSlotIndexByName(i), i == -1)
        return u.debug && console.log(
          "Connect: Error, no slot of name " + i
        ), null;
    } else if (i === A.EVENT)
      if (u.do_add_triggers_slots)
        e.changeMode(j.ON_TRIGGER), i = e.findInputSlotIndexByName("onTrigger");
      else
        return null;
    else if (!e.inputs || i >= e.inputs.length)
      return u.debug && console.log("Connect: Error, slot number not found"), null;
    var n = !1, s = e.inputs[i], r = null, a = this.outputs[t];
    if (!this.outputs[t])
      return null;
    if (e.onBeforeConnectInput && (i = e.onBeforeConnectInput(i)), i === -1 || i === null || !u.isValidConnection(a.type, s.type))
      return this.setDirtyCanvas(!1, !0), n && this.graph.connectionChange(this, r), null;
    if (u.debug && console.debug("valid connection", a.type, s.type), e.onConnectInput && e.onConnectInput(i, a.type, a, this, t) === !1 || this.onConnectOutput && this.onConnectOutput(t, s.type, s, e, i) === !1)
      return null;
    if (e.inputs[i] && e.inputs[i].link != null && (this.graph.beforeChange(), e.disconnectInput(i, { doProcessChange: !1 }), n = !0), a.links !== null && a.links.length)
      switch (a.type) {
        case A.EVENT:
          u.allow_multi_output_for_events || (this.graph.beforeChange(), this.disconnectOutput(t, null, { doProcessChange: !1 }), n = !0);
          break;
      }
    return r = new ne(
      ++this.graph.last_link_id,
      s.type || a.type,
      this.id,
      t,
      e.id,
      i
    ), this.graph.links[r.id] = r, a.links == null && (a.links = []), a.links.push(r.id), e.inputs[i].link = r.id, this.graph && this.graph._version++, this.onConnectionsChange && this.onConnectionsChange(
      W.OUTPUT,
      t,
      !0,
      r,
      a
    ), e.onConnectionsChange && e.onConnectionsChange(
      W.INPUT,
      i,
      !0,
      r,
      s
    ), this.graph && this.graph.onNodeConnectionChange && (this.graph.onNodeConnectionChange(
      W.INPUT,
      e,
      i,
      this,
      t
    ), this.graph.onNodeConnectionChange(
      W.OUTPUT,
      this,
      t,
      e,
      i
    )), this.setDirtyCanvas(!1, !0), this.graph.afterChange(), this.graph.connectionChange(this, r), r;
  }
  /**
   * disconnect one output to an specific node
   * @param slot (could be the number of the slot or the string with the name of the slot)
   * @param targetNode the target node to which this slot is connected [Optional, if not targetNode is specified all nodes will be disconnected]
   * @return if it was disconnected successfully
   */
  disconnectOutput(t, e, i) {
    if (typeof t == "string") {
      if (t = this.findOutputSlotIndexByName(t), t == -1)
        return u.debug && console.log("Connect: Error, no slot of name " + t), !1;
    } else if (!this.outputs || t >= this.outputs.length)
      return u.debug && console.log("Connect: Error, slot number not found"), !1;
    var n = this.outputs[t];
    if (!n || !n.links || n.links.length == 0)
      return !1;
    if (e) {
      if (e.constructor === Number && (e = this.graph.getNodeById(e)), !e)
        throw "Target Node not found";
      for (var s = 0, r = n.links.length; s < r; s++) {
        var a = n.links[s], l = this.graph.links[a];
        if (l.target_id == e.id) {
          n.links.splice(s, 1);
          var o = e.inputs[l.target_slot];
          o.link = null, delete this.graph.links[a], this.graph && this.graph._version++, e.onConnectionsChange && e.onConnectionsChange(
            W.INPUT,
            l.target_slot,
            !1,
            l,
            o
          ), this.onConnectionsChange && this.onConnectionsChange(
            W.OUTPUT,
            t,
            !1,
            l,
            n
          ), this.graph && this.graph.onNodeConnectionChange && this.graph.onNodeConnectionChange(
            W.OUTPUT,
            this,
            t
          ), this.graph && this.graph.onNodeConnectionChange && (this.graph.onNodeConnectionChange(
            W.OUTPUT,
            this,
            t
          ), this.graph.onNodeConnectionChange(
            W.INPUT,
            e,
            l.target_slot
          ));
          break;
        }
      }
    } else {
      for (var s = 0, r = n.links.length; s < r; s++) {
        var a = n.links[s], l = this.graph.links[a];
        if (l) {
          var e = this.graph.getNodeById(l.target_id), o = null;
          this.graph && this.graph._version++, e && (o = e.inputs[l.target_slot], o.link = null, e.onConnectionsChange && e.onConnectionsChange(
            W.INPUT,
            l.target_slot,
            !1,
            l,
            o
          ), this.graph && this.graph.onNodeConnectionChange && this.graph.onNodeConnectionChange(
            W.INPUT,
            e,
            l.target_slot
          )), delete this.graph.links[a], this.onConnectionsChange && this.onConnectionsChange(
            W.OUTPUT,
            t,
            !1,
            l,
            n
          ), this.graph && this.graph.onNodeConnectionChange && (this.graph.onNodeConnectionChange(
            W.OUTPUT,
            this,
            t
          ), this.graph.onNodeConnectionChange(
            W.INPUT,
            e,
            l.target_slot
          ));
        }
      }
      n.links = null;
    }
    return this.setDirtyCanvas(!1, !0), this.graph.connectionChange(this), !0;
  }
  /**
   * disconnect one input
   * @param slot (could be the number of the slot or the string with the name of the slot)
   * @return if it was disconnected successfully
   */
  disconnectInput(t, e = {}) {
    if (typeof t == "string") {
      if (t = this.findInputSlotIndexByName(t), t == -1)
        return u.debug && console.log("Connect: Error, no slot of name " + t), !1;
    } else if (!this.inputs || t >= this.inputs.length)
      return u.debug && console.log("Connect: Error, slot number not found"), !1;
    var i = this.inputs[t];
    if (!i)
      return !1;
    var n = this.inputs[t].link;
    if (n != null) {
      this.inputs[t].link = null;
      var s = this.graph.links[n];
      if (s) {
        var r = this.graph.getNodeById(s.origin_id);
        if (!r)
          return !1;
        var a = r.outputs[s.origin_slot];
        if (!a || !a.links || a.links.length == 0)
          return !1;
        for (var l = 0, o = a.links.length; l < o; l++)
          if (a.links[l] == n) {
            a.links.splice(l, 1);
            break;
          }
        delete this.graph.links[n], this.graph && this.graph._version++, this.onConnectionsChange && this.onConnectionsChange(
          W.INPUT,
          t,
          !1,
          s,
          i
        ), r.onConnectionsChange && r.onConnectionsChange(
          W.OUTPUT,
          l,
          !1,
          s,
          a
        ), this.graph && this.graph.onNodeConnectionChange && (this.graph.onNodeConnectionChange(
          W.OUTPUT,
          r,
          l
        ), this.graph.onNodeConnectionChange(W.INPUT, this, t));
      }
    }
    return this.setDirtyCanvas(!1, !0), this.graph && this.graph.connectionChange(this), !0;
  }
  /**
   * returns the center of a connection point in canvas coords
   * @param is_input true if if a input slot, false if it is an output
   * @param slot (could be the number of the slot or the string with the name of the slot)
   * @param out a place to store the output, to free garbage
   * @return the position
   **/
  getConnectionPos(t, e, i = [0, 0]) {
    var n = 0;
    t && this.inputs && (n = this.inputs.length), !t && this.outputs && (n = this.outputs.length);
    var s = u.NODE_SLOT_HEIGHT * 0.5;
    if (this.flags.collapsed) {
      var r = this._collapsed_width || u.NODE_COLLAPSED_WIDTH;
      return this.horizontal ? (i[0] = this.pos[0] + r * 0.5, t ? i[1] = this.pos[1] - u.NODE_TITLE_HEIGHT : i[1] = this.pos[1]) : (t ? i[0] = this.pos[0] : i[0] = this.pos[0] + r, i[1] = this.pos[1] - u.NODE_TITLE_HEIGHT * 0.5), i;
    }
    return t && e == -1 ? (i[0] = this.pos[0] + u.NODE_TITLE_HEIGHT * 0.5, i[1] = this.pos[1] + u.NODE_TITLE_HEIGHT * 0.5, i) : t && n > e && this.inputs[e].pos ? (i[0] = this.pos[0] + this.inputs[e].pos[0], i[1] = this.pos[1] + this.inputs[e].pos[1], i) : !t && n > e && this.outputs[e].pos ? (i[0] = this.pos[0] + this.outputs[e].pos[0], i[1] = this.pos[1] + this.outputs[e].pos[1], i) : this.horizontal ? (i[0] = this.pos[0] + (e + 0.5) * (this.size[0] / n), t ? i[1] = this.pos[1] - u.NODE_TITLE_HEIGHT : i[1] = this.pos[1] + this.size[1], i) : (t ? i[0] = this.pos[0] + s : i[0] = this.pos[0] + this.size[0] + 1 - s, i[1] = this.pos[1] + (e + 0.7) * u.NODE_SLOT_HEIGHT + (this.constructor.slot_start_y || 0), i);
  }
  /** Force align to grid */
  alignToGrid() {
    this.pos[0] = u.CANVAS_GRID_SIZE * Math.round(this.pos[0] / u.CANVAS_GRID_SIZE), this.pos[1] = u.CANVAS_GRID_SIZE * Math.round(this.pos[1] / u.CANVAS_GRID_SIZE);
  }
  /** Console output */
  trace(t) {
    this.console || (this.console = []), this.console.push(t), this.console.length > ge.MAX_CONSOLE && this.console.shift(), this.graph.onNodeTrace && this.graph.onNodeTrace(this, t);
  }
  /** Forces to redraw or the main canvas (LGraphNode) or the bg canvas (links) */
  setDirtyCanvas(t, e = !1) {
    this.graph && this.graph.sendActionToCanvas("setDirty", [t, e]);
  }
  loadImage(t) {
    var e = new Image();
    e.src = u.node_images_path + t;
    var i = this;
    return e.onload = function() {
      i.setDirtyCanvas(!0);
    }, e;
  }
  /** Allows to get onMouseMove and onMouseUp events even if the mouse is out of focus */
  captureInput(t) {
    if (!(!this.graph || !this.graph.list_of_graphcanvas))
      for (var e = this.graph.list_of_graphcanvas, i = 0; i < e.length; ++i) {
        var n = e[i];
        !t && n.node_capturing_input != this || (n.node_capturing_input = t ? this : null);
      }
  }
  /** Collapse the node to make it smaller on the canvas */
  collapse(t = !1) {
    this.graph._version++, !(this.collapsable === !1 && !t) && (this.flags.collapsed ? this.flags.collapsed = !1 : this.flags.collapsed = !0, this.setDirtyCanvas(!0, !0));
  }
  /** Forces the node to do not move or realign on Z */
  pin(t) {
    this.graph._version++, t === void 0 ? this.flags.pinned = !this.flags.pinned : this.flags.pinned = t;
  }
  localToScreen(t, e, i) {
    return [
      (t + this.pos[0]) * i.ds.scale + i.ds.offset[0],
      (e + this.pos[1]) * i.ds.scale + i.ds.offset[1]
    ];
  }
  getOptionalSlots() {
    return de(this, "optionalSlots");
  }
};
let te = ge;
te.registerCategory = "";
te.MAX_CONSOLE = 100;
const I = class {
  /** Register a node class so it can be listed when the user wants to create a new one */
  static registerNodeType(t) {
    I.debug && console.log("Node registered: " + t.type);
    const e = t.name, i = t.type;
    if (!i)
      throw "Config has no type: " + t;
    console.debug(e, i);
    const n = i.lastIndexOf("/");
    t.category = i.substring(0, n), t.title || (t.title = e);
    const s = I.registered_node_types[i];
    if (s && console.warn("replacing node type: " + i), t.supported_extensions)
      for (let r in t.supported_extensions) {
        const a = t.supported_extensions[r];
        a && a.constructor === String && (I.node_types_by_file_extension[a.toLowerCase()] = t);
      }
    t.class.__LITEGRAPH_TYPE__ = i, I.registered_node_types[i] = t, t.class.name && (I.Nodes[e] = t), I.onNodeTypeRegistered && I.onNodeTypeRegistered(i, t), s && I.onNodeTypeReplaced && I.onNodeTypeReplaced(i, t, s);
  }
  /** removes a node type from the system */
  static unregisterNodeType(t) {
    let e;
    if (typeof t == "string" ? e = I.registered_node_types[t] : e = t, !e)
      throw "node type not found: " + t;
    delete I.registered_node_types[e.type], e.constructor.name && delete I.Nodes[e.constructor.name];
  }
  /**
   * Save a slot type and his node
   * @method registerSlotType
   * @param {String|Object} type name of the node or the node constructor itself
   * @param {String} slot_type name of the slot type (variable type), eg. string, number, array, boolean, ..
   */
  static registerNodeAndSlotType(t, e, i = !1) {
    let n;
    if (typeof t == "string" ? n = I.registered_node_types[t] : "type" in t ? n = I.registered_node_types[t.type] : n = t, !n)
      throw "Node not registered!" + t;
    var s = n.class.__litegraph_type__;
    if (typeof e == "string")
      var r = e.split(",");
    else if (e == A.EVENT || e == A.ACTION)
      var r = ["_event_"];
    else
      var r = ["*"];
    for (var a = 0; a < r.length; ++a) {
      var l = r[a];
      l === "" && (l = "*");
      var o = i ? "registered_slot_out_types" : "registered_slot_in_types";
      typeof this[o][l] > "u" && (this[o][l] = { nodes: [] }), this[o][l].nodes.push(s), i ? I.slot_types_out.includes(l.toLowerCase()) || (I.slot_types_out.push(l.toLowerCase()), I.slot_types_out.sort()) : I.slot_types_in.includes(l.toLowerCase()) || (I.slot_types_in.push(l.toLowerCase()), I.slot_types_in.sort());
    }
  }
  /** Removes all previously registered node's types. */
  static clearRegisteredTypes() {
    I.registered_node_types = {}, I.node_types_by_file_extension = {}, I.Nodes = {}, I.searchbox_extras = {};
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
  static createNode(t, e, i) {
    let n = null, s;
    if (typeof t == "string")
      s = t;
    else if (s = t.__LITEGRAPH_TYPE__, !s)
      throw console.error(t), "Node was not registered yet!";
    if (n = I.registered_node_types[s], !n)
      return console.warn(
        'GraphNode type "' + t + '" not registered.'
      ), null;
    e = e || n.title || s;
    var r = null;
    if (I.catch_exceptions)
      try {
        r = new n.class(e);
      } catch (h) {
        return console.error(h), null;
      }
    else
      r = new n.class(e);
    if (r.class = n.class, r.type = s, !r.title && e && (r.title = e), r.properties || (r.properties = {}), r.properties_info || (r.properties_info = []), r.flags || (r.flags = {}), r.size || (r.size = r.computeSize()), r.pos || (r.pos = [I.DEFAULT_POSITION[0], I.DEFAULT_POSITION[1]]), r.mode || (r.mode = j.ALWAYS), i)
      for (var a in i)
        r[a] = i[a];
    const l = Te(n.class, "propertyLayout");
    if (l) {
      console.log("Found property layout!", l);
      for (const h of l) {
        const { name: p, defaultValue: d, type: c, options: _ } = h;
        r.addProperty(p, d, c, _);
      }
    }
    const o = Te(n.class, "slotLayout");
    if (o && (console.log("Found slot layout!", o), o.inputs)) {
      for (const h of o.inputs) {
        const { name: p, type: d, options: c } = h;
        r.addInput(p, d, c);
      }
      for (const h of o.outputs) {
        const { name: p, type: d, options: c } = h;
        r.addOutput(p, d, c);
      }
    }
    return r.onNodeCreated && r.onNodeCreated(), r;
  }
  /**
   * Returns a registered node type with a given name
   * @param type full name of the node class. p.e. "math/sin"
   */
  static getNodeType(t) {
    return I.registered_node_types[t];
  }
  /**
   * Returns a list of node types matching one category
   * @method getNodeTypesInCategory
   * @param {String} category category name
   * @param {String} filter only nodes with ctor.filter equal can be shown
   * @return {Array} array with all the node classes
   */
  static getNodeTypesInCategory(t, e) {
    var i = [];
    for (var n in I.registered_node_types) {
      var s = I.registered_node_types[n];
      s.filter == e && (t == "" ? s.category == null && i.push(s) : s.category == t && i.push(s));
    }
    return I.auto_sort_node_types && i.sort(function(r, a) {
      return r.title.localeCompare(a.title);
    }), i;
  }
  /**
   * Returns a list with all the node type categories
   * @method getNodeTypesCategories
   * @param {String} filter only nodes with ctor.filter equal can be shown
   * @return {Array} array with all the names of the categories
   */
  static getNodeTypesCategories(t) {
    var e = { "": 1 };
    for (var i in I.registered_node_types) {
      var n = I.registered_node_types[i];
      if (n.category && !n.skip_list) {
        if (n.filter != t)
          continue;
        e[n.category] = 1;
      }
    }
    var s = [];
    for (var i in e)
      s.push(i);
    return I.auto_sort_node_types ? s.sort() : s;
  }
  /** debug purposes: reloads all the js scripts that matches a wildcard */
  static reloadNodes(t) {
    for (var e = document.getElementsByTagName("script"), i = [], n = 0; n < e.length; n++)
      i.push(e[n]);
    var s = document.getElementsByTagName("head")[0];
    t = document.location.href + t;
    for (var n = 0; n < i.length; n++) {
      var r = i[n].src;
      if (!(!r || r.substr(0, t.length) != t))
        try {
          I.debug && console.log("Reloading: " + r);
          var a = document.createElement("script");
          a.type = "text/javascript", a.src = r, s.appendChild(a), s.removeChild(i[n]);
        } catch (o) {
          if (I.throw_errors)
            throw o;
          I.debug && console.log("Error while reloading " + r);
        }
    }
    I.debug && console.log("Nodes reloaded");
  }
  // TODO move
  //separated just to improve if it doesn't work
  static cloneObject(t, e) {
    if (t == null)
      return null;
    var i = JSON.parse(JSON.stringify(t));
    if (!e)
      return i;
    for (var n in i)
      e[n] = i[n];
    return e;
  }
  /**
   * Returns if the types of two slots are compatible (taking into account wildcards, etc)
   * @method isValidConnection
   * @param {String} type_a
   * @param {String} type_b
   * @return {Boolean} true if they can be connected
   */
  static isValidConnection(t, e) {
    if ((t == "" || t === "*") && (t = 0), (e == "" || e === "*") && (e = 0), !t || !e || t == e || t == A.EVENT && e == A.ACTION)
      return !0;
    if (t = String(t), e = String(e), t = t.toLowerCase(), e = e.toLowerCase(), t.indexOf(",") == -1 && e.indexOf(",") == -1)
      return t == e;
    for (var i = t.split(","), n = e.split(","), s = 0; s < i.length; ++s)
      for (var r = 0; r < n.length; ++r)
        if (this.isValidConnection(i[s], n[r]))
          return !0;
    return !1;
  }
  static getTime() {
    return Date.now();
  }
  // static LLink: typeof LLink;
  // static LGraph: typeof LGraph;
  // static DragAndScale: typeof DragAndScale;
  static compareObjects(t, e) {
    for (var i in t)
      if (t[i] != e[i])
        return !1;
    return !0;
  }
  static distance(t, e) {
    return Math.sqrt(
      (e[0] - t[0]) * (e[0] - t[0]) + (e[1] - t[1]) * (e[1] - t[1])
    );
  }
  static colorToString(t) {
    return "rgba(" + Math.round(t[0] * 255).toFixed() + "," + Math.round(t[1] * 255).toFixed() + "," + Math.round(t[2] * 255).toFixed() + "," + (t.length == 4 ? t[3].toFixed(2) : "1.0") + ")";
  }
  static isInsideRectangle(t, e, i, n, s, r) {
    return i < t && i + s > t && n < e && n + r > e;
  }
  // [minx,miny,maxx,maxy]
  static growBounding(t, e, i) {
    return e < t[0] ? t[0] = e : e > t[2] && (t[2] = e), i < t[1] ? t[1] = i : i > t[3] && (t[3] = i), t;
  }
  static isInsideBounding(t, e) {
    return !(t[0] < e[0][0] || t[1] < e[0][1] || t[0] > e[1][0] || t[1] > e[1][1]);
  }
  // bounding overlap, format: [ startx, starty, width, height ]
  static overlapBounding(t, e) {
    var i = t[0] + t[2], n = t[1] + t[3], s = e[0] + e[2], r = e[1] + e[3];
    return !(t[0] > s || t[1] > r || i < e[0] || n < e[1]);
  }
  // Convert a hex value to its decimal value - the inputted hex must be in the
  // format of a hex triplet - the kind we use for HTML colours. The function
  // will return an array with three values.
  static hex2num(t) {
    t.charAt(0) == "#" && (t = t.slice(1)), t = t.toUpperCase();
    var e = "0123456789ABCDEF";
    let i;
    for (var n = 0, s, r, a = 0; a < 6; a += 2)
      s = e.indexOf(t.charAt(a)), r = e.indexOf(t.charAt(a + 1)), i[n] = s * 16 + r, n++;
    return i;
  }
  //Give a array with three values as the argument and the function will return
  //	the corresponding hex triplet.
  static num2hex(t) {
    for (var e = "0123456789ABCDEF", i = "#", n, s, r = 0; r < 3; r++)
      n = t[r] / 16, s = t[r] % 16, i += e.charAt(n) + e.charAt(s);
    return i;
  }
  // ContextMenu: typeof ContextMenu;
  // static extendClass<A, B>(target: A, origin: B): A & B;
  // static getParameterNames(func: string | Function): string[];
  /* helper for interaction: pointer, touch, mouse Listeners
     used by LGraphCanvas DragAndScale ContextMenu*/
  static pointerListenerAdd(t, e, i, n = !1) {
    if (!(!t || !t.addEventListener || !e || typeof i != "function")) {
      var s = I.pointerevents_method, r = e;
      if (s == "pointer" && !window.PointerEvent)
        switch (console.warn("sMethod=='pointer' && !window.PointerEvent"), console.log("Converting pointer[" + r + "] : down move up cancel enter TO touchstart touchmove touchend, etc .."), r) {
          case "down": {
            s = "touch", r = "start";
            break;
          }
          case "move": {
            s = "touch";
            break;
          }
          case "up": {
            s = "touch", r = "end";
            break;
          }
          case "cancel": {
            s = "touch";
            break;
          }
          case "enter": {
            console.log("debug: Should I send a move event?");
            break;
          }
          default:
            console.warn("PointerEvent not available in this browser ? The event " + r + " would not be called");
        }
      switch (r) {
        case "down":
        case "up":
        case "move":
        case "over":
        case "out":
        case "enter":
          t.addEventListener(s + r, i, n);
        case "leave":
        case "cancel":
        case "gotpointercapture":
        case "lostpointercapture":
          if (s != "mouse")
            return t.addEventListener(s + r, i, n);
        default:
          return t.addEventListener(r, i, n);
      }
    }
  }
  static pointerListenerRemove(t, e, i, n = !1) {
    if (!(!t || !t.removeEventListener || !e || typeof i != "function"))
      switch (e) {
        case "down":
        case "up":
        case "move":
        case "over":
        case "out":
        case "enter":
          (I.pointerevents_method == "pointer" || I.pointerevents_method == "mouse") && t.removeEventListener(I.pointerevents_method + e, i, n);
        case "leave":
        case "cancel":
        case "gotpointercapture":
        case "lostpointercapture":
          if (I.pointerevents_method == "pointer")
            return t.removeEventListener(I.pointerevents_method + e, i, n);
        default:
          return t.removeEventListener(e, i, n);
      }
  }
};
let u = I;
u.VERSION = 10;
u.CANVAS_GRID_SIZE = 10;
u.NODE_TITLE_HEIGHT = 20;
u.NODE_TITLE_TEXT_Y = 15;
u.NODE_SLOT_HEIGHT = 20;
u.NODE_WIDGET_HEIGHT = 20;
u.NODE_WIDTH = 140;
u.NODE_MIN_WIDTH = 50;
u.NODE_COLLAPSED_RADIUS = 10;
u.NODE_COLLAPSED_WIDTH = 80;
u.NODE_TITLE_COLOR = "#999";
u.NODE_SELECTED_TITLE_COLOR = "#FFF";
u.NODE_TEXT_SIZE = 14;
u.NODE_TEXT_COLOR = "#AAA";
u.NODE_SUBTEXT_SIZE = 12;
u.NODE_DEFAULT_COLOR = "#333";
u.NODE_DEFAULT_BGCOLOR = "#353535";
u.NODE_DEFAULT_BOXCOLOR = "#666";
u.NODE_DEFAULT_SHAPE = "box";
u.NODE_BOX_OUTLINE_COLOR = "#FFF";
u.DEFAULT_SHADOW_COLOR = "rgba(0,0,0,0.5)";
u.DEFAULT_GROUP_FONT_SIZE = 24;
u.WIDGET_BGCOLOR = "#222";
u.WIDGET_OUTLINE_COLOR = "#666";
u.WIDGET_TEXT_COLOR = "#DDD";
u.WIDGET_SECONDARY_TEXT_COLOR = "#999";
u.LINK_COLOR = "#9A9";
u.EVENT_LINK_COLOR = "#A86";
u.ACTION_LINK_COLOR = "#86A";
u.CONNECTING_LINK_COLOR = "#AFA";
u.MAX_NUMBER_OF_NODES = 1e3;
u.DEFAULT_POSITION = [100, 100];
u.proxy = null;
u.node_images_path = "";
u.debug = !1;
u.catch_exceptions = !0;
u.throw_errors = !0;
u.allow_scripts = !1;
u.registered_node_types = {};
u.node_types_by_file_extension = {};
u.Nodes = {};
u.Globals = {};
u.searchbox_extras = {};
u.auto_sort_node_types = !1;
u.node_box_coloured_when_on = !1;
u.node_box_coloured_by_mode = !1;
u.dialog_close_on_mouse_leave = !0;
u.dialog_close_on_mouse_leave_delay = 500;
u.shift_click_do_break_link_from = !1;
u.click_do_break_link_to = !1;
u.search_hide_on_mouse_leave = !0;
u.search_filter_enabled = !1;
u.search_show_all_on_open = !0;
u.auto_load_slot_types = !1;
u.registered_slot_in_types = {};
u.registered_slot_out_types = {};
u.slot_types_in = [];
u.slot_types_out = [];
u.slot_types_default_in = {};
u.slot_types_default_out = {};
u.alt_drag_do_clone_nodes = !1;
u.do_add_triggers_slots = !1;
u.allow_multi_output_for_events = !0;
u.middle_click_slot_add_default_node = !1;
u.release_link_on_empty_shows_menu = !1;
u.ignore_all_widget_events = !1;
u.pointerevents_method = "mouse";
var x = /* @__PURE__ */ ((t) => (t[t.SEPARATOR = 0] = "SEPARATOR", t))(x || {});
class X {
  static trigger(e, i, n, s) {
    var r = document.createEvent("CustomEvent");
    return r.initCustomEvent(i, !0, !0, n), r.target = s, e.dispatchEvent && e.dispatchEvent(r), r;
  }
  static isCursorOverElement(e, i) {
    var n = e.clientX, s = e.clientY, r = i.getBoundingClientRect();
    return r ? s > r.top && s < r.top + r.height && n > r.left && n < r.left + r.width : !1;
  }
  static closeAllContextMenus(e) {
    e = e || window;
    var i = e.document.querySelectorAll(".litecontextmenu");
    if (i.length) {
      var n = Array.from(i);
      for (const s of n)
        s.close();
    }
  }
  constructor(e, i = {}, n) {
    this.options = i;
    var s = this;
    i.parentMenu && (i.parentMenu.constructor !== this.constructor ? (console.error(
      "parentMenu must be of class ContextMenu, ignoring it"
    ), i.parentMenu = null) : (this.parentMenu = i.parentMenu, this.parentMenu.lock = !0, this.parentMenu.current_submenu = this));
    var r = null;
    i.event && (r = i.event.constructor.name), r !== "MouseEvent" && r !== "CustomEvent" && r !== "PointerEvent" && (console.error(
      "Event passed to ContextMenu is not of type MouseEvent or CustomEvent. Ignoring it. (" + r + ")"
    ), i.event = null);
    var a = document.createElement("div");
    a.className = "litegraph litecontextmenu litemenubar-panel", i.className && (a.className += " " + i.className), a.style.pointerEvents = "none", setTimeout(function() {
      a.style.pointerEvents = "auto";
    }, 100), u.pointerListenerAdd(
      a,
      "up",
      function(g) {
        return g.preventDefault(), !0;
      },
      !0
    ), a.addEventListener(
      "contextmenu",
      function(g) {
        return g.button != 2 || g.preventDefault(), !1;
      },
      !0
    ), a.close = () => {
      a.parentNode.removeChild(a);
    }, u.pointerListenerAdd(
      a,
      "down",
      function(g) {
        if (g.button == 2)
          return s.close(), g.preventDefault(), !0;
      },
      !0
    );
    function l(g) {
      var m = parseInt(a.style.top);
      return a.style.top = (m + g.deltaY * i.scroll_speed).toFixed() + "px", g.preventDefault(), !0;
    }
    if (i.scroll_speed || (i.scroll_speed = 0.1), a.addEventListener("wheel", l, !0), a.addEventListener("mousewheel", l, !0), this.root = a, i.title) {
      var o = document.createElement("div");
      o.className = "litemenu-title", o.innerHTML = i.title, a.appendChild(o);
    }
    this.values = [];
    for (let g = 0; g < e.length; g++) {
      let m = e[g], y = "";
      m === 0 ? y = "" : typeof m == "string" ? y = m : y = m.content, this.addItem(y, m, i);
    }
    u.pointerListenerAdd(a, "enter", function(g) {
      a.closing_timer && clearTimeout(a.closing_timer);
    });
    var h = document;
    i.event && i.event.target instanceof Node && (h = i.event.target.ownerDocument), h || (h = document), h.fullscreenElement ? h.fullscreenElement.appendChild(a) : h.body.appendChild(a);
    var p = i.left || 0, d = i.top || 0;
    if (i.event) {
      if (p = i.event.clientX - 10, d = i.event.clientY - 10, i.title && (d -= 20), i.parentMenu) {
        var c = i.parentMenu.root.getBoundingClientRect();
        p = c.left + c.width;
      }
      var _ = document.body.getBoundingClientRect(), f = a.getBoundingClientRect();
      _.height == 0 && console.error("document.body height is 0. That is dangerous, set html,body { height: 100%; }"), _.width && p > _.width - f.width - 10 && (p = _.width - f.width - 10), _.height && d > _.height - f.height - 10 && (d = _.height - f.height - 10);
    }
    a.style.left = p + "px", a.style.top = d + "px", i.scale && (a.style.transform = "scale(" + i.scale + ")");
  }
  addItem(e, i, n = {}) {
    var s = this, r = document.createElement("div");
    r.className = "litemenu-entry submenu";
    var a = !1;
    typeof i == "string" && (i = { content: i }), i === 0 ? r.classList.add("separator") : (r.innerHTML = i.title ? i.title : e, i.disabled && (a = !0, r.classList.add("disabled")), (i.submenu || i.has_submenu) && r.classList.add("has_submenu"), typeof i == "function" ? r.dataset.value = e : r.dataset.value = "" + this.values.length, i.className && (r.className += " " + i.className)), this.values.push(i), this.root.appendChild(r), a || r.addEventListener("click", h), n.autoopen && u.pointerListenerAdd(r, "enter", o);
    let l = this;
    function o(p) {
      var d = this.value;
      !d || !d.has_submenu || h.call(this, p);
    }
    function h(p) {
      let d = parseInt(this.dataset.value);
      var c = l.values[d];
      u.debug && console.debug("ContextMenu inner_onclick", d, c);
      var _ = !0;
      if (s.current_submenu && s.current_submenu.close(p), n.callback) {
        var f = n.callback.call(
          this,
          c,
          n,
          p,
          s,
          n.node
        );
        f === !0 && (_ = !1);
      }
      if (c && typeof c == "object") {
        if (c.callback && !n.ignore_item_callbacks && c.disabled !== !0) {
          var f = c.callback.call(
            this,
            c,
            n,
            p,
            s,
            n.extra
          );
          f === !0 && (_ = !1);
        }
        if (c.submenu) {
          if (!c.submenu.options)
            throw "ContextMenu submenu needs options";
          new X(c.submenu.options, {
            callback: c.submenu.callback,
            event: p,
            parentMenu: s,
            ignore_item_callbacks: c.submenu.ignore_item_callbacks,
            title: c.submenu.title,
            extra: c.submenu.extra,
            autoopen: n.autoopen
          }), _ = !1;
        }
      }
      _ && !s.lock && s.close();
    }
    return r;
  }
  close(e, i) {
    this.root.parentNode && this.root.parentNode.removeChild(this.root), this.parentMenu && !i && (this.parentMenu.lock = !1, this.parentMenu.current_submenu = null, e === void 0 ? this.parentMenu.close() : e && !X.isCursorOverElement(e, this.parentMenu.root) && X.trigger(this.parentMenu.root, u.pointerevents_method + "leave", e)), this.current_submenu && this.current_submenu.close(e, !0), this.root.closing_timer && clearTimeout(this.root.closing_timer);
  }
  getTopMenu() {
    return this.options.parentMenu ? this.options.parentMenu.getTopMenu() : this;
  }
  getFirstEvent() {
    return this.options.parentMenu ? this.options.parentMenu.getFirstEvent() : this.options.event;
  }
}
class Ae {
  constructor(e, i = !1) {
    this.offset = [0, 0], this.scale = 1, this.max_scale = 10, this.min_scale = 0.1, this.onredraw = null, this.enabled = !0, this.last_mouse = [0, 0], this.element = null, this.visible_area = new Float32Array([0, 0, 0, 0]), this.viewport = null, this.dragging = !1, this._binded_mouse_callback = null, e && (this.element = e, i || this.bindEvents(e));
  }
  bindEvents(e) {
    this.last_mouse = [0, 0], this._binded_mouse_callback = this.onMouse.bind(this), u.pointerListenerAdd(e, "down", this._binded_mouse_callback), u.pointerListenerAdd(e, "move", this._binded_mouse_callback), u.pointerListenerAdd(e, "up", this._binded_mouse_callback), e.addEventListener(
      "mousewheel",
      this._binded_mouse_callback,
      !1
    ), e.addEventListener("wheel", this._binded_mouse_callback, !1);
  }
  computeVisibleArea(e) {
    if (!this.element) {
      this.visible_area[0] = this.visible_area[1] = this.visible_area[2] = this.visible_area[3] = 0;
      return;
    }
    var i = this.element.width, n = this.element.height, s = -this.offset[0], r = -this.offset[1];
    e && (s += e[0] / this.scale, r += e[1] / this.scale, i = e[2], n = e[3]);
    var a = s + i / this.scale, l = r + n / this.scale;
    this.visible_area[0] = s, this.visible_area[1] = r, this.visible_area[2] = a - s, this.visible_area[3] = l - r;
  }
  onMouse(e) {
    if (!this.enabled)
      return;
    var i = this.element, n = i.getBoundingClientRect();
    let s = e;
    var r = s.clientX - n.left, a = s.clientY - n.top;
    s.canvasX = r, s.canvasX = a, s.dragging = this.dragging;
    var l = !this.viewport || this.viewport && r >= this.viewport[0] && r < this.viewport[0] + this.viewport[2] && a >= this.viewport[1] && a < this.viewport[1] + this.viewport[3];
    if (s.type == u.pointerevents_method + "down" && l)
      this.dragging = !0, u.pointerListenerRemove(i, "move", this._binded_mouse_callback), u.pointerListenerAdd(document, "move", this._binded_mouse_callback), u.pointerListenerAdd(document, "up", this._binded_mouse_callback);
    else if (s.type == u.pointerevents_method + "move") {
      var o = r - this.last_mouse[0], h = a - this.last_mouse[1];
      this.dragging && this.mouseDrag(o, h);
    } else
      s.type == u.pointerevents_method + "up" ? (this.dragging = !1, u.pointerListenerRemove(document, "move", this._binded_mouse_callback), u.pointerListenerRemove(document, "up", this._binded_mouse_callback), u.pointerListenerAdd(i, "move", this._binded_mouse_callback)) : l && (s.type == "mousewheel" || s.type == "wheel" || s.type == "DOMMouseScroll") && (s.eventType = "mousewheel", s.type == "wheel" ? s.wheel = -s.deltaY : s.wheel = s.wheelDeltaY != null ? s.wheelDeltaY : s.detail * -60, s.delta = s.wheelDelta ? s.wheelDelta / 40 : s.deltaY ? -s.deltaY / 3 : 0, this.changeDeltaScale(1 + s.delta * 0.05));
    if (this.last_mouse[0] = r, this.last_mouse[1] = a, l)
      return s.preventDefault(), s.stopPropagation(), !1;
  }
  toCanvasContext(e) {
    e.scale(this.scale, this.scale), e.translate(this.offset[0], this.offset[1]);
  }
  convertOffsetToCanvas(e) {
    return [
      (e[0] + this.offset[0]) * this.scale,
      (e[1] + this.offset[1]) * this.scale
    ];
  }
  convertCanvasToOffset(e, i = [0, 0]) {
    return i[0] = e[0] / this.scale - this.offset[0], i[1] = e[1] / this.scale - this.offset[1], i;
  }
  mouseDrag(e, i) {
    this.offset[0] += e / this.scale, this.offset[1] += i / this.scale, this.onredraw && this.onredraw(this);
  }
  changeScale(e, i) {
    if (e < this.min_scale ? e = this.min_scale : e > this.max_scale && (e = this.max_scale), e != this.scale && this.element) {
      var n = this.element.getBoundingClientRect();
      if (n) {
        i = i || [
          n.width * 0.5,
          n.height * 0.5
        ];
        var s = this.convertCanvasToOffset(i);
        this.scale = e, Math.abs(this.scale - 1) < 0.01 && (this.scale = 1);
        var r = this.convertCanvasToOffset(i), a = [
          r[0] - s[0],
          r[1] - s[1]
        ];
        this.offset[0] += a[0], this.offset[1] += a[1], this.onredraw && this.onredraw(this);
      }
    }
  }
  changeDeltaScale(e, i) {
    this.changeScale(this.scale * e, i);
  }
  reset() {
    this.scale = 1, this.offset[0] = 0, this.offset[1] = 0;
  }
}
class he {
  processMouseDown(e) {
    if (this.set_canvas_dirty_on_mouse_event && (this.dirty_canvas = !0), !this.graph)
      return;
    let i = e;
    this.adjustMouseEvent(i);
    var n = this.getCanvasWindow();
    n.document, T.active_canvas = this;
    var s = this, r = i.clientX, a = i.clientY;
    this.ds.viewport = this.viewport;
    var l = !this.viewport || this.viewport && r >= this.viewport[0] && r < this.viewport[0] + this.viewport[2] && a >= this.viewport[1] && a < this.viewport[1] + this.viewport[3];
    if (this.skip_events || (u.pointerListenerRemove(this.canvas, "move", this._mousemove_callback), u.pointerListenerAdd(n.document, "move", this._mousemove_callback, !0), u.pointerListenerAdd(n.document, "up", this._mouseup_callback, !0)), !!l) {
      var o = this.graph.getNodeOnPos(i.canvasX, i.canvasY, this.visible_nodes, 5), h = !1, p = u.getTime(), d = !(i instanceof PointerEvent) || !i.isPrimary, c = p - this.last_mouseclick < 300 && d;
      if (this.mouse[0] = i.clientX, this.mouse[1] = i.clientY, this.graph_mouse[0] = i.canvasX, this.graph_mouse[1] = i.canvasY, this.last_click_position = [this.mouse[0], this.mouse[1]], this.pointer_is_down && d ? this.pointer_is_double = !0 : this.pointer_is_double = !1, this.pointer_is_down = !0, this.canvas.focus(), X.closeAllContextMenus(n), !(this.onMouse && this.onMouse(i) == !0)) {
        if (i.which == 1 && !this.pointer_is_double) {
          if (i.ctrlKey && (this.dragging_rectangle = new Float32Array(4), this.dragging_rectangle[0] = i.canvasX, this.dragging_rectangle[1] = i.canvasY, this.dragging_rectangle[2] = 1, this.dragging_rectangle[3] = 1, h = !0), u.alt_drag_do_clone_nodes && i.altKey && o && this.allow_interaction && !h && !this.read_only) {
            let J = o.clone();
            J && (J.pos[0] += 5, J.pos[1] += 5, this.graph.add(J, { doCalcSize: !1 }), o = J, h = !0, b || (this.allow_dragnodes && (this.graph.beforeChange(), this.node_dragged = o), this.selected_nodes[o.id] || this.processNodeSelected(o, i)));
          }
          var _ = !1;
          if (o && this.allow_interaction && !h && !this.read_only) {
            if (!this.live_mode && !o.flags.pinned && this.bringToFront(o), !this.connecting_node && !o.flags.collapsed && !this.live_mode)
              if (!h && o.resizable !== !1 && u.isInsideRectangle(
                i.canvasX,
                i.canvasY,
                o.pos[0] + o.size[0] - 5,
                o.pos[1] + o.size[1] - 5,
                10,
                10
              ))
                this.graph.beforeChange(), this.resizing_node = o, this.canvas.style.cursor = "se-resize", h = !0;
              else {
                if (o.outputs)
                  for (var f = 0, g = o.outputs.length; f < g; ++f) {
                    var m = o.outputs[f], y = o.getConnectionPos(!1, f);
                    if (u.isInsideRectangle(
                      i.canvasX,
                      i.canvasY,
                      y[0] - 15,
                      y[1] - 10,
                      30,
                      20
                    )) {
                      this.connecting_node = o, this.connecting_output = m, this.connecting_output.slot_index = f, this.connecting_pos = o.getConnectionPos(!1, f), this.connecting_slot = f, u.shift_click_do_break_link_from && i.shiftKey && o.disconnectOutput(f), c ? o.onOutputDblClick && o.onOutputDblClick(f, i) : o.onOutputClick && o.onOutputClick(f, i), h = !0;
                      break;
                    }
                  }
                if (o.inputs)
                  for (var f = 0, g = o.inputs.length; f < g; ++f) {
                    var E = o.inputs[f], y = o.getConnectionPos(!0, f);
                    if (u.isInsideRectangle(
                      i.canvasX,
                      i.canvasY,
                      y[0] - 15,
                      y[1] - 10,
                      30,
                      20
                    )) {
                      if (c ? o.onInputDblClick && o.onInputDblClick(f, i) : o.onInputClick && o.onInputClick(f, i), E.link !== null) {
                        var v = this.graph.links[E.link];
                        u.click_do_break_link_to && (o.disconnectInput(f), this.dirty_bgcanvas = !0, h = !0), (this.allow_reconnect_links || //this.move_destination_link_without_shift ||
                        i.shiftKey) && (u.click_do_break_link_to || o.disconnectInput(f), this.connecting_node = this.graph._nodes_by_id[v.origin_id], this.connecting_slot = v.origin_slot, this.connecting_output = this.connecting_node.outputs[this.connecting_slot], this.connecting_pos = this.connecting_node.getConnectionPos(!1, this.connecting_slot), this.dirty_bgcanvas = !0, h = !0);
                      }
                      h || (this.connecting_node = o, this.connecting_input = E, this.connecting_input.slot_index = f, this.connecting_pos = o.getConnectionPos(!0, f), this.connecting_slot = f, this.dirty_bgcanvas = !0, h = !0);
                    }
                  }
              }
            if (!h) {
              var b = !1, C = [i.canvasX - o.pos[0], i.canvasY - o.pos[1]], O = this.processNodeWidgets(o, this.graph_mouse, i);
              if (O && (b = !0, this.node_widget = [o, O]), c && this.selected_nodes[o.id] && (o.onDblClick && o.onDblClick(i, C, this), this.processNodeDblClicked(o), b = !0), o.onMouseDown && o.onMouseDown(i, C, this))
                b = !0;
              else {
                if (o.subgraph && !o.skip_subgraph_button && !o.flags.collapsed && C[0] > o.size[0] - u.NODE_TITLE_HEIGHT && C[1] < 0) {
                  var s = this;
                  setTimeout(function() {
                    s.openSubgraph(o.subgraph);
                  }, 10);
                }
                this.live_mode && (_ = !0, b = !0);
              }
              b || (this.allow_dragnodes && (this.graph.beforeChange(), this.node_dragged = o), this.selected_nodes[o.id] || this.processNodeSelected(o, i)), this.dirty_canvas = !0;
            }
          } else if (!h) {
            if (!this.read_only)
              for (var f = 0; f < this.visible_links.length; ++f) {
                var M = this.visible_links[f], G = M._pos;
                if (!(!G || i.canvasX < G[0] - 4 || i.canvasX > G[0] + 4 || i.canvasY < G[1] - 4 || i.canvasY > G[1] + 4)) {
                  this.showLinkMenu(M, i), this.over_link_center = null;
                  break;
                }
              }
            if (this.selected_group = this.graph.getGroupOnPos(i.canvasX, i.canvasY), this.selected_group_resizing = !1, this.selected_group && !this.read_only) {
              i.ctrlKey && (this.dragging_rectangle = null);
              var F = u.distance([i.canvasX, i.canvasY], [this.selected_group.pos[0] + this.selected_group.size[0], this.selected_group.pos[1] + this.selected_group.size[1]]);
              F * this.ds.scale < 10 ? this.selected_group_resizing = !0 : this.selected_group.recomputeInsideNodes();
            }
            c && !this.read_only && this.allow_searchbox && (this.showSearchBox(i), i.preventDefault(), i.stopPropagation()), _ = !0;
          }
          !h && _ && this.allow_dragcanvas && (this.dragging_canvas = !0);
        } else if (i.which == 2) {
          if (u.middle_click_slot_add_default_node && o && this.allow_interaction && !h && !this.read_only && !this.connecting_node && !o.flags.collapsed && !this.live_mode) {
            var B = null, D = null, w = null;
            if (o.outputs)
              for (var f = 0, g = o.outputs.length; f < g; ++f) {
                var m = o.outputs[f], y = o.getConnectionPos(!1, f);
                if (u.isInsideRectangle(i.canvasX, i.canvasY, y[0] - 15, y[1] - 10, 30, 20)) {
                  B = m, D = f, w = !0;
                  break;
                }
              }
            if (o.inputs)
              for (var f = 0, g = o.inputs.length; f < g; ++f) {
                var E = o.inputs[f], y = o.getConnectionPos(!0, f);
                if (u.isInsideRectangle(i.canvasX, i.canvasY, y[0] - 15, y[1] - 10, 30, 20)) {
                  B = E, D = f, w = !1;
                  break;
                }
              }
            if (B && D !== !1) {
              var L = 0.5 - (D + 1) / (w ? o.outputs.length : o.inputs.length), P = o.getBounding(), z = [
                w ? P[0] + P[2] : P[0],
                i.canvasY - 80
                // + node_bounding[0]/this.canvas.width*66 // vertical "derive"
              ];
              this.createDefaultNodeForSlot("AUTO", {
                nodeFrom: w ? o : null,
                slotFrom: w ? D : null,
                nodeTo: w ? null : o,
                slotTo: w ? null : D,
                position: z,
                posAdd: [w ? 30 : -30, -L * 130],
                posSizeFix: [w ? 0 : -1, 0]
                //-alphaPosY*2*/
              });
            }
          }
        } else
          (i.which == 3 || this.pointer_is_double) && this.allow_interaction && !h && !this.read_only && (o && (Object.keys(this.selected_nodes).length && (this.selected_nodes[o.id] || i.shiftKey || i.ctrlKey || i.metaKey) ? this.selected_nodes[o.id] || this.selectNodes([o], !0) : this.selectNodes([o])), this.processContextMenu(o, i));
        if (this.selected_group_moving = !1, this.selected_group && !this.selected_group_resizing) {
          var K = this.selected_group.fontSize || u.DEFAULT_GROUP_FONT_SIZE, R = K * 1.4;
          u.isInsideRectangle(i.canvasX, i.canvasY, this.selected_group.pos[0], this.selected_group.pos[1], this.selected_group.size[0], R) && (this.selected_group_moving = !0);
        }
        return this.last_mouse[0] = i.clientX, this.last_mouse[1] = i.clientY, this.last_mouseclick = u.getTime(), this.last_mouse_dragging = !0, this.graph.change(), (!n.document.activeElement || n.document.activeElement.nodeName.toLowerCase() != "input" && n.document.activeElement.nodeName.toLowerCase() != "textarea") && i.preventDefault(), i.stopPropagation(), this.onMouseDown && this.onMouseDown(i), !1;
      }
    }
  }
  processMouseMove(e) {
    let i = e;
    if (this.autoresize && this.resize(), this.set_canvas_dirty_on_mouse_event && (this.dirty_canvas = !0), !this.graph)
      return;
    T.active_canvas = this, this.adjustMouseEvent(i);
    let n = [i.clientX, i.clientY];
    this.mouse[0] = n[0], this.mouse[1] = n[1];
    let s = [
      n[0] - this.last_mouse[0],
      n[1] - this.last_mouse[1]
    ];
    if (this.last_mouse = n, this.graph_mouse[0] = i.canvasX, this.graph_mouse[1] = i.canvasY, this.block_click)
      return i.preventDefault(), !1;
    i.dragging = this.last_mouse_dragging, this.node_widget && (this.processNodeWidgets(
      this.node_widget[0],
      this.graph_mouse,
      i,
      this.node_widget[1]
    ), this.dirty_canvas = !0);
    const r = this.selected_group;
    if (this.selected_group && !this.selected_group_resizing && !this.selected_group_moving && (this.selected_group = null), this.dragging_rectangle)
      this.dragging_rectangle[2] = i.canvasX - this.dragging_rectangle[0], this.dragging_rectangle[3] = i.canvasY - this.dragging_rectangle[1], this.dirty_canvas = !0;
    else if (this.selected_group && !this.read_only) {
      if (this.selected_group_resizing)
        this.selected_group.size = [
          i.canvasX - this.selected_group.pos[0],
          i.canvasY - this.selected_group.pos[1]
        ];
      else {
        var a = s[0] / this.ds.scale, l = s[1] / this.ds.scale;
        this.selected_group.move(a, l, i.ctrlKey), this.selected_group._nodes.length && (this.dirty_canvas = !0);
      }
      this.dirty_bgcanvas = !0;
    } else if (this.dragging_canvas)
      this.ds.offset[0] += s[0] / this.ds.scale, this.ds.offset[1] += s[1] / this.ds.scale, this.dirty_canvas = !0, this.dirty_bgcanvas = !0;
    else if (this.allow_interaction && !this.read_only) {
      this.connecting_node && (this.dirty_canvas = !0);
      for (var o = this.graph.getNodeOnPos(i.canvasX, i.canvasY, this.visible_nodes), h = 0, p = this.graph._nodes.length; h < p; ++h) {
        let b = this.graph._nodes[h];
        b.mouseOver && o != b && (b.mouseOver = !1, this.node_over && this.node_over.onMouseLeave && this.node_over.onMouseLeave(i, [i.canvasX - this.node_over.pos[0], i.canvasY - this.node_over.pos[1]], this), this.node_over = null, this.dirty_canvas = !0);
      }
      if (o) {
        if (o.redraw_on_mouse && (this.dirty_canvas = !0), o.mouseOver || (o.mouseOver = !0, this.node_over = o, this.dirty_canvas = !0, o.onMouseEnter && o.onMouseEnter(i, [i.canvasX - o.pos[0], i.canvasY - o.pos[1]], this)), o.onMouseMove && o.onMouseMove(i, [i.canvasX - o.pos[0], i.canvasY - o.pos[1]], this), this.connecting_node) {
          if (this.connecting_output) {
            var d = this._highlight_input || [0, 0];
            if (!this.isOverNodeBox(o, i.canvasX, i.canvasY)) {
              var c = this.isOverNodeInput(o, i.canvasX, i.canvasY, d);
              if (c != -1 && o.inputs[c]) {
                var _ = o.inputs[c].type;
                u.isValidConnection(this.connecting_output.type, _) && (this._highlight_input = d, this._highlight_input_slot = o.inputs[c]);
              } else
                this._highlight_input = null, this._highlight_input_slot = null;
            }
          } else if (this.connecting_input) {
            var d = this._highlight_output || [0, 0];
            if (!this.isOverNodeBox(o, i.canvasX, i.canvasY)) {
              var c = this.isOverNodeOutput(o, i.canvasX, i.canvasY, d);
              if (c != -1 && o.outputs[c]) {
                var _ = o.outputs[c].type;
                u.isValidConnection(this.connecting_input.type, _) && (this._highlight_output = d);
              } else
                this._highlight_output = null;
            }
          }
        }
        this.canvas && (u.isInsideRectangle(
          i.canvasX,
          i.canvasY,
          o.pos[0] + o.size[0] - 5,
          o.pos[1] + o.size[1] - 5,
          5,
          5
        ) ? this.canvas.style.cursor = "se-resize" : this.canvas.style.cursor = "crosshair");
      } else {
        for (var f = null, h = 0; h < this.visible_links.length; ++h) {
          var g = this.visible_links[h], m = g._pos;
          if (!(!m || i.canvasX < m[0] - 4 || i.canvasX > m[0] + 4 || i.canvasY < m[1] - 4 || i.canvasY > m[1] + 4)) {
            f = g;
            break;
          }
        }
        f != this.over_link_center && (this.over_link_center = f, this.dirty_canvas = !0), this.canvas && (this.canvas.style.cursor = "");
      }
      if (this.node_capturing_input && this.node_capturing_input != o && this.node_capturing_input.onMouseMove && this.node_capturing_input.onMouseMove(i, [i.canvasX - this.node_capturing_input.pos[0], i.canvasY - this.node_capturing_input.pos[1]], this), this.node_dragged && !this.live_mode) {
        for (const b in this.selected_nodes) {
          var y = this.selected_nodes[b];
          y.pos[0] += s[0] / this.ds.scale, y.pos[1] += s[1] / this.ds.scale;
        }
        this.dirty_canvas = !0, this.dirty_bgcanvas = !0;
      }
      if (this.resizing_node && !this.live_mode) {
        var E = [i.canvasX - this.resizing_node.pos[0], i.canvasY - this.resizing_node.pos[1]], v = this.resizing_node.computeSize();
        E[0] = Math.max(v[0], E[0]), E[1] = Math.max(v[1], E[1]), this.resizing_node.setSize(E), this.canvas.style.cursor = "se-resize", this.dirty_canvas = !0, this.dirty_bgcanvas = !0;
      }
    }
    return r && !this.selected_group_resizing && !this.selected_group_moving && (this.selected_group = r), i.preventDefault(), !1;
  }
  processMouseUp(e) {
    let i = e;
    var n = !(i instanceof PointerEvent) || !i.isPrimary;
    if (!n)
      return !1;
    if (this.set_canvas_dirty_on_mouse_event && (this.dirty_canvas = !0), !!this.graph) {
      var s = this.getCanvasWindow(), r = s.document;
      T.active_canvas = this, this.skip_events || (u.pointerListenerRemove(r, "move", this._mousemove_callback, !0), u.pointerListenerAdd(this.canvas, "move", this._mousemove_callback, !0), u.pointerListenerRemove(r, "up", this._mouseup_callback, !0)), this.adjustMouseEvent(i);
      var a = u.getTime();
      if (i.click_time = a - this.last_mouseclick, this.last_mouse_dragging = !1, this.last_click_position = null, this.block_click && (this.block_click = !1), i.which == 1) {
        if (this.node_widget && this.processNodeWidgets(this.node_widget[0], this.graph_mouse, i), this.node_widget = null, this.selected_group) {
          var l = this.selected_group.pos[0] - Math.round(this.selected_group.pos[0]), o = this.selected_group.pos[1] - Math.round(this.selected_group.pos[1]);
          this.selected_group.move(l, o, i.ctrlKey), this.selected_group.pos[0] = Math.round(
            this.selected_group.pos[0]
          ), this.selected_group.pos[1] = Math.round(
            this.selected_group.pos[1]
          ), this.selected_group._nodes.length && (this.dirty_canvas = !0), this.selected_group = null;
        }
        this.selected_group_resizing = !1;
        var h = this.graph.getNodeOnPos(
          i.canvasX,
          i.canvasY,
          this.visible_nodes
        );
        if (this.dragging_rectangle) {
          if (this.graph) {
            var p = this.graph._nodes, d = new Float32Array(4), c = Math.abs(this.dragging_rectangle[2]), _ = Math.abs(this.dragging_rectangle[3]), f = this.dragging_rectangle[2] < 0 ? this.dragging_rectangle[0] - c : this.dragging_rectangle[0], g = this.dragging_rectangle[3] < 0 ? this.dragging_rectangle[1] - _ : this.dragging_rectangle[1];
            if (this.dragging_rectangle[0] = f, this.dragging_rectangle[1] = g, this.dragging_rectangle[2] = c, this.dragging_rectangle[3] = _, !h || c > 10 && _ > 10) {
              for (var m = [], y = 0; y < p.length; ++y) {
                var E = p[y];
                E.getBounding(d), u.overlapBounding(
                  this.dragging_rectangle,
                  d
                ) && m.push(E);
              }
              m.length && this.selectNodes(m, i.shiftKey);
            } else
              this.selectNodes([h], i.shiftKey || i.ctrlKey);
          }
          this.dragging_rectangle = null;
        } else if (this.connecting_node) {
          this.dirty_canvas = !0, this.dirty_bgcanvas = !0;
          var v = this.connecting_output || this.connecting_input, b = v.type;
          if (h) {
            if (this.connecting_output) {
              var C = this.isOverNodeInput(
                h,
                i.canvasX,
                i.canvasY
              );
              C != -1 ? this.connecting_node.connect(this.connecting_slot, h, C) : this.connecting_node.connectByTypeInput(this.connecting_slot, h, b);
            } else if (this.connecting_input) {
              var C = this.isOverNodeOutput(
                h,
                i.canvasX,
                i.canvasY
              );
              C != -1 ? h.connect(C, this.connecting_node, this.connecting_slot) : this.connecting_node.connectByTypeOutput(this.connecting_slot, h, b);
            }
          } else
            u.release_link_on_empty_shows_menu && (i.shiftKey && this.allow_searchbox ? this.connecting_output ? this.showSearchBox(i, { node_from: this.connecting_node, slotFrom: this.connecting_output, type_filter_in: this.connecting_output.type }) : this.connecting_input && this.showSearchBox(i, { node_to: this.connecting_node, slotFrom: this.connecting_input, type_filter_out: this.connecting_input.type }) : this.connecting_output ? this.showConnectionMenu({ nodeFrom: this.connecting_node, slotFrom: this.connecting_output, e: i }) : this.connecting_input && this.showConnectionMenu({ nodeTo: this.connecting_node, slotTo: this.connecting_input, e: i }));
          this.connecting_output = null, this.connecting_input = null, this.connecting_pos = null, this.connecting_node = null, this.connecting_slot = -1;
        } else if (this.resizing_node)
          this.dirty_canvas = !0, this.dirty_bgcanvas = !0, this.graph.afterChange(this.resizing_node), this.resizing_node = null;
        else if (this.node_dragged) {
          var h = this.node_dragged;
          h && i.click_time < 300 && u.isInsideRectangle(
            i.canvasX,
            i.canvasY,
            h.pos[0],
            h.pos[1] - u.NODE_TITLE_HEIGHT,
            u.NODE_TITLE_HEIGHT,
            u.NODE_TITLE_HEIGHT
          ) && h.collapse(), this.dirty_canvas = !0, this.dirty_bgcanvas = !0, this.node_dragged.pos[0] = Math.round(this.node_dragged.pos[0]), this.node_dragged.pos[1] = Math.round(this.node_dragged.pos[1]), (this.graph.config.align_to_grid || this.align_to_grid) && this.node_dragged.alignToGrid(), this.onNodeMoved && this.onNodeMoved(this.node_dragged), this.graph.afterChange(this.node_dragged), this.node_dragged = null;
        } else {
          var h = this.graph.getNodeOnPos(
            i.canvasX,
            i.canvasY,
            this.visible_nodes
          );
          !h && i.click_time < 300 && this.deselectAllNodes(), this.dirty_canvas = !0, this.dragging_canvas = !1, this.node_over && this.node_over.onMouseUp && this.node_over.onMouseUp(i, [i.canvasX - this.node_over.pos[0], i.canvasY - this.node_over.pos[1]], this), this.node_capturing_input && this.node_capturing_input.onMouseUp && this.node_capturing_input.onMouseUp(i, [
            i.canvasX - this.node_capturing_input.pos[0],
            i.canvasY - this.node_capturing_input.pos[1]
          ], this);
        }
      } else
        i.which == 2 ? (this.dirty_canvas = !0, this.dragging_canvas = !1) : i.which == 3 && (this.dirty_canvas = !0, this.dragging_canvas = !1);
      return n && (this.pointer_is_down = !1, this.pointer_is_double = !1), this.graph.change(), i.stopPropagation(), i.preventDefault(), !1;
    }
  }
  processMouseWheel(e) {
    let i = e;
    if (!(!this.graph || !this.allow_dragcanvas)) {
      var n = i.wheelDeltaY != null ? i.wheelDeltaY : i.detail * -60;
      this.adjustMouseEvent(i);
      var s = i.clientX, r = i.clientY, a = !this.viewport || this.viewport && s >= this.viewport[0] && s < this.viewport[0] + this.viewport[2] && r >= this.viewport[1] && r < this.viewport[1] + this.viewport[3];
      if (a) {
        var l = this.ds.scale;
        return n > 0 ? l *= 1.1 : n < 0 && (l *= 1 / 1.1), this.ds.changeScale(l, [i.clientX, i.clientY]), this.graph.change(), i.preventDefault(), !1;
      }
    }
  }
}
const $ = class {
  /** changes the zoom level of the graph (default is 1), you can pass also a place used to pivot the zoom */
  setZoom(t, e) {
    this.ds.changeScale(t, e), this.maxZoom && this.ds.scale > this.maxZoom ? this.scale = this.maxZoom : this.minZoom && this.ds.scale < this.minZoom && (this.scale = this.minZoom);
  }
  /** brings a node to front (above all other nodes) */
  bringToFront(t) {
    var e = this.graph._nodes.indexOf(t);
    e != -1 && (this.graph._nodes.splice(e, 1), this.graph._nodes.push(t));
  }
  /** sends a node to the back (below all other nodes) */
  sendToBack(t) {
    var e = this.graph._nodes.indexOf(t);
    e != -1 && (this.graph._nodes.splice(e, 1), this.graph._nodes.unshift(t));
  }
  /** checks which nodes are visible (inside the camera area) */
  computeVisibleNodes(t, e = []) {
    var i = e;
    i.length = 0, t = t || this.graph._nodes;
    for (var n = 0, s = t.length; n < s; ++n) {
      var r = t[n];
      this.live_mode && !r.onDrawBackground && !r.onDrawForeground || u.overlapBounding(this.visible_area, r.getBounding($.temp)) && i.push(r);
    }
    return i;
  }
  /** renders the whole canvas content, by rendering in two separated canvas, one containing the background grid and the connections, and one containing the nodes) */
  draw(t = !1, e = !1) {
    if (!(!this.canvas || this.canvas.width == 0 || this.canvas.height == 0)) {
      var i = u.getTime();
      this.render_time = (i - this.last_draw_time) * 1e-3, this.last_draw_time = i, this.graph && this.ds.computeVisibleArea(this.viewport), (this.dirty_bgcanvas || e || this.always_render_background || this.graph && this.graph._last_trigger_time && i - this.graph._last_trigger_time < 1e3) && this.drawBackCanvas(), (this.dirty_canvas || t) && this.drawFrontCanvas(), this.fps = this.render_time ? 1 / this.render_time : 0, this.frame += 1;
    }
  }
  /** draws the front canvas (the one containing all the nodes) */
  drawFrontCanvas() {
    this.dirty_canvas = !1, this.ctx || (this.ctx = this.canvas.getContext("2d"));
    var t = this.ctx;
    if (t) {
      var e = this.canvas, i = this.viewport || this.dirty_area;
      if (i && (t.save(), t.beginPath(), t.rect(i[0], i[1], i[2], i[3]), t.clip()), this.clear_background && (i ? t.clearRect(i[0], i[1], i[2], i[3]) : t.clearRect(0, 0, e.width, e.height)), this.bgcanvas == this.canvas ? this.drawBackCanvas() : t.drawImage(this.bgcanvas, 0, 0), this.onRender && this.onRender(e, t), this.show_info && this.renderInfo(t, i ? i[0] : 0, i ? i[1] : 0), this.graph) {
        t.save(), this.ds.toCanvasContext(t);
        for (var n = this.computeVisibleNodes(
          null,
          this.visible_nodes
        ), s = 0; s < n.length; ++s) {
          var r = n[s];
          t.save(), t.translate(r.pos[0], r.pos[1]), this.drawNode(r, t), t.restore();
        }
        if (this.render_execution_order && this.drawExecutionOrder(t), this.graph.config.links_ontop && (this.live_mode || this.drawConnections(t)), this.connecting_pos != null) {
          t.lineWidth = this.connections_width;
          var a = null, l = this.connecting_output || this.connecting_input, o = l.type, h = l.dir;
          h == null && (this.connecting_output ? h = this.connecting_node.horizontal ? k.DOWN : k.RIGHT : h = this.connecting_node.horizontal ? k.UP : k.LEFT);
          var p = l.shape;
          switch (o) {
            case A.EVENT:
              a = u.EVENT_LINK_COLOR;
              break;
            default:
              a = u.CONNECTING_LINK_COLOR;
          }
          if (this.renderLink(
            t,
            this.connecting_pos,
            [this.graph_mouse[0], this.graph_mouse[1]],
            null,
            !1,
            null,
            a,
            h,
            k.CENTER
          ), t.beginPath(), o === A.EVENT || p === S.BOX_SHAPE ? (t.rect(
            this.connecting_pos[0] - 6 + 0.5,
            this.connecting_pos[1] - 5 + 0.5,
            14,
            10
          ), t.fill(), t.beginPath(), t.rect(
            this.graph_mouse[0] - 6 + 0.5,
            this.graph_mouse[1] - 5 + 0.5,
            14,
            10
          )) : p === S.ARROW_SHAPE ? (t.moveTo(this.connecting_pos[0] + 8, this.connecting_pos[1] + 0.5), t.lineTo(this.connecting_pos[0] - 4, this.connecting_pos[1] + 6 + 0.5), t.lineTo(this.connecting_pos[0] - 4, this.connecting_pos[1] - 6 + 0.5), t.closePath()) : (t.arc(
            this.connecting_pos[0],
            this.connecting_pos[1],
            4,
            0,
            Math.PI * 2
          ), t.fill(), t.beginPath(), t.arc(
            this.graph_mouse[0],
            this.graph_mouse[1],
            4,
            0,
            Math.PI * 2
          )), t.fill(), t.fillStyle = "#ffcc00", this._highlight_input) {
            t.beginPath();
            var d = this._highlight_input_slot.shape;
            d === S.ARROW_SHAPE ? (t.moveTo(this._highlight_input[0] + 8, this._highlight_input[1] + 0.5), t.lineTo(this._highlight_input[0] - 4, this._highlight_input[1] + 6 + 0.5), t.lineTo(this._highlight_input[0] - 4, this._highlight_input[1] - 6 + 0.5), t.closePath()) : t.arc(
              this._highlight_input[0],
              this._highlight_input[1],
              6,
              0,
              Math.PI * 2
            ), t.fill();
          }
          this._highlight_output && (t.beginPath(), d === S.ARROW_SHAPE ? (t.moveTo(this._highlight_output[0] + 8, this._highlight_output[1] + 0.5), t.lineTo(this._highlight_output[0] - 4, this._highlight_output[1] + 6 + 0.5), t.lineTo(this._highlight_output[0] - 4, this._highlight_output[1] - 6 + 0.5), t.closePath()) : t.arc(
            this._highlight_output[0],
            this._highlight_output[1],
            6,
            0,
            Math.PI * 2
          ), t.fill());
        }
        this.dragging_rectangle && (t.strokeStyle = "#FFF", t.strokeRect(
          this.dragging_rectangle[0],
          this.dragging_rectangle[1],
          this.dragging_rectangle[2],
          this.dragging_rectangle[3]
        )), this.over_link_center && this.render_link_tooltip ? this.drawLinkTooltip(t, this.over_link_center) : this.onDrawLinkTooltip && this.onDrawLinkTooltip(t, null, this), this.onDrawForeground && this.onDrawForeground(t, this.visible_area), t.restore();
      }
      this._graph_stack && this._graph_stack.length && this.drawSubgraphPanel(t), this.onDrawOverlay && this.onDrawOverlay(t), i && t.restore();
    }
  }
  /**
   * draws the panel in the corner that shows subgraph properties
   * @method drawSubgraphPanel
   **/
  drawSubgraphPanel(t) {
    var e = this.graph, i = e._subgraph_node;
    if (!i) {
      console.warn("subgraph without subnode");
      return;
    }
    this.drawSubgraphPanelLeft(e, i, t), this.drawSubgraphPanelRight(e, i, t);
  }
  drawSubgraphPanelLeft(t, e, i) {
    var n = e.inputs ? e.inputs.length : 0, s = 200, r = Math.floor(u.NODE_SLOT_HEIGHT * 1.6);
    if (i.fillStyle = "#111", i.globalAlpha = 0.8, i.beginPath(), i.roundRect(10, 10, s, (n + 1) * r + 50, [8]), i.fill(), i.globalAlpha = 1, i.fillStyle = "#888", i.font = "14px Arial", i.textAlign = "left", i.fillText("Graph Inputs", 20, 34), this.drawButton(s - 20, 20, 20, 20, "X", "#151515")) {
      this.closeSubgraph();
      return;
    }
    var a = 50;
    if (i.font = "14px Arial", e.inputs)
      for (var l = 0; l < e.inputs.length; ++l) {
        var o = e.inputs[l];
        if (!o.not_subgraph_input) {
          if (this.drawButton(20, a + 2, s - 20, r - 2)) {
            var h = e.constructor.input_node_type || "graph/input";
            this.graph.beforeChange();
            var p = u.createNode(h);
            p ? (t.add(p), this.block_click = !1, this.last_click_position = null, this.selectNodes([p]), this.node_dragged = p, this.dragging_canvas = !1, p.setProperty("name", o.name), p.setProperty("type", o.type), this.node_dragged.pos[0] = this.graph_mouse[0] - 5, this.node_dragged.pos[1] = this.graph_mouse[1] - 5, this.graph.afterChange()) : console.error("graph input node not found:", h);
          }
          i.fillStyle = "#9C9", i.beginPath(), i.arc(s - 16, a + r * 0.5, 5, 0, 2 * Math.PI), i.fill(), i.fillStyle = "#AAA", i.fillText(o.name, 30, a + r * 0.75), i.fillStyle = "#777", i.fillText("" + o.type, 130, a + r * 0.75), a += r;
        }
      }
    this.drawButton(20, a + 2, s - 20, r - 2, "+", "#151515", "#222") && this.showSubgraphPropertiesDialog(e);
  }
  drawSubgraphPanelRight(t, e, i) {
    var n = e.outputs ? e.outputs.length : 0, s = this.bgcanvas.width, r = 200, a = Math.floor(u.NODE_SLOT_HEIGHT * 1.6);
    i.fillStyle = "#111", i.globalAlpha = 0.8, i.beginPath(), i.roundRect(s - r - 10, 10, r, (n + 1) * a + 50, [8]), i.fill(), i.globalAlpha = 1, i.fillStyle = "#888", i.font = "14px Arial", i.textAlign = "left";
    var l = "Graph Outputs", o = i.measureText(l).width;
    if (i.fillText(l, s - o - 20, 34), this.drawButton(s - r, 20, 20, 20, "X", "#151515")) {
      this.closeSubgraph();
      return;
    }
    var h = 50;
    if (i.font = "14px Arial", e.outputs)
      for (var p = 0; p < e.outputs.length; ++p) {
        var d = e.outputs[p];
        if (!d.not_subgraph_output) {
          if (this.drawButton(s - r, h + 2, r - 20, a - 2)) {
            var c = e.constructor.output_node_type || "graph/output";
            this.graph.beforeChange();
            var _ = u.createNode(c);
            _ ? (t.add(_), this.block_click = !1, this.last_click_position = null, this.selectNodes([_]), this.node_dragged = _, this.dragging_canvas = !1, _.setProperty("name", d.name), _.setProperty("type", d.type), this.node_dragged.pos[0] = this.graph_mouse[0] - 5, this.node_dragged.pos[1] = this.graph_mouse[1] - 5, this.graph.afterChange()) : console.error("graph input node not found:", c);
          }
          i.fillStyle = "#9C9", i.beginPath(), i.arc(s - r + 16, h + a * 0.5, 5, 0, 2 * Math.PI), i.fill(), i.fillStyle = "#AAA", i.fillText(d.name, s - r + 30, h + a * 0.75), i.fillStyle = "#777", i.fillText("" + d.type, s - r + 130, h + a * 0.75), h += a;
        }
      }
    this.drawButton(s - r, h + 2, r - 20, a - 2, "+", "#151515", "#222") && this.showSubgraphPropertiesDialogRight(e);
  }
  //Draws a button into the canvas overlay and computes if it was clicked using the immediate gui paradigm
  drawButton(t, e, i, n, s, r = u.NODE_DEFAULT_COLOR, a = "#555", l = u.NODE_TEXT_COLOR) {
    var o = this.ctx, h = e + u.NODE_TITLE_HEIGHT + 2, p = this.mouse, d = u.isInsideRectangle(p[0], p[1], t, h, i, n);
    p = this.last_click_position;
    var c = p && u.isInsideRectangle(p[0], p[1], t, h, i, n);
    o.fillStyle = d ? a : r, c && (o.fillStyle = "#AAA"), o.beginPath(), o.roundRect(t, e, i, n, [4]), o.fill(), s != null && s.constructor == String && (o.fillStyle = l, o.textAlign = "center", o.font = (n * 0.65 | 0) + "px Arial", o.fillText(s, t + i * 0.5, e + n * 0.75), o.textAlign = "left");
    var _ = c && !this.block_click;
    return c && this.blockClick(), _;
  }
  /** draws every group area in the background */
  drawGroups(t, e) {
    if (this.graph) {
      var i = this.graph._groups;
      e.save(), e.globalAlpha = 0.5 * this.editor_alpha;
      for (var n = 0; n < i.length; ++n) {
        var s = i[n];
        if (u.overlapBounding(this.visible_area, s._bounding)) {
          e.fillStyle = s.color || "#335", e.strokeStyle = s.color || "#335";
          var r = s._pos, a = s._size;
          e.globalAlpha = 0.25 * this.editor_alpha, e.beginPath(), e.rect(r[0] + 0.5, r[1] + 0.5, a[0], a[1]), e.fill(), e.globalAlpha = this.editor_alpha, e.stroke(), e.beginPath(), e.moveTo(r[0] + a[0], r[1] + a[1]), e.lineTo(r[0] + a[0] - 10, r[1] + a[1]), e.lineTo(r[0] + a[0], r[1] + a[1] - 10), e.fill();
          var l = s.font_size || u.DEFAULT_GROUP_FONT_SIZE;
          e.font = l + "px Arial", e.textAlign = "left", e.fillText(s.title, r[0] + 4, r[1] + l);
        }
      }
      e.restore();
    }
  }
  /** draws some useful stats in the corner of the canvas */
  renderInfo(t, e = 10, i) {
    i = i || this.canvas.height - 80, t.save(), t.translate(e, i), t.font = "10px Arial", t.fillStyle = "#888", t.textAlign = "left", this.graph ? (t.fillText("T: " + this.graph.globaltime.toFixed(2) + "s", 5, 13 * 1), t.fillText("I: " + this.graph.iteration, 5, 13 * 2), t.fillText("N: " + this.graph._nodes.length + " [" + this.visible_nodes.length + "]", 5, 13 * 3), t.fillText("V: " + this.graph._version, 5, 13 * 4), t.fillText("FPS:" + this.fps.toFixed(2), 5, 13 * 5)) : t.fillText("No graph selected", 5, 13 * 1), t.restore();
  }
  /** draws the back canvas (the one containing the background and the connections) */
  drawBackCanvas() {
    var t = this.bgcanvas;
    (t.width != this.canvas.width || t.height != this.canvas.height) && (t.width = this.canvas.width, t.height = this.canvas.height), this.bgctx || (this.bgctx = this.bgcanvas.getContext("2d"));
    var e = this.bgctx;
    let i = this.viewport || [0, 0, e.canvas.width, e.canvas.height];
    if (this.clear_background && e.clearRect(i[0], i[1], i[2], i[3]), this._graph_stack && this._graph_stack.length) {
      e.save(), this._graph_stack[this._graph_stack.length - 1];
      var n = this.graph._subgraph_node;
      e.strokeStyle = n.bgColor, e.lineWidth = 10, e.strokeRect(1, 1, t.width - 2, t.height - 2), e.lineWidth = 1, e.font = "40px Arial", e.textAlign = "center", e.fillStyle = n.bgColor || "#AAA";
      for (var s = "", r = 1; r < this._graph_stack.length; ++r)
        s += this._graph_stack[r]._subgraph_node.getTitle() + " >> ";
      e.fillText(
        s + n.getTitle(),
        t.width * 0.5,
        40
      ), e.restore();
    }
    let a = !1;
    if (this.onRenderBackground && this.onRenderBackground(t, e) && (a = !0), this.viewport || (e.restore(), e.setTransform(1, 0, 0, 1, 0, 0)), this.visible_links.length = 0, this.graph) {
      if (e.save(), this.ds.toCanvasContext(e), this.background_image && this.ds.scale > 0.5 && !a) {
        this.zoom_modify_alpha ? e.globalAlpha = (1 - 0.5 / this.ds.scale) * this.editor_alpha : e.globalAlpha = this.editor_alpha, e.imageSmoothingEnabled = e.imageSmoothingEnabled = !1, (!this._bg_img || this._bg_img.name != this.background_image) && (this._bg_img = new Image(), this._bg_img.name = this.background_image, this._bg_img.src = this.background_image, this._bg_img.onload = () => {
          this.draw(!0, !0);
        });
        var l = null;
        this._pattern == null && this._bg_img.width > 0 ? (l = e.createPattern(this._bg_img, "repeat"), this._pattern_img = this._bg_img, this._pattern = l) : l = this._pattern, l && (e.fillStyle = l, e.fillRect(
          this.visible_area[0],
          this.visible_area[1],
          this.visible_area[2],
          this.visible_area[3]
        ), e.fillStyle = "transparent"), e.globalAlpha = 1, e.imageSmoothingEnabled = e.imageSmoothingEnabled = !0;
      }
      this.graph._groups.length && !this.live_mode && this.drawGroups(t, e), this.onDrawBackground && this.onDrawBackground(e, this.visible_area), u.debug && (e.fillStyle = "red", e.fillRect(this.visible_area[0] + 10, this.visible_area[1] + 10, this.visible_area[2] - 20, this.visible_area[3] - 20)), this.render_canvas_border && (e.strokeStyle = "#235", e.strokeRect(0, 0, t.width, t.height)), this.render_connections_shadows ? (e.shadowColor = "#000", e.shadowOffsetX = 0, e.shadowOffsetY = 0, e.shadowBlur = 6) : e.shadowColor = "rgba(0,0,0,0)", this.live_mode || this.drawConnections(e), e.shadowColor = "rgba(0,0,0,0)", e.restore();
    }
    this.dirty_bgcanvas = !1, this.dirty_canvas = !0;
  }
  /** draws the given node inside the canvas */
  drawNode(t, e) {
    this.current_node = t;
    var i = t.color || t.constructor.color || u.NODE_DEFAULT_COLOR, n = t.bgColor || t.constructor.bgColor || u.NODE_DEFAULT_BGCOLOR;
    t.mouseOver;
    var s = this.ds.scale < 0.6;
    if (this.live_mode) {
      t.flags.collapsed || (e.shadowColor = "transparent", t.onDrawForeground && t.onDrawForeground(e, this, this.canvas));
      return;
    }
    var r = this.editor_alpha;
    if (e.globalAlpha = r, this.render_shadows && !s ? (e.shadowColor = u.DEFAULT_SHADOW_COLOR, e.shadowOffsetX = 2 * this.ds.scale, e.shadowOffsetY = 2 * this.ds.scale, e.shadowBlur = 3 * this.ds.scale) : e.shadowColor = "transparent", !(t.flags.collapsed && t.onDrawCollapsed && t.onDrawCollapsed(e, this) == !0)) {
      var a = t.shape || S.BOX_SHAPE, l = $.temp_vec2;
      $.temp_vec2.set(t.size);
      var o = t.horizontal;
      if (t.flags.collapsed) {
        e.font = this.inner_text_font;
        var h = t.getTitle ? t.getTitle() : t.title;
        h != null && (t._collapsed_width = Math.min(
          t.size[0],
          e.measureText(h).width + u.NODE_TITLE_HEIGHT * 2
        ), l[0] = t._collapsed_width, l[1] = 0);
      }
      t.clip_area && (e.save(), e.beginPath(), a == S.BOX_SHAPE ? e.rect(0, 0, l[0], l[1]) : a == S.ROUND_SHAPE ? e.roundRect(0, 0, l[0], l[1], [10]) : a == S.CIRCLE_SHAPE && e.arc(
        l[0] * 0.5,
        l[1] * 0.5,
        l[0] * 0.5,
        0,
        Math.PI * 2
      ), e.clip()), t.has_errors && (n = "red"), this.drawNodeShape(
        t,
        e,
        [l[0], l[1]],
        i,
        n,
        t.is_selected,
        t.mouseOver
      ), e.shadowColor = "transparent", t.onDrawForeground && t.onDrawForeground(e, this, this.canvas), e.textAlign = o ? "center" : "left", e.font = this.inner_text_font;
      var p = !s, d = this.connecting_output, c = this.connecting_input;
      e.lineWidth = 1;
      var _ = 0, f = [0, 0];
      if (t.flags.collapsed) {
        if (this.render_collapsed_slots) {
          var M = null, G = null;
          if (t.inputs)
            for (let D = 0; D < t.inputs.length; D++) {
              let w = t.inputs[D];
              if (w.link != null) {
                M = w;
                break;
              }
            }
          if (t.outputs)
            for (let D = 0; D < t.outputs.length; D++) {
              let w = t.outputs[D];
              !w.links || !w.links.length || (G = w);
            }
          if (M) {
            var F = 0, B = u.NODE_TITLE_HEIGHT * -0.5;
            o && (F = t._collapsed_width * 0.5, B = -u.NODE_TITLE_HEIGHT), e.fillStyle = "#686", e.beginPath(), M.type === A.EVENT || M.shape === S.BOX_SHAPE ? e.rect(F - 7 + 0.5, B - 4, 14, 8) : M.shape === S.ARROW_SHAPE ? (e.moveTo(F + 8, B), e.lineTo(F + -4, B - 4), e.lineTo(F + -4, B + 4), e.closePath()) : e.arc(F, B, 4, 0, Math.PI * 2), e.fill();
          }
          if (G) {
            var F = t._collapsed_width, B = u.NODE_TITLE_HEIGHT * -0.5;
            o && (F = t._collapsed_width * 0.5, B = 0), e.fillStyle = "#686", e.strokeStyle = "black", e.beginPath(), G.type === A.EVENT || G.shape === S.BOX_SHAPE ? e.rect(F - 7 + 0.5, B - 4, 14, 8) : G.shape === S.ARROW_SHAPE ? (e.moveTo(F + 6, B), e.lineTo(F - 6, B - 4), e.lineTo(F - 6, B + 4), e.closePath()) : e.arc(F, B, 4, 0, Math.PI * 2), e.fill();
          }
        }
      } else {
        if (t.inputs)
          for (var g = 0; g < t.inputs.length; g++) {
            var m = t.inputs[g], y = m.type, E = m.shape;
            e.globalAlpha = r, this.connecting_output && !u.isValidConnection(m.type, d.type) && (e.globalAlpha = 0.4 * r), e.fillStyle = m.link != null ? m.color_on || // this.default_connection_color_byType[slot_type] ||
            this.default_connection_color.input_on : m.color_off || // this.default_connection_color_byTypeOff[slot_type] ||
            // this.default_connection_color_byType[slot_type] ||
            this.default_connection_color.input_off;
            var v = t.getConnectionPos(!0, g, [f[0], f[1]]);
            v[0] -= t.pos[0], v[1] -= t.pos[1], _ < v[1] + u.NODE_SLOT_HEIGHT * 0.5 && (_ = v[1] + u.NODE_SLOT_HEIGHT * 0.5), e.beginPath();
            var b = !0;
            if (m.type === A.EVENT || m.shape === S.BOX_SHAPE ? o ? e.rect(
              v[0] - 5 + 0.5,
              v[1] - 8 + 0.5,
              10,
              14
            ) : e.rect(
              v[0] - 6 + 0.5,
              v[1] - 5 + 0.5,
              14,
              10
            ) : E === S.ARROW_SHAPE ? (e.moveTo(v[0] + 8, v[1] + 0.5), e.lineTo(v[0] - 4, v[1] + 6 + 0.5), e.lineTo(v[0] - 4, v[1] - 6 + 0.5), e.closePath()) : E === S.GRID_SHAPE ? (e.rect(v[0] - 4, v[1] - 4, 2, 2), e.rect(v[0] - 1, v[1] - 4, 2, 2), e.rect(v[0] + 2, v[1] - 4, 2, 2), e.rect(v[0] - 4, v[1] - 1, 2, 2), e.rect(v[0] - 1, v[1] - 1, 2, 2), e.rect(v[0] + 2, v[1] - 1, 2, 2), e.rect(v[0] - 4, v[1] + 2, 2, 2), e.rect(v[0] - 1, v[1] + 2, 2, 2), e.rect(v[0] + 2, v[1] + 2, 2, 2), b = !1) : s ? e.rect(v[0] - 4, v[1] - 4, 8, 8) : e.arc(v[0], v[1], 4, 0, Math.PI * 2), e.fill(), p) {
              var C = m.label != null ? m.label : m.name;
              C && (e.fillStyle = u.NODE_TEXT_COLOR, o || m.dir == k.UP ? e.fillText(C, v[0], v[1] - 10) : e.fillText(C, v[0] + 10, v[1] + 5));
            }
          }
        if (e.textAlign = o ? "center" : "right", e.strokeStyle = "black", t.outputs)
          for (let D = 0; D < t.outputs.length; D++) {
            let w = t.outputs[D];
            var y = w.type, E = w.shape;
            this.connecting_input && !u.isValidConnection(y, c.type) && (e.globalAlpha = 0.4 * r);
            var v = t.getConnectionPos(!1, D, f);
            v[0] -= t.pos[0], v[1] -= t.pos[1], _ < v[1] + u.NODE_SLOT_HEIGHT * 0.5 && (_ = v[1] + u.NODE_SLOT_HEIGHT * 0.5), e.fillStyle = w.links && w.links.length ? w.color_on || // this.default_connection_color_byType[slot_type] ||
            this.default_connection_color.output_on : w.color_off || // this.default_connection_color_byTypeOff[slot_type] ||
            // this.default_connection_color_byType[slot_type] ||
            this.default_connection_color.output_off, e.beginPath();
            var b = !0;
            if (y === A.EVENT || E === S.BOX_SHAPE ? o ? e.rect(
              v[0] - 5 + 0.5,
              v[1] - 8 + 0.5,
              10,
              14
            ) : e.rect(
              v[0] - 6 + 0.5,
              v[1] - 5 + 0.5,
              14,
              10
            ) : E === S.ARROW_SHAPE ? (e.moveTo(v[0] + 8, v[1] + 0.5), e.lineTo(v[0] - 4, v[1] + 6 + 0.5), e.lineTo(v[0] - 4, v[1] - 6 + 0.5), e.closePath()) : E === S.GRID_SHAPE ? (e.rect(v[0] - 4, v[1] - 4, 2, 2), e.rect(v[0] - 1, v[1] - 4, 2, 2), e.rect(v[0] + 2, v[1] - 4, 2, 2), e.rect(v[0] - 4, v[1] - 1, 2, 2), e.rect(v[0] - 1, v[1] - 1, 2, 2), e.rect(v[0] + 2, v[1] - 1, 2, 2), e.rect(v[0] - 4, v[1] + 2, 2, 2), e.rect(v[0] - 1, v[1] + 2, 2, 2), e.rect(v[0] + 2, v[1] + 2, 2, 2), b = !1) : s ? e.rect(v[0] - 4, v[1] - 4, 8, 8) : e.arc(v[0], v[1], 4, 0, Math.PI * 2), e.fill(), !s && b && e.stroke(), p) {
              var C = w.label != null ? w.label : w.name;
              C && (e.fillStyle = u.NODE_TEXT_COLOR, o || w.dir == k.DOWN ? e.fillText(C, v[0], v[1] - 8) : e.fillText(C, v[0] - 10, v[1] + 5));
            }
          }
        if (e.textAlign = "left", e.globalAlpha = 1, t.widgets) {
          var O = _;
          (o || t.widgets_up) && (O = 2), t.widgets_start_y != null && (O = t.widgets_start_y), this.drawNodeWidgets(
            t,
            O,
            e,
            this.node_widget && this.node_widget[0] == t ? this.node_widget[1] : null
          );
        }
      }
      t.clip_area && e.restore(), e.globalAlpha = 1;
    }
  }
  /** used by this.over_link_center */
  drawLinkTooltip(t, e) {
    var i = e._pos;
    if (t.fillStyle = "black", t.beginPath(), t.arc(i[0], i[1], 3, 0, Math.PI * 2), t.fill(), e.data != null && !(this.onDrawLinkTooltip && this.onDrawLinkTooltip(t, e, this) == !0)) {
      var n = e.data, s = null;
      if (n.constructor === Number ? s = n.toFixed(2) : n.constructor === String ? s = '"' + n + '"' : n.constructor === Boolean ? s = String(n) : n.toToolTip ? s = n.toToolTip() : s = "[" + n.constructor.name + "]", s != null) {
        s = s.substr(0, 30), t.font = "14px Courier New";
        var r = t.measureText(s), a = r.width + 20, l = 24;
        t.shadowColor = "black", t.shadowOffsetX = 2, t.shadowOffsetY = 2, t.shadowBlur = 3, t.fillStyle = "#454", t.beginPath(), t.roundRect(i[0] - a * 0.5, i[1] - 15 - l, a, l, [3]), t.moveTo(i[0] - 10, i[1] - 15), t.lineTo(i[0] + 10, i[1] - 15), t.lineTo(i[0], i[1] - 5), t.fill(), t.shadowColor = "transparent", t.textAlign = "center", t.fillStyle = "#CEC", t.fillText(s, i[0], i[1] - 15 - l * 0.3);
      }
    }
  }
  /** draws the shape of the given node in the canvas */
  drawNodeShape(t, e, i, n, s, r, a) {
    e.strokeStyle = n, e.fillStyle = s;
    var l = u.NODE_TITLE_HEIGHT, o = this.ds.scale < 0.5, h = t.shape || t.constructor.shape || S.ROUND_SHAPE, p = t.titleMode, d = !0;
    p == ee.TRANSPARENT_TITLE || p == ee.NO_TITLE ? d = !1 : p == ee.AUTOHIDE_TITLE && a && (d = !0);
    var c = $.tmp_area;
    c[0] = 0, c[1] = d ? -l : 0, c[2] = i[0] + 1, c[3] = d ? i[1] + l : i[1];
    var _ = e.globalAlpha;
    if (e.beginPath(), h == S.BOX_SHAPE || o ? e.fillRect(c[0], c[1], c[2], c[3]) : h == S.ROUND_SHAPE || h == S.CARD_SHAPE ? e.roundRect(
      c[0],
      c[1],
      c[2],
      c[3],
      h == S.CARD_SHAPE ? [this.round_radius, this.round_radius, 0, 0] : [this.round_radius]
    ) : h == S.CIRCLE_SHAPE && e.arc(
      i[0] * 0.5,
      i[1] * 0.5,
      i[0] * 0.5,
      0,
      Math.PI * 2
    ), e.fill(), !t.flags.collapsed && d && (e.shadowColor = "transparent", e.fillStyle = "rgba(0,0,0,0.2)", e.fillRect(0, -1, c[2], 2)), e.shadowColor = "transparent", t.onDrawBackground && t.onDrawBackground(e, this, this.canvas, this.graph_mouse), d || p == ee.TRANSPARENT_TITLE) {
      if (t.onDrawTitleBar)
        t.onDrawTitleBar(e, this, l, i, this.ds.scale, n);
      else if (p != ee.TRANSPARENT_TITLE && (t.constructor.title_color || this.render_title_colored)) {
        var f = t.constructor.title_color || n;
        if (t.flags.collapsed && (e.shadowColor = u.DEFAULT_SHADOW_COLOR), this.use_gradients) {
          var g = T.gradients[f];
          g || (g = T.gradients[f] = e.createLinearGradient(0, 0, 400, 0), g.addColorStop(0, f), g.addColorStop(1, "#000")), e.fillStyle = g;
        } else
          e.fillStyle = f;
        e.beginPath(), h == S.BOX_SHAPE || o ? e.rect(0, -l, i[0] + 1, l) : (h == S.ROUND_SHAPE || h == S.CARD_SHAPE) && e.roundRect(
          0,
          -l,
          i[0] + 1,
          l,
          t.flags.collapsed ? [this.round_radius] : [this.round_radius, this.round_radius, 0, 0]
        ), e.fill(), e.shadowColor = "transparent";
      }
      var m = null;
      u.node_box_coloured_by_mode && ye[t.mode] && (m = ye[t.mode]), u.node_box_coloured_when_on && (m = t.action_triggered ? "#FFF" : t.execute_triggered ? "#AAA" : m);
      var y = 10;
      if (t.onDrawTitleBox ? t.onDrawTitleBox(e, this, l, i, this.ds.scale) : h == S.ROUND_SHAPE || h == S.CIRCLE_SHAPE || h == S.CARD_SHAPE ? (o && (e.fillStyle = "black", e.beginPath(), e.arc(
        l * 0.5,
        l * -0.5,
        y * 0.5 + 1,
        0,
        Math.PI * 2
      ), e.fill()), e.fillStyle = t.boxcolor || m || u.NODE_DEFAULT_BOXCOLOR, o ? e.fillRect(l * 0.5 - y * 0.5, l * -0.5 - y * 0.5, y, y) : (e.beginPath(), e.arc(
        l * 0.5,
        l * -0.5,
        y * 0.5,
        0,
        Math.PI * 2
      ), e.fill())) : (o && (e.fillStyle = "black", e.fillRect(
        (l - y) * 0.5 - 1,
        (l + y) * -0.5 - 1,
        y + 2,
        y + 2
      )), e.fillStyle = t.boxcolor || m || u.NODE_DEFAULT_BOXCOLOR, e.fillRect(
        (l - y) * 0.5,
        (l + y) * -0.5,
        y,
        y
      )), e.globalAlpha = _, t.onDrawTitleText && t.onDrawTitleText(
        e,
        this,
        l,
        i,
        this.ds.scale,
        this.title_text_font,
        r
      ), !o) {
        e.font = this.title_text_font;
        var E = String(t.getTitle());
        E && (r ? e.fillStyle = u.NODE_SELECTED_TITLE_COLOR : e.fillStyle = t.constructor.title_text_color || this.node_title_color, t.flags.collapsed ? (e.textAlign = "left", e.fillText(
          E.substr(0, 20),
          //avoid urls too long
          l,
          // + measure.width * 0.5,
          u.NODE_TITLE_TEXT_Y - l
        ), e.textAlign = "left") : (e.textAlign = "left", e.fillText(
          E,
          l,
          u.NODE_TITLE_TEXT_Y - l
        )));
      }
      if (!t.flags.collapsed && t.subgraph && !t.skip_subgraph_button) {
        var v = u.NODE_TITLE_HEIGHT, b = t.size[0] - v, C = u.isInsideRectangle(this.graph_mouse[0] - t.pos[0], this.graph_mouse[1] - t.pos[1], b + 2, -v + 2, v - 4, v - 4);
        e.fillStyle = C ? "#888" : "#555", h == S.BOX_SHAPE || o ? e.fillRect(b + 2, -v + 2, v - 4, v - 4) : (e.beginPath(), e.roundRect(b + 2, -v + 2, v - 4, v - 4, [4]), e.fill()), e.fillStyle = "#333", e.beginPath(), e.moveTo(b + v * 0.2, -v * 0.6), e.lineTo(b + v * 0.8, -v * 0.6), e.lineTo(b + v * 0.5, -v * 0.3), e.fill();
      }
      t.onDrawTitle && t.onDrawTitle(e, this);
    }
    r && (t.onBounding && t.onBounding(c), p == ee.TRANSPARENT_TITLE && (c[1] -= l, c[3] += l), e.lineWidth = 1, e.globalAlpha = 0.8, e.beginPath(), h == S.BOX_SHAPE ? e.rect(
      -6 + c[0],
      -6 + c[1],
      12 + c[2],
      12 + c[3]
    ) : h == S.ROUND_SHAPE || h == S.CARD_SHAPE && t.flags.collapsed ? e.roundRect(
      -6 + c[0],
      -6 + c[1],
      12 + c[2],
      12 + c[3],
      [this.round_radius * 2]
    ) : h == S.CARD_SHAPE ? e.roundRect(
      -6 + c[0],
      -6 + c[1],
      12 + c[2],
      12 + c[3],
      [this.round_radius * 2, 2, this.round_radius * 2, 2]
    ) : h == S.CIRCLE_SHAPE && e.arc(
      i[0] * 0.5,
      i[1] * 0.5,
      i[0] * 0.5 + 6,
      0,
      Math.PI * 2
    ), e.strokeStyle = u.NODE_BOX_OUTLINE_COLOR, e.stroke(), e.strokeStyle = n, e.globalAlpha = 1), t.execute_triggered > 0 && t.execute_triggered--, t.action_triggered > 0 && t.action_triggered--;
  }
  /** draws every connection visible in the canvas */
  drawConnections(t) {
    var e = u.getTime(), i = this.visible_area;
    let n = $.margin_area;
    n[0] = i[0] - 20, n[1] = i[1] - 20, n[2] = i[2] + 40, n[3] = i[3] + 40, t.lineWidth = this.connections_width, t.fillStyle = "#AAA", t.strokeStyle = "#AAA", t.globalAlpha = this.editor_alpha;
    for (var s = this.graph._nodes, r = 0, a = s.length; r < a; ++r) {
      var l = s[r];
      if (!(!l.inputs || !l.inputs.length))
        for (var o = 0; o < l.inputs.length; ++o) {
          var h = l.inputs[o];
          if (!h || h.link == null)
            continue;
          var p = h.link, d = this.graph.links[p];
          if (!d)
            continue;
          var c = this.graph.getNodeById(d.origin_id);
          if (c == null)
            continue;
          var _ = d.origin_slot, f = null;
          _ == -1 ? f = [
            c.pos[0] + 10,
            c.pos[1] + 10
          ] : f = c.getConnectionPos(
            !1,
            _,
            $.tempA
          );
          var g = l.getConnectionPos(!0, o, $.tempB);
          let O = $.link_bounding;
          if (O[0] = f[0], O[1] = f[1], O[2] = g[0] - f[0], O[3] = g[1] - f[1], O[2] < 0 && (O[0] += O[2], O[2] = Math.abs(O[2])), O[3] < 0 && (O[1] += O[3], O[3] = Math.abs(O[3])), !!u.overlapBounding(O, n)) {
            var m = c.outputs[_], y = l.inputs[o];
            if (!(!m || !y)) {
              var E = m.dir || (c.horizontal ? k.DOWN : k.RIGHT), v = y.dir || (l.horizontal ? k.UP : k.LEFT);
              if (this.renderLink(
                t,
                f,
                g,
                d,
                !1,
                !1,
                null,
                E,
                v
              ), d && d._last_time && e - d._last_time < 1e3) {
                var b = 2 - (e - d._last_time) * 2e-3, C = t.globalAlpha;
                t.globalAlpha = C * b, this.renderLink(
                  t,
                  f,
                  g,
                  d,
                  !0,
                  !0,
                  "white",
                  E,
                  v
                ), t.globalAlpha = C;
              }
            }
          }
        }
    }
    t.globalAlpha = 1;
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
  renderLink(t, e, i, n, s, r, a, l, o, h) {
    n && this.visible_links.push(n), !a && n && (a = n.color || T.link_type_colors[n.type]), a || (a = this.default_link_color), n != null && this.highlighted_links[n.id] && (a = "#FFF"), l = l || k.RIGHT, o = o || k.LEFT;
    var p = u.distance(e, i);
    this.render_connections_border && this.ds.scale > 0.6 && (t.lineWidth = this.connections_width + 4), t.lineJoin = "round", h = h || 1, h > 1 && (t.lineWidth = 0.5), t.beginPath();
    for (var d = 0; d < h; d += 1) {
      var c = (d - (h - 1) * 0.5) * 5;
      if (this.links_render_mode == le.SPLINE_LINK) {
        t.moveTo(e[0], e[1] + c);
        var _ = 0, f = 0, g = 0, m = 0;
        switch (l) {
          case k.LEFT:
            _ = p * -0.25;
            break;
          case k.RIGHT:
            _ = p * 0.25;
            break;
          case k.UP:
            f = p * -0.25;
            break;
          case k.DOWN:
            f = p * 0.25;
            break;
        }
        switch (o) {
          case k.LEFT:
            g = p * -0.25;
            break;
          case k.RIGHT:
            g = p * 0.25;
            break;
          case k.UP:
            m = p * -0.25;
            break;
          case k.DOWN:
            m = p * 0.25;
            break;
        }
        t.bezierCurveTo(
          e[0] + _,
          e[1] + f + c,
          i[0] + g,
          i[1] + m + c,
          i[0],
          i[1] + c
        );
      } else if (this.links_render_mode == le.LINEAR_LINK) {
        t.moveTo(e[0], e[1] + c);
        var _ = 0, f = 0, g = 0, m = 0;
        switch (l) {
          case k.LEFT:
            _ = -1;
            break;
          case k.RIGHT:
            _ = 1;
            break;
          case k.UP:
            f = -1;
            break;
          case k.DOWN:
            f = 1;
            break;
        }
        switch (o) {
          case k.LEFT:
            g = -1;
            break;
          case k.RIGHT:
            g = 1;
            break;
          case k.UP:
            m = -1;
            break;
          case k.DOWN:
            m = 1;
            break;
        }
        var y = 15;
        t.lineTo(
          e[0] + _ * y,
          e[1] + f * y + c
        ), t.lineTo(
          i[0] + g * y,
          i[1] + m * y + c
        ), t.lineTo(i[0], i[1] + c);
      } else if (this.links_render_mode == le.STRAIGHT_LINK) {
        t.moveTo(e[0], e[1]);
        var E = e[0], v = e[1], b = i[0], C = i[1];
        l == k.RIGHT ? E += 10 : v += 10, o == k.LEFT ? b -= 10 : C -= 10, t.lineTo(E, v), t.lineTo((E + b) * 0.5, v), t.lineTo((E + b) * 0.5, C), t.lineTo(b, C), t.lineTo(i[0], i[1]);
      } else
        return;
    }
    this.render_connections_border && this.ds.scale > 0.6 && !s && (t.strokeStyle = "rgba(0,0,0,0.5)", t.stroke()), t.lineWidth = this.connections_width, t.fillStyle = t.strokeStyle = a, t.stroke();
    var O = this.computeConnectionPoint(e, i, 0.5, l, o);
    if (n && n._pos && (n._pos[0] = O[0], n._pos[1] = O[1]), this.ds.scale >= 0.6 && this.highquality_render && o != k.CENTER) {
      if (this.render_connection_arrows) {
        var M = this.computeConnectionPoint(
          e,
          i,
          0.25,
          l,
          o
        ), G = this.computeConnectionPoint(
          e,
          i,
          0.26,
          l,
          o
        ), F = this.computeConnectionPoint(
          e,
          i,
          0.75,
          l,
          o
        ), B = this.computeConnectionPoint(
          e,
          i,
          0.76,
          l,
          o
        ), D = 0, w = 0;
        this.render_curved_connections ? (D = -Math.atan2(G[0] - M[0], G[1] - M[1]), w = -Math.atan2(B[0] - F[0], B[1] - F[1])) : w = D = i[1] > e[1] ? 0 : Math.PI, t.save(), t.translate(M[0], M[1]), t.rotate(D), t.beginPath(), t.moveTo(-5, -3), t.lineTo(0, 7), t.lineTo(5, -3), t.fill(), t.restore(), t.save(), t.translate(F[0], F[1]), t.rotate(w), t.beginPath(), t.moveTo(-5, -3), t.lineTo(0, 7), t.lineTo(5, -3), t.fill(), t.restore();
      }
      t.beginPath(), t.arc(O[0], O[1], 5, 0, Math.PI * 2), t.fill();
    }
    if (r) {
      t.fillStyle = a;
      for (var d = 0; d < 5; ++d) {
        var L = (u.getTime() * 1e-3 + d * 0.2) % 1, O = this.computeConnectionPoint(
          e,
          i,
          L,
          l,
          o
        );
        t.beginPath(), t.arc(O[0], O[1], 5, 0, 2 * Math.PI), t.fill();
      }
    }
  }
  computeConnectionPoint(t, e, i, n = k.RIGHT, s = k.LEFT) {
    var r = u.distance(t, e), a = t, l = [t[0], t[1]], o = [e[0], e[1]], h = e;
    switch (n) {
      case k.LEFT:
        l[0] += r * -0.25;
        break;
      case k.RIGHT:
        l[0] += r * 0.25;
        break;
      case k.UP:
        l[1] += r * -0.25;
        break;
      case k.DOWN:
        l[1] += r * 0.25;
        break;
    }
    switch (s) {
      case k.LEFT:
        o[0] += r * -0.25;
        break;
      case k.RIGHT:
        o[0] += r * 0.25;
        break;
      case k.UP:
        o[1] += r * -0.25;
        break;
      case k.DOWN:
        o[1] += r * 0.25;
        break;
    }
    var p = (1 - i) * (1 - i) * (1 - i), d = 3 * ((1 - i) * (1 - i)) * i, c = 3 * (1 - i) * (i * i), _ = i * i * i, f = p * a[0] + d * l[0] + c * o[0] + _ * h[0], g = p * a[1] + d * l[1] + c * o[1] + _ * h[1];
    return [f, g];
  }
  drawExecutionOrder(t) {
    t.shadowColor = "transparent", t.globalAlpha = 0.25, t.textAlign = "center", t.strokeStyle = "white", t.globalAlpha = 0.75;
    for (var e = this.visible_nodes, i = 0; i < e.length; ++i) {
      var n = e[i];
      t.fillStyle = "black", t.fillRect(
        n.pos[0] - u.NODE_TITLE_HEIGHT,
        n.pos[1] - u.NODE_TITLE_HEIGHT,
        u.NODE_TITLE_HEIGHT,
        u.NODE_TITLE_HEIGHT
      ), n.order == 0 && t.strokeRect(
        n.pos[0] - u.NODE_TITLE_HEIGHT + 0.5,
        n.pos[1] - u.NODE_TITLE_HEIGHT + 0.5,
        u.NODE_TITLE_HEIGHT,
        u.NODE_TITLE_HEIGHT
      ), t.fillStyle = "#FFF", t.fillText(
        "" + n.order,
        n.pos[0] + u.NODE_TITLE_HEIGHT * -0.5,
        n.pos[1] - 6
      );
    }
    t.globalAlpha = 1;
  }
  /** draws the widgets stored inside a node */
  drawNodeWidgets(t, e, i, n) {
    if (!(!t.widgets || !t.widgets.length)) {
      var s = t.size[0], r = t.widgets;
      e += 2;
      var a = u.NODE_WIDGET_HEIGHT, l = this.ds.scale > 0.5;
      i.save(), i.globalAlpha = this.editor_alpha;
      for (var o = u.WIDGET_OUTLINE_COLOR, h = u.WIDGET_BGCOLOR, p = u.WIDGET_TEXT_COLOR, d = u.WIDGET_SECONDARY_TEXT_COLOR, c = 15, _ = 0; _ < r.length; ++_) {
        var f = r[_], g = e;
        f.y && (g = f.y), f.last_y = g, i.strokeStyle = o, i.fillStyle = "#222", i.textAlign = "left", f.disabled && (i.globalAlpha *= 0.5);
        var m = f.width || s;
        switch (f.type) {
          case "button":
            f.clicked && (i.fillStyle = "#AAA", f.clicked = !1, this.dirty_canvas = !0), i.fillRect(c, g, m - c * 2, a), l && !f.disabled && !u.ignore_all_widget_events && i.strokeRect(c, g, m - c * 2, a), l && (i.textAlign = "center", i.fillStyle = p, i.fillText(f.name, m * 0.5, g + a * 0.7));
            break;
          case "toggle":
            i.textAlign = "left", i.strokeStyle = o, i.fillStyle = h, i.beginPath(), l ? i.roundRect(c, g, m - c * 2, a, [a * 0.5]) : i.rect(c, g, m - c * 2, a), i.fill(), l && !f.disabled && !u.ignore_all_widget_events && i.stroke(), i.fillStyle = f.value ? "#89A" : "#333", i.beginPath(), i.arc(m - c * 2, g + a * 0.5, a * 0.36, 0, Math.PI * 2), i.fill(), l && (i.fillStyle = d, f.name != null && i.fillText(f.name, c * 2, g + a * 0.7), i.fillStyle = f.value ? p : d, i.textAlign = "right", i.fillText(
              f.value ? f.options.on || "true" : f.options.off || "false",
              m - 40,
              g + a * 0.7
            ));
            break;
          case "slider":
            i.fillStyle = h, i.fillRect(c, g, m - c * 2, a);
            var y = f.options.max - f.options.min, E = (f.value - f.options.min) / y;
            if (i.fillStyle = n == f ? "#89A" : "#678", i.fillRect(c, g, E * (m - c * 2), a), l && !f.disabled && i.strokeRect(c, g, m - c * 2, a), f.marker) {
              var v = (+f.marker - f.options.min) / y;
              i.fillStyle = "#AA9", i.fillRect(c + v * (m - c * 2), g, 2, a);
            }
            l && (i.textAlign = "center", i.fillStyle = p, i.fillText(
              f.name + "  " + Number(f.value).toFixed(3),
              m * 0.5,
              g + a * 0.7
            ));
            break;
          case "number":
          case "combo":
            if (i.textAlign = "left", i.strokeStyle = o, i.fillStyle = h, i.beginPath(), l ? i.roundRect(c, g, m - c * 2, a, [a * 0.5]) : i.rect(c, g, m - c * 2, a), i.fill(), l)
              if (!f.disabled && !u.ignore_all_widget_events && i.stroke(), i.fillStyle = p, !f.disabled && !u.ignore_all_widget_events && (i.beginPath(), i.moveTo(c + 16, g + 5), i.lineTo(c + 6, g + a * 0.5), i.lineTo(c + 16, g + a - 5), i.fill(), i.beginPath(), i.moveTo(m - c - 16, g + 5), i.lineTo(m - c - 6, g + a * 0.5), i.lineTo(m - c - 16, g + a - 5), i.fill()), i.fillStyle = d, i.fillText(f.name, c * 2 + 5, g + a * 0.7), i.fillStyle = p, i.textAlign = "right", f.type == "number")
                i.fillText(
                  Number(f.value).toFixed(
                    f.options.precision !== void 0 ? f.options.precision : 3
                  ),
                  m - c * 2 - 20,
                  g + a * 0.7
                );
              else {
                var b = f.value;
                if (f.options.values) {
                  var C = f.options.values;
                  C.constructor === Function && (C = C()), C && C.constructor !== Array && (b = C[f.value]);
                }
                i.fillText(
                  b,
                  m - c * 2 - 20,
                  g + a * 0.7
                );
              }
            break;
          case "string":
          case "text":
            i.textAlign = "left", i.strokeStyle = o, i.fillStyle = h, i.beginPath(), l ? i.roundRect(c, g, m - c * 2, a, [a * 0.5]) : i.rect(c, g, m - c * 2, a), i.fill(), l && (f.disabled || i.stroke(), i.save(), i.beginPath(), i.rect(c, g, m - c * 2, a), i.clip(), i.fillStyle = d, f.name != null && i.fillText(f.name, c * 2, g + a * 0.7), i.fillStyle = p, i.textAlign = "right", i.fillText(String(f.value).substr(0, 30), m - c * 2, g + a * 0.7), i.restore());
            break;
          default:
            f.draw && f.draw(i, t, m, g, a);
            break;
        }
        e += (f.computeSize ? f.computeSize(m)[1] : a) + 4, i.globalAlpha = this.editor_alpha;
      }
      i.restore(), i.textAlign = "left";
    }
  }
};
let H = $;
H.temp = new Float32Array(4);
H.temp_vec2 = new Float32Array(2);
H.tmp_area = new Float32Array(4);
H.margin_area = new Float32Array(4);
H.link_bounding = new Float32Array(4);
H.tempA = [0, 0];
H.tempB = [0, 0];
class pe {
  constructor(e = "Group") {
    this.fontSize = u.DEFAULT_GROUP_FONT_SIZE, this._nodes = [], this.graph = null, this._bounding = new Float32Array([10, 10, 140, 80]), this.title = e, this.color = T.node_colors.pale_blue ? T.node_colors.pale_blue.groupcolor : "#AAA", this._pos = this._bounding.subarray(0, 2), this._size = this._bounding.subarray(2, 4);
  }
  get bounding() {
    return this._bounding;
  }
  get pos() {
    return [this._pos[0], this._pos[1]];
  }
  set pos(e) {
    !e || e.length < 2 || (this._pos[0] = e[0], this._pos[1] = e[1]);
  }
  get size() {
    return [this._size[0], this._size[1]];
  }
  set size(e) {
    !e || e.length < 2 || (this._size[0] = Math.max(140, e[0]), this._size[1] = Math.max(80, e[1]));
  }
  configure(e) {
    e.bounding, this.title = e.title, this._bounding.set(e.bounding), this.color = e.color, this.font = e.font;
  }
  serialize() {
    const e = this._bounding;
    return {
      title: this.title,
      bounding: [
        Math.round(e[0]),
        Math.round(e[1]),
        Math.round(e[2]),
        Math.round(e[3])
      ],
      color: this.color,
      font: this.font
    };
  }
  move(e, i, n) {
    if (this._pos[0] += e, this._pos[1] += i, !n)
      for (var s = 0; s < this._nodes.length; ++s) {
        var r = this._nodes[s];
        r.pos[0] += e, r.pos[1] += i;
      }
  }
  recomputeInsideNodes() {
    this._nodes.length = 0;
    for (var e = this.graph._nodes, i = new Float32Array(4), n = 0; n < e.length; ++n) {
      var s = e[n];
      s.getBounding(i), u.overlapBounding(this._bounding, i) && this._nodes.push(s);
    }
  }
  /** checks if a point is inside the shape of a node */
  isPointInside(e, i, n = 0, s = !1) {
    var r = this.graph && this.graph.isLive() ? 0 : u.NODE_TITLE_HEIGHT;
    return s && (r = 0), this.pos[0] - 4 - n < e && this.pos[0] + this.size[0] + 4 + n > e && this.pos[1] - r - n < i && this.pos[1] + this.size[1] + n > i;
  }
  /** Forces to redraw or the main canvas (LGraphNode) or the bg canvas (links) */
  setDirtyCanvas(e, i = !1) {
    this.graph && this.graph.sendActionToCanvas("setDirty", [e, i]);
  }
}
class N {
  static onMenuCollapseAll() {
  }
  static onMenuNodeEdit() {
  }
  // refactor: there are different dialogs, some uses createDialog some dont
  prompt(e = "", i, n, s, r = !1) {
    var a = this, l = document.createElement("div");
    l.is_modified = !1, l.className = "graphdialog rounded", r ? l.innerHTML = `
<span class='name'></span>
<textarea autofocus class='value'></textarea>
<button class='rounded'>OK</button>
` : l.innerHTML = `
<span class='name'></span>
<input autofocus type='text' class='value'/>
<button class='rounded'>OK</button>`, l.close = function() {
      a.prompt_box = null, l.parentNode && l.parentNode.removeChild(l);
    };
    var o = T.active_canvas, h = o.canvas;
    h.parentNode.appendChild(l), this.ds.scale > 1 && (l.style.transform = "scale(" + this.ds.scale + ")");
    var p = null, d = 0;
    u.pointerListenerAdd(l, "leave", function(b) {
      d || u.dialog_close_on_mouse_leave && !l.is_modified && u.dialog_close_on_mouse_leave && (p = setTimeout(l.close, u.dialog_close_on_mouse_leave_delay));
    }), u.pointerListenerAdd(l, "enter", function(b) {
      u.dialog_close_on_mouse_leave && p && clearTimeout(p);
    });
    var c = l.querySelectorAll("select");
    c && c.forEach(function(b) {
      b.addEventListener("click", function(C) {
        d++;
      }), b.addEventListener("blur", function(C) {
        d = 0;
      }), b.addEventListener("change", function(C) {
        d = -1;
      });
    }), a.prompt_box && a.prompt_box.close(), a.prompt_box = l;
    var _ = l.querySelector(".name");
    _.innerText = e;
    let f = l.querySelector(".value");
    f.value = i;
    var g = f;
    g.addEventListener("keydown", function(b) {
      if (l.is_modified = !0, b.keyCode == 27)
        l.close();
      else if (b.keyCode == 13 && b.target instanceof Element && b.target.localName != "textarea")
        n && n(this.value), l.close();
      else
        return;
      b.preventDefault(), b.stopPropagation();
    });
    var m = l.querySelector("button");
    m.addEventListener("click", function(b) {
      n && n(g.value), a.setDirty(!0), l.close();
    });
    var y = h.getBoundingClientRect(), E = -20, v = -20;
    return y && (E -= y.left, v -= y.top), s ? (l.style.left = s.clientX + E + "px", l.style.top = s.clientY + v + "px") : (l.style.left = h.width * 0.5 + E + "px", l.style.top = h.height * 0.5 + v + "px"), setTimeout(function() {
      g.focus();
    }, 10), l;
  }
  showSearchBox(e, i = {}) {
    var n = {
      slotFrom: null,
      node_from: null,
      node_to: null,
      do_type_filter: u.search_filter_enabled,
      type_filter_in: null,
      type_filter_out: null,
      show_general_if_none_on_typefilter: !0,
      show_general_after_typefiltered: !0,
      hide_on_mouse_leave: u.search_hide_on_mouse_leave,
      show_all_if_empty: !0,
      show_all_on_open: u.search_show_all_on_open
    };
    i = Object.assign(n, i);
    var s = this, r = T.active_canvas, a = r.canvas, l = a.ownerDocument || document;
    let o = e;
    var h = document.createElement("div");
    if (h.className = "litegraph litesearchbox graphdialog rounded", h.innerHTML = "<span class='name'>Search</span> <input autofocus type='text' class='value rounded'/>", i.do_type_filter && (h.innerHTML += "<select class='slot_in_type_filter'><option value=''></option></select>", h.innerHTML += "<select class='slot_out_type_filter'><option value=''></option></select>"), h.innerHTML += "<div class='helper'></div>", l.fullscreenElement ? l.fullscreenElement.appendChild(h) : (l.body.appendChild(h), l.body.style.overflow = "hidden"), i.do_type_filter)
      var p = h.querySelector(".slot_in_type_filter"), d = h.querySelector(".slot_out_type_filter");
    if (h.close = function() {
      s.search_box = null, this.blur(), a.focus(), l.body.style.overflow = "", setTimeout(function() {
        s.canvas.focus();
      }, 20), h.parentNode && h.parentNode.removeChild(h);
    }, this.ds.scale > 1 && (h.style.transform = "scale(" + this.ds.scale + ")"), i.hide_on_mouse_leave) {
      var c = 0, _ = null;
      u.pointerListenerAdd(h, "enter", function(L) {
        _ && (clearTimeout(_), _ = null);
      }), u.pointerListenerAdd(h, "leave", function(L) {
        c || (_ = setTimeout(function() {
          h.close();
        }, 500));
      }), i.do_type_filter && (p.addEventListener("click", function(L) {
        c++;
      }), p.addEventListener("blur", function(L) {
        c = 0;
      }), p.addEventListener("change", function(L) {
        c = -1;
      }), d.addEventListener("click", function(L) {
        c++;
      }), d.addEventListener("blur", function(L) {
        c = 0;
      }), d.addEventListener("change", function(L) {
        c = -1;
      }));
    }
    s.search_box && s.search_box.close(), s.search_box = h;
    var f = h.querySelector(".helper"), g = null, m = null, y = null, E = h.querySelector("input");
    if (E && (E.addEventListener("blur", function(L) {
      this.focus();
    }), E.addEventListener("keydown", function(L) {
      if (L.keyCode == 38)
        D(!1);
      else if (L.keyCode == 40)
        D(!0);
      else if (L.keyCode == 27)
        h.close();
      else if (L.keyCode == 13)
        y ? B(y.innerHTML) : g ? B(g) : h.close();
      else {
        m && clearInterval(m), m = setTimeout(w, 250);
        return;
      }
      return L.preventDefault(), L.stopPropagation(), L.stopImmediatePropagation(), !0;
    })), i.do_type_filter) {
      if (p) {
        var v = u.slot_types_in, b = v.length;
        (i.type_filter_in == A.EVENT || i.type_filter_in == A.ACTION) && (i.type_filter_in = "_event_");
        for (var C = 0; C < b; C++) {
          var O = document.createElement("option");
          O.value = v[C], O.innerHTML = v[C], p.appendChild(O), i.type_filter_in !== null && (i.type_filter_in + "").toLowerCase() == (v[C] + "").toLowerCase() && (O.selected = !0);
        }
        p.addEventListener("change", function() {
          w();
        });
      }
      if (d) {
        var v = u.slot_types_out, b = v.length;
        (i.type_filter_out == A.EVENT || i.type_filter_out == A.ACTION) && (i.type_filter_out = "_event_");
        for (var C = 0; C < b; C++) {
          var O = document.createElement("option");
          O.value = v[C], O.innerHTML = v[C], d.appendChild(O), i.type_filter_out !== null && (i.type_filter_out + "").toLowerCase() == (v[C] + "").toLowerCase() && (O.selected = !0);
        }
        d.addEventListener("change", function() {
          w();
        });
      }
    }
    var M = a.getBoundingClientRect(), G = (o ? o.clientX : M.left + M.width * 0.5) - 80, F = (o ? o.clientY : M.top + M.height * 0.5) - 20;
    h.style.left = G + "px", h.style.top = F + "px", o.layerY > M.height - 200 && (f.style.maxHeight = M.height - o.layerY - 20 + "px"), E.focus(), i.show_all_on_open && w();
    function B(L) {
      if (L)
        if (s.onSearchBoxSelection)
          s.onSearchBoxSelection(L, o, r);
        else {
          var P = u.searchbox_extras[L.toLowerCase()];
          P && (L = P.type), r.graph.beforeChange();
          var z = u.createNode(L);
          if (z && (z.pos = r.convertEventToCanvasOffset(
            o
          ), r.graph.add(z)), P && P.data) {
            if (P.data.properties)
              for (var K in P.data.properties)
                z.addProperty("" + K, P.data.properties[K]);
            if (P.data.inputs) {
              z.inputs = [];
              for (var K in P.data.inputs)
                z.addInput(
                  P.data.inputs[K][0],
                  P.data.inputs[K][1]
                );
            }
            if (P.data.outputs) {
              z.outputs = [];
              for (var K in P.data.outputs)
                z.addOutput(
                  P.data.outputs[K][0],
                  P.data.outputs[K][1]
                );
            }
            P.data.title && (z.title = P.data.title), P.data.json && z.configure(P.data.json);
          }
          if (i.node_from) {
            var R = null;
            switch (typeof i.slotFrom) {
              case "string":
                R = i.node_from.findOutputSlotIndexByName(i.slotFrom);
                break;
              case "object":
                i.slotFrom.name ? R = i.node_from.findOutputSlotIndexByName(i.slotFrom.name) : R = -1, R == -1 && typeof i.slotFrom.slot_index < "u" && (R = i.slotFrom.slot_index);
                break;
              case "number":
                R = i.slotFrom;
                break;
              default:
                R = 0;
            }
            R = R, typeof i.node_from.outputs[R] !== void 0 && R !== null && R > -1 && i.node_from.connectByTypeInput(R, z, i.node_from.outputs[R].type);
          }
          if (i.node_to) {
            var R = null;
            switch (typeof i.slotFrom) {
              case "string":
                R = i.node_to.findInputSlotIndexByName(i.slotFrom);
                break;
              case "number":
                R = i.slotFrom;
                break;
              default:
                R = 0;
            }
            typeof i.node_to.inputs[R] !== void 0 && R !== null && R > -1 && i.node_to.connectByTypeOutput(R, z, i.node_to.inputs[R].type);
          }
          r.graph.afterChange();
        }
      h.close();
    }
    function D(L) {
      var P = y;
      y && y.classList.remove("selected"), y ? (y = L ? y.nextSibling : y.previousSibling, y || (y = P)) : y = L ? f.childNodes[0] : f.childNodes[f.childNodes.length], y && (y.classList.add("selected"), y.scrollIntoView({ block: "end", behavior: "smooth" }));
    }
    function w() {
      m = null;
      var L = E.value;
      if (g = null, f.innerHTML = "", !L && !i.show_all_if_empty)
        return;
      if (s.onSearchBox) {
        var P = s.onSearchBox(f, L, r);
        if (P)
          for (var z = 0; z < P.length; ++z)
            ae(P[z]);
      } else {
        let Q = function(V, q = {}) {
          var Ie = {
            skipFilter: !1,
            inTypeOverride: null,
            outTypeOverride: null
          }, oe = Object.assign(Ie, q), ke = u.registered_node_types[V];
          if (R && ke.filter != R || (!i.show_all_if_empty || L) && V.toLowerCase().indexOf(L) === -1)
            return !1;
          if (i.do_type_filter && !oe.skipFilter) {
            var me = V, Z = Y == null ? void 0 : Y.value;
            if (oe.inTypeOverride !== !1 && (Z = oe.inTypeOverride), Y && Z && u.registered_slot_in_types[Z] && u.registered_slot_in_types[Z].nodes) {
              var fe = u.registered_slot_in_types[Z].nodes.includes(me);
              if (fe === !1)
                return !1;
            }
            var Z = U == null ? void 0 : U.value;
            if (oe.outTypeOverride !== !1 && (Z = oe.outTypeOverride), U && Z && u.registered_slot_out_types[Z] && u.registered_slot_out_types[Z].nodes) {
              var fe = u.registered_slot_out_types[Z].nodes.includes(me);
              if (fe === !1)
                return !1;
            }
          }
          return !0;
        };
        var K = 0;
        L = L.toLowerCase();
        var R = r.filter || r.graph.filter;
        let Y, U;
        i.do_type_filter && s.search_box ? (Y = s.search_box.querySelector(".slot_in_type_filter"), U = s.search_box.querySelector(".slot_out_type_filter")) : (Y = null, U = null);
        for (const V in u.searchbox_extras) {
          var J = u.searchbox_extras[V];
          if (!((!i.show_all_if_empty || L) && J.desc.toLowerCase().indexOf(L) === -1)) {
            var ve = u.registered_node_types[J.type];
            if (!(ve && ve.filter != R) && Q(J.type) && (ae(J.desc, "searchbox_extra"), T.search_limit !== -1 && K++ > T.search_limit))
              break;
          }
        }
        var re = null;
        if (Array.prototype.filter)
          var Ne = Object.keys(u.registered_node_types), re = Ne.filter((q) => Q(q));
        else {
          re = [];
          for (const V in u.registered_node_types)
            Q(V) && re.push(V);
        }
        for (var z = 0; z < re.length && (ae(re[z]), !(T.search_limit !== -1 && K++ > T.search_limit)); z++)
          ;
        if (i.show_general_after_typefiltered && (Y != null && Y.value || U != null && U.value)) {
          let V = [];
          for (const q in u.registered_node_types)
            Q(q, { inTypeOverride: Y && Y.value ? "*" : null, outTypeOverride: U && U.value ? "*" : null }) && V.push(q);
          for (let q = 0; q < V.length && (ae(V[q], "generic_type"), !(T.search_limit !== -1 && K++ > T.search_limit)); q++)
            ;
        }
        if ((Y != null && Y.value || U != null && U.value) && (f == null ? void 0 : f.childNodes.length) == 0 && i.show_general_if_none_on_typefilter) {
          let V = [];
          for (const q in u.registered_node_types)
            Q(q, { skipFilter: !0 }) && V.push(q);
          for (let q = 0; q < V.length && (ae(V[q], "not_in_filter"), !(T.search_limit !== -1 && K++ > T.search_limit)); q++)
            ;
        }
      }
      function ae(Q, Y) {
        var U = document.createElement("div");
        g || (g = Q), U.innerText = Q, U.dataset.type = escape(Q), U.className = "litegraph lite-search-item", Y && (U.className += " " + Y), U.addEventListener("click", function(V) {
          B(unescape(this.dataset.type));
        }), f.appendChild(U);
      }
    }
    return h;
  }
  showShowNodePanel(e) {
    this.closePanels();
    var i = this.getCanvasWindow(), n = this, s = this.createPanel(e.title || "", {
      closable: !0,
      window: i,
      onOpen: function() {
      },
      onClose: function() {
        n.node_panel = null;
      }
    });
    n.node_panel = s, s.id = "node-panel", s.node = e, s.classList.add("settings");
    function r() {
      s.content.innerHTML = "", s.addHTML("<span class='node_type'>" + e.type + "</span><span class='node_desc'>" + (e.constructor.desc || "") + "</span><span class='separator'></span>"), s.addHTML("<h3>Properties</h3>");
      var a = function(d, c) {
        switch (n.graph.beforeChange(e), d) {
          case "Title":
            e.title = c;
            break;
          case "Mode":
            var _ = Object.values(ie).indexOf(c);
            _ >= j.ALWAYS && ie[_] ? e.changeMode(_) : console.warn("unexpected mode: " + c);
            break;
          case "Color":
            T.node_colors[c] ? (e.color = T.node_colors[c].color, e.bgColor = T.node_colors[c].bgColor) : console.warn("unexpected color: " + c);
            break;
          default:
            e.setProperty(d, c);
            break;
        }
        n.graph.afterChange(), n.dirty_canvas = !0;
      };
      s.addWidget("string", "Title", e.title, {}, a), s.addWidget("combo", "Mode", ie[e.mode], { values: ie }, a);
      var l = "";
      e.color !== void 0 && (l = Object.keys(T.node_colors).filter(function(d) {
        return T.node_colors[d].color == e.color;
      })[0]), s.addWidget("combo", "Color", l, { values: Object.keys(T.node_colors) }, a);
      for (var o in e.properties) {
        var h = e.properties[o], p = e.getPropertyInfo(o);
        p.type, !(e.onAddPropertyToPanel && e.onAddPropertyToPanel(o, s)) && s.addWidget(p.widget || p.type, o, h, p, a);
      }
      s.addSeparator(), e.onShowCustomPanelInfo && e.onShowCustomPanelInfo(s), s.footer.innerHTML = "", s.addButton("Delete", function() {
        e.block_delete || (e.graph.remove(e), s.close());
      }).classList.add("delete");
    }
    s.inner_showCodePad = function(a) {
      s.classList.remove("settings"), s.classList.add("centered"), s.alt_content.innerHTML = "<textarea class='code'></textarea>";
      var l = s.alt_content.querySelector("textarea"), o = function() {
        s.toggleAltContent(!1), s.toggleFooterVisibility(!0), l.parentNode.removeChild(l), s.classList.add("settings"), s.classList.remove("centered"), r();
      };
      l.value = e.properties[a], l.addEventListener("keydown", function(d) {
        d.code == "Enter" && d.ctrlKey && (e.setProperty(a, l.value), o());
      }), s.toggleAltContent(!0), s.toggleFooterVisibility(!1), l.style.height = "calc(100% - 40px)";
      var h = s.addButton("Assign", function() {
        e.setProperty(a, l.value), o();
      });
      s.alt_content.appendChild(h);
      var p = s.addButton("Close", o);
      p.style.float = "right", s.alt_content.appendChild(p);
    }, r(), this.canvas.parentNode.appendChild(s);
  }
  showSubgraphPropertiesDialog(e) {
    console.log("showing subgraph properties dialog");
    var i = this.canvas.parentNode.querySelector(".subgraph_dialog");
    i && i.close();
    var n = this.createPanel("Subgraph Inputs", { closable: !0, width: 500 });
    n.node = e, n.classList.add("subgraph_dialog");
    function s() {
      if (n.clear(), e.inputs)
        for (var l = 0; l < e.inputs.length; ++l) {
          var o = e.inputs[l];
          if (!o.not_subgraph_input) {
            var h = `
<button>&#10005;</button>
<span class='bullet_icon'></span>
<span class='name'></span>
<span class='type'></span>`, p = n.addHTML(h, "subgraph_property");
            p.dataset.name = o.name, p.dataset.slot = "" + l, p.querySelector(".name").innerText = o.name, p.querySelector(".type").innerText = "" + o.type, p.querySelector("button").addEventListener("click", function(d) {
              e.removeInput(Number(this.parentNode.dataset.slot)), s();
            });
          }
        }
    }
    var r = `
+
<span class='label'>Name</span>
<input class='name'/>
<span class='label'>Type</span>
<input class='type'></input>
<button>+</button>`, a = n.addHTML(r, "subgraph_property extra", !0);
    return a.querySelector("button").addEventListener("click", function(l) {
      var o = this.parentNode, h = o.querySelector(".name").value, p = o.querySelector(".type").value;
      !h || e.findInputSlotIndexByName(h) != -1 || (e.addInput(h, p), o.querySelector(".name").value = "", o.querySelector(".type").value = "", s());
    }), s(), this.canvas.parentNode.appendChild(n), n;
  }
  showSubgraphPropertiesDialogRight(e) {
    var i = this.canvas.parentNode.querySelector(".subgraph_dialog");
    i && i.close();
    var n = this.createPanel("Subgraph Outputs", { closable: !0, width: 500 });
    n.node = e, n.classList.add("subgraph_dialog");
    function s() {
      if (n.clear(), e.outputs)
        for (var o = 0; o < e.outputs.length; ++o) {
          var h = e.outputs[o];
          if (!h.not_subgraph_output) {
            var p = `
<button>&#10005;</button>
<span class='bullet_icon'></span>
<span class='name'></span>
<span class='type'></span>`, d = n.addHTML(p, "subgraph_property");
            d.dataset.name = h.name, d.dataset.slot = "" + o, d.querySelector(".name").innerText = h.name, d.querySelector(".type").innerText = "" + h.type, d.querySelector("button").addEventListener("click", function(c) {
              e.removeOutput(Number(this.parentNode.dataset.slot)), s();
            });
          }
        }
    }
    var r = `
+
<span class='label'>Name</span>
<input class='name'/>
<span class='label'>Type</span>
<input class='type'></input>
<button>+</button>`, a = n.addHTML(r, "subgraph_property extra", !0);
    a.querySelector(".name").addEventListener("keydown", function(o) {
      o.keyCode == 13 && l.apply(this);
    }), a.querySelector("button").addEventListener("click", function(o) {
      l.apply(this);
    });
    function l() {
      var o = this.parentNode, h = o.querySelector(".name").value, p = o.querySelector(".type").value;
      !h || e.findOutputSlotIndexByName(h) != -1 || (e.addOutput(h, p), o.querySelector(".name").value = "", o.querySelector(".type").value = "", s());
    }
    return s(), this.canvas.parentNode.appendChild(n), n;
  }
  showConnectionMenu(e = {}) {
    var i = this, n = e.nodeFrom && e.slotFrom, s = !n && e.nodeTo && e.slotTo;
    if (!n && !s)
      return console.warn("No data passed to showConnectionMenu"), !1;
    var r = n ? e.nodeFrom : e.nodeTo, a = n ? e.slotFrom : e.slotTo, l = null;
    switch (typeof a) {
      case "string":
        l = n ? r.findOutputSlotIndexByName(a) : r.findInputSlotIndexByName(a), a = n ? r.outputs[a] : r.inputs[a];
        break;
      case "object":
        l = n ? r.findOutputSlotIndexByName(a.name) : r.findInputSlotIndexByName(a.name);
        break;
      case "number":
        l = a, a = n ? r.outputs[a] : r.inputs[a];
        break;
      default:
        return console.warn("Cant get slot information " + a), !1;
    }
    a = a;
    var o = [{ content: "Add Node" }, x.SEPARATOR];
    i.allow_searchbox && (o.push({ content: "Search" }), o.push(x.SEPARATOR));
    var h = a.type == A.EVENT ? "_event_" : a.type, p = n ? u.slot_types_default_out : u.slot_types_default_in;
    const d = p[h];
    if (p && p[h])
      if (Array.isArray(d))
        for (var c of d)
          o.push({ content: d[c] });
      else
        typeof d == "object" ? o.push({ content: d.node }) : o.push({ content: d });
    var _ = new X(o, {
      event: e.e,
      title: (a && a.name != "" ? a.name + (h ? " | " : "") : "") + (a && h ? h : ""),
      callback: f
    });
    function f(g, m, y) {
      switch (g.content) {
        case "Add Node":
          T.onMenuAdd(g, m, y, _, function(v) {
            n ? e.nodeFrom.connectByTypeInput(l, v, h) : e.nodeTo.connectByTypeOutput(l, v, h);
          });
          break;
        case "Search":
          n ? i.showSearchBox(y, { node_from: e.nodeFrom, slotFrom: a, type_filter_in: h }) : i.showSearchBox(y, { node_to: e.nodeTo, slotFrom: a, type_filter_out: h });
          break;
        default:
          const E = Object.assign(e, {
            position: [e.e.canvasX, e.e.canvasY]
          });
          i.createDefaultNodeForSlot(g.content, E);
          break;
      }
    }
    return !1;
  }
  showLinkMenu(e, i) {
    var n = this, s = n.graph.getNodeById(e.origin_id), r = n.graph.getNodeById(e.target_id), a = null;
    s && s.outputs && s.outputs[e.origin_slot] && (a = s.outputs[e.origin_slot].type);
    var l = null;
    r && r.outputs && r.outputs[e.target_slot] && (l = r.inputs[e.target_slot].type);
    var o = ["Add Node", x.SEPARATOR, "Delete", x.SEPARATOR], h = new X(o, {
      event: i,
      title: e.data != null ? e.data.constructor.name : null,
      callback: p
    });
    function p(d, c, _) {
      switch (d.content) {
        case "Add Node":
          T.onMenuAdd(null, null, _, h, function(f) {
            !f.inputs || !f.inputs.length || !f.outputs || !f.outputs.length || s.connectByTypeInput(e.origin_slot, f, a) && (f.connectByTypeInput(e.target_slot, r, l), f.pos[0] -= f.size[0] * 0.5);
          });
          break;
        case "Delete":
          n.graph.removeLink(e.id);
          break;
      }
    }
    return !1;
  }
  /*
   * Shows a popup for editing one of the LGraphNode.properties.
   */
  showEditPropertyValue(e, i, n) {
    if (!e || e.properties[i] === void 0 || u.ignore_all_widget_events)
      return;
    n = n || {};
    var s = e.getPropertyInfo(i), r = s.type, a = "";
    if (r == "string" || r == "number" || r == "array" || r == "object")
      a = "<input autofocus type='text' class='value'/>";
    else if ((r == "enum" || r == "combo") && s.values) {
      a = "<select autofocus type='text' class='value'>";
      for (var l in s.values) {
        var o = l;
        s.values instanceof Array && (o = s.values[l]), a += "<option value='" + o + "' " + (o == e.properties[i] ? "selected" : "") + ">" + s.values[l] + "</option>";
      }
      a += "</select>";
    } else if (r == "boolean" || r == "toggle")
      a = "<input autofocus type='checkbox' class='value' " + (e.properties[i] ? "checked" : "") + "/>";
    else {
      console.warn("unknown type: " + r);
      return;
    }
    var h = this.createDialog(
      "<span class='name'>" + (s.label ? s.label : i) + "</span>" + a + "<button>OK</button>",
      n
    ), p = null;
    if ((r == "enum" || r == "combo") && s.values)
      p = h.querySelector("select"), p.addEventListener("change", function(f) {
        h.modified(), c(f.target.value);
      });
    else if (r == "boolean" || r == "toggle")
      p = h.querySelector("input"), p && p.addEventListener("click", function(f) {
        h.modified(), c(!!p.checked);
      });
    else if (p = h.querySelector("input"), p) {
      p.addEventListener("blur", function(g) {
        this.focus();
      });
      let f = e.properties[i] !== void 0 ? e.properties[i] : "";
      r !== "string" && (f = JSON.stringify(f)), p.value = f, p.addEventListener("keydown", function(g) {
        if (g.keyCode == 27)
          h.close();
        else if (g.keyCode == 13)
          d();
        else if (g.keyCode != 13) {
          h.modified();
          return;
        }
        g.preventDefault(), g.stopPropagation();
      });
    }
    p && p.focus();
    const d = () => {
      c(p.value);
    }, c = (f) => {
      s && s.values && s.values.constructor === Object && s.values[f] != null && (f = s.values[f]), typeof e.properties[i] == "number" && (f = Number(f)), (r == "array" || r == "object") && (f = JSON.parse(f)), e.setProperty(i, f), n.onclose && n.onclose(), h.close(), e.setDirtyCanvas(!0, !0);
    };
    var _ = h.querySelector("button");
    return _.addEventListener("click", d), h;
  }
  // TODO refactor, theer are different dialog, some uses createDialog, some dont
  createDialog(e, i) {
    var n = { checkForInput: !1, closeOnLeave: !0, closeOnLeave_checkModified: !0 };
    i = Object.assign(n, i || {});
    var s = document.createElement("div");
    s.className = "graphdialog", s.innerHTML = e, s.is_modified = !1;
    var r = this.canvas.getBoundingClientRect(), a = -20, l = -20;
    if (r && (a -= r.left, l -= r.top), i.position ? (a += i.position[0], l += i.position[1]) : i.event ? (a += i.event.clientX, l += i.event.clientY) : (a += this.canvas.width * 0.5, l += this.canvas.height * 0.5), s.style.left = a + "px", s.style.top = l + "px", this.canvas.parentNode.appendChild(s), i.checkForInput) {
      var o = s.querySelectorAll("input"), h = !1;
      o && o.forEach(function(_) {
        _.addEventListener("keydown", function(f) {
          if (s.modified(), f.keyCode == 27)
            s.close();
          else if (f.keyCode != 13)
            return;
          f.preventDefault(), f.stopPropagation();
        }), h || _.focus();
      });
    }
    s.modified = function() {
      s.is_modified = !0;
    }, s.close = function() {
      s.parentNode && s.parentNode.removeChild(s);
    };
    var p = null, d = 0;
    s.addEventListener("mouseleave", function(_) {
      d || (i.closeOnLeave || u.dialog_close_on_mouse_leave) && !s.is_modified && u.dialog_close_on_mouse_leave && (p = setTimeout(s.close, u.dialog_close_on_mouse_leave_delay));
    }), s.addEventListener("mouseenter", function(_) {
      (i.closeOnLeave || u.dialog_close_on_mouse_leave) && p && clearTimeout(p);
    });
    var c = s.querySelectorAll("select");
    return c && c.forEach(function(_) {
      _.addEventListener("click", function(f) {
        d++;
      }), _.addEventListener("blur", function(f) {
        d = 0;
      }), _.addEventListener("change", function(f) {
        d = -1;
      });
    }), s;
  }
  getCanvasMenuOptions() {
    var e = null;
    if (this.getMenuOptions ? e = this.getMenuOptions(this) : (e = [
      {
        content: "Add Node",
        has_submenu: !0,
        callback: T.onMenuAdd
      },
      { content: "Add Group", callback: T.onGroupAdd }
      //{ content: "Arrange", callback: that.graph.arrange },
      //{content:"Collapse All", callback: LGraphCanvas.onMenuCollapseAll }
    ], this._graph_stack && this._graph_stack.length > 0 && e.push(x.SEPARATOR, {
      content: "Close subgraph",
      callback: this.closeSubgraph.bind(this)
    })), this.getExtraMenuOptions) {
      var i = this.getExtraMenuOptions(this, e);
      i && (e = e.concat(i));
    }
    return e;
  }
  getNodeMenuOptions(e) {
    let i = [];
    e.getMenuOptions ? i = e.getMenuOptions(this) : (i = [
      {
        content: "Inputs",
        has_submenu: !0,
        disabled: !0,
        callback: T.showMenuNodeOptionalInputs
      },
      {
        content: "Outputs",
        has_submenu: !0,
        disabled: !0,
        callback: T.showMenuNodeOptionalOutputs
      },
      x.SEPARATOR,
      {
        content: "Properties",
        has_submenu: !0,
        disabled: u.ignore_all_widget_events,
        callback: T.onShowMenuNodeProperties
      },
      x.SEPARATOR,
      {
        content: "Title",
        value: { name: "title", type: "string" },
        callback: T.onShowPropertyEditor
      },
      {
        content: "Mode",
        has_submenu: !0,
        callback: T.onMenuNodeMode
      }
    ], e.resizable !== !1 && i.push({
      content: "Resize",
      callback: T.onMenuResizeNode
    }), i.push(
      {
        content: "Collapse",
        callback: T.onMenuNodeCollapse
      },
      { content: "Pin", callback: T.onMenuNodePin },
      {
        content: "Colors",
        has_submenu: !0,
        callback: T.onMenuNodeColors
      },
      {
        content: "Shapes",
        has_submenu: !0,
        callback: T.onMenuNodeShapes
      },
      x.SEPARATOR
    ));
    const n = e.getOptionalSlots();
    if (n && (n.inputs && n.inputs.length > 0 && typeof i[0] == "object" && (i[0].disabled = !1), n.outputs && n.outputs.length && typeof i[1] == "object" && (i[1].disabled = !1)), e.getExtraMenuOptions) {
      var s = e.getExtraMenuOptions(this, i);
      s && (s.push(x.SEPARATOR), i = s.concat(i));
    }
    return e.clonable !== !1 && i.push({
      content: "Clone",
      callback: T.onMenuNodeClone
    }), i.push(x.SEPARATOR, {
      content: "Remove",
      disabled: !(e.removable !== !1 && !e.block_delete),
      callback: T.onMenuNodeRemove
    }), e.graph && e.graph.onGetNodeMenuOptions && (i = e.graph.onGetNodeMenuOptions(i, e)), i;
  }
  getGroupMenuOptions(e) {
    var i = [
      {
        content: "Title",
        value: { name: "title", type: "string" },
        callback: T.onShowPropertyEditor
      },
      {
        content: "Color",
        has_submenu: !0,
        callback: T.onMenuNodeColors
      },
      {
        content: "Font size",
        value: { name: "fontSize", type: "number" },
        callback: T.onShowPropertyEditor
      },
      x.SEPARATOR,
      { content: "Remove", callback: T.onMenuNodeRemove }
    ];
    return i;
  }
  /** Called when mouse right click */
  processContextMenu(e, i) {
    var n = this, s = T.active_canvas, r = s.getCanvasWindow();
    let a = i, l = null;
    var o = {
      event: a,
      callback: c,
      extra: e
    };
    e && (o.title = e.type);
    var h = null;
    if (e && (h = e.getSlotInPosition(a.canvasX, a.canvasY), T.active_node = e), h) {
      if (l = [], e.getSlotMenuOptions)
        l = e.getSlotMenuOptions(h);
      else {
        h && h.output && h.output.links && h.output.links.length && l.push({ content: "Disconnect Links", slot: h });
        var p = h.input || h.output;
        p.removable && l.push(
          p.locked ? "Cannot remove" : { content: "Remove Slot", slot: h }
        ), p.nameLocked || l.push({ content: "Rename Slot", slot: h });
      }
      o.title = (h.input ? h.input.type : h.output.type) || "*", h.input && h.input.type == A.ACTION && (o.title = "Action"), h.output && h.output.type == A.EVENT && (o.title = "Event");
    } else if (e)
      l = this.getNodeMenuOptions(e);
    else {
      l = this.getCanvasMenuOptions();
      var d = this.graph.getGroupOnPos(
        a.canvasX,
        a.canvasY
      );
      d && l.push(x.SEPARATOR, {
        content: "Edit Group",
        has_submenu: !0,
        submenu: {
          title: "Group",
          extra: d,
          options: this.getGroupMenuOptions(d)
        }
      });
    }
    if (!l)
      return;
    new X(l, o, r);
    function c(_, f, g) {
      if (_) {
        if (_.content == "Remove Slot") {
          var m = _.slot;
          e.graph.beforeChange(), m.input ? e.removeInput(m.slot) : m.output && e.removeOutput(m.slot), e.graph.afterChange();
          return;
        } else if (_.content == "Disconnect Links") {
          var m = _.slot;
          e.graph.beforeChange(), m.output ? e.disconnectOutput(m.slot) : m.input && e.disconnectInput(m.slot), e.graph.afterChange();
          return;
        } else if (_.content == "Rename Slot") {
          var m = _.slot, y = m.input ? e.getInputInfo(m.slot) : e.getOutputInfo(m.slot), E = n.createDialog(
            "<span class='name'>Name</span><input autofocus type='text'/><button>OK</button>",
            f
          ), v = E.querySelector("input");
          v && y && (v.value = y.label || "");
          var b = function() {
            e.graph.beforeChange(), v.value && (y && (y.label = v.value), n.setDirty(!0)), E.close(), e.graph.afterChange();
          };
          E.querySelector("button").addEventListener("click", b), v.addEventListener("keydown", function(O) {
            if (E.is_modified = !0, O.keyCode == 27)
              E.close();
            else if (O.keyCode == 13)
              b();
            else if (O.keyCode != 13 && O.target instanceof Element && O.target.localName != "textarea")
              return;
            O.preventDefault(), O.stopPropagation();
          }), v.focus();
        }
      }
    }
  }
  createPanel(e, i = {}) {
    var n = i.window || window, s = document.createElement("div");
    if (s.className = "litegraph dialog", s.innerHTML = `
<div class='dialog-header'><span class='dialog-title'></span></div>
<div class='dialog-content'></div>
<div style='display:none;' class='dialog-alt-content'></div>
<div class='dialog-footer'></div>`, s.header = s.querySelector(".dialog-header"), i.width && (s.style.width = i.width + (i.width.constructor === Number ? "px" : "")), i.height && (s.style.height = i.height + (i.height.constructor === Number ? "px" : "")), i.closable) {
      var r = document.createElement("span");
      r.innerHTML = "&#10005;", r.classList.add("close"), r.addEventListener("click", function() {
        s.close();
      }), s.header.appendChild(r);
    }
    return i.onOpen && (s.onOpen = i.onOpen), i.onClose && (s.onClose = i.onClose), s.title_element = s.querySelector(".dialog-title"), s.title_element.innerText = e, s.content = s.querySelector(".dialog-content"), s.alt_content = s.querySelector(".dialog-alt-content"), s.footer = s.querySelector(".dialog-footer"), s.close = function() {
      s.onClose && typeof s.onClose == "function" && s.onClose(), s.parentNode && s.parentNode.removeChild(s), this.parentNode && this.parentNode.removeChild(this);
    }, s.toggleAltContent = function(a = !1) {
      if (typeof a < "u")
        var l = a ? "block" : "none", o = a ? "none" : "block";
      else
        var l = s.alt_content.style.display != "block" ? "block" : "none", o = s.alt_content.style.display != "block" ? "none" : "block";
      s.alt_content.style.display = l, s.content.style.display = o;
    }, s.toggleFooterVisibility = function(a = !1) {
      if (typeof a < "u")
        var l = a ? "block" : "none";
      else
        var l = s.footer.style.display != "block" ? "block" : "none";
      s.footer.style.display = l;
    }, s.clear = function() {
      this.content.innerHTML = "";
    }, s.addHTML = function(a, l, o) {
      var h = document.createElement("div");
      return l && (h.className = l), h.innerHTML = a, o ? s.footer.appendChild(h) : s.content.appendChild(h), h;
    }, s.addButton = function(a, l, o) {
      var h = document.createElement("button");
      return h.innerText = a, h.options = o, h.classList.add("btn"), h.addEventListener("click", l), s.footer.appendChild(h), h;
    }, s.addSeparator = function() {
      var a = document.createElement("div");
      return a.className = "separator", s.content.appendChild(a), a;
    }, s.addWidget = function(a, l, o, h = {}, p) {
      var d = String(o);
      a = a.toLowerCase(), a == "number" && (d = o.toFixed(3));
      var c = document.createElement("div");
      c.className = "property", c.innerHTML = "<span class='property_name'></span><span class='property_value'></span>";
      let _ = c.querySelector(".property_name");
      _.innerText = h.label || l;
      var f = c.querySelector(".property_value");
      if (f.innerText = d, c.dataset.property = l, c.dataset.type = h.type || a, c.options = h, c.value = o, a == "code")
        c.addEventListener("click", function(m) {
          s.inner_showCodePad(this.dataset.property);
        });
      else if (a == "boolean")
        c.classList.add("boolean"), o && c.classList.add("bool-on"), c.addEventListener("click", function() {
          var m = this.dataset.property;
          this.value = !this.value, this.classList.toggle("bool-on");
          const y = this.querySelector(".property_value");
          y.innerText = this.value ? "true" : "false", g(m, this.value);
        });
      else if (a == "string" || a == "number")
        f.setAttribute("contenteditable", "true"), f.addEventListener("keydown", function(m) {
          m.code == "Enter" && (a != "string" || !m.shiftKey) && (m.preventDefault(), this.blur());
        }), f.addEventListener("blur", function() {
          let m = this.innerText;
          const y = this.parentNode;
          var E = y.dataset.property, v = y.dataset.type;
          v == "number" && (m = Number(m)), g(E, m);
        });
      else if ((a == "enum" || a == "combo") && "values" in h) {
        var d = T.getPropertyPrintableValue(o, h.values);
        f.innerText = d, f.addEventListener("click", function(y) {
          let E = h.values || [];
          typeof E == "function" && (console.error("Values by callback not supported in panel.addWidget!", E), E = []);
          var b = this.parentNode.dataset.property, C = this;
          let O = Array.from(E).map((G) => ({ content: G }));
          new X(O, {
            event: y,
            className: "dark",
            callback: M
          }, n);
          function M(G, F, B) {
            return C.innerText = G.content, g(b, G.content), !1;
          }
        });
      }
      s.content.appendChild(c);
      function g(m, y) {
        h.callback && h.callback(m, y, h), p && p(m, y, h);
      }
      return c;
    }, s.onOpen && typeof s.onOpen == "function" && s.onOpen(), s;
  }
  checkPanels() {
    if (this.canvas)
      for (var e = this.canvas.parentNode.querySelectorAll(".litegraph.dialog"), i = 0; i < e.length; ++i) {
        var n = e[i];
        n.node && (!n.node.graph || n.graph != this.graph) && n.close();
      }
  }
  closePanels() {
    var e = document.querySelector("#node-panel");
    e && e.close();
    var e = document.querySelector("#option-panel");
    e && e.close();
  }
}
N.onShowPropertyEditor = function(t, e, i, n, s) {
  var r = t.value, a = r.name, l = s[a], o = document.createElement("div");
  o.is_modified = !1, o.className = "graphdialog", o.innerHTML = "<span class='name'></span><input autofocus type='text' class='value'/><button>OK</button>", o.close = function() {
    o.parentNode && o.parentNode.removeChild(o);
  };
  var h = o.querySelector(".name");
  h.innerText = a;
  var p = o.querySelector(".value");
  p && (p.value = l, p.addEventListener("blur", function(b) {
    this.focus();
  }), p.addEventListener("keydown", function(b) {
    if (o.is_modified = !0, b.keyCode == 27)
      o.close();
    else if (b.keyCode == 13)
      m();
    else if (b.keyCode != 13 && b.target instanceof Element && b.target.localName != "textarea")
      return;
    b.preventDefault(), b.stopPropagation();
  }));
  var d = T.active_canvas, c = d.canvas, _ = c.getBoundingClientRect(), f = -20, g = -20;
  _ && (f -= _.left, g -= _.top), i ? (o.style.left = i.clientX + f + "px", o.style.top = i.clientY + g + "px") : (o.style.left = c.width * 0.5 + f + "px", o.style.top = c.height * 0.5 + g + "px");
  const m = () => {
    p && y(p.value);
  }, y = (b) => {
    r.type == "number" ? b = Number(b) : r.type == "boolean" && (b = !!b);
    const C = s[a];
    s[a] = b, s.onJSPropertyChanged && s.onJSPropertyChanged(a, b, C) === !1 && (s[a] = C), o.parentNode && o.parentNode.removeChild(o), s.setDirtyCanvas(!0, !0);
  };
  var E = o.querySelector("button");
  E.addEventListener("click", m), c.parentNode.appendChild(o), p && p.focus();
  var v = null;
  o.addEventListener("mouseleave", function(b) {
    u.dialog_close_on_mouse_leave && !o.is_modified && u.dialog_close_on_mouse_leave && (v = setTimeout(o.close, u.dialog_close_on_mouse_leave_delay));
  }), o.addEventListener("mouseenter", function(b) {
    u.dialog_close_on_mouse_leave && v && clearTimeout(v);
  });
};
N.onGroupAdd = function(t, e, i, n) {
  var s = T.active_canvas;
  s.getCanvasWindow();
  var r = new pe();
  r.pos = s.convertEventToCanvasOffset(i), s.graph.addGroup(r);
};
N.onMenuAdd = function(t, e, i, n, s) {
  var r = T.active_canvas, a = r.getCanvasWindow(), l = r.graph;
  if (!l)
    return;
  function o(h, p) {
    var d = u.getNodeTypesCategories(r.filter || l.filter).filter(function(f) {
      return f.startsWith(h);
    }), c = [];
    d.map(function(f) {
      if (f) {
        var g = new RegExp("^(" + h + ")"), m = f.replace(g, "").split("/")[0], y = h === "" ? m + "/" : h + m + "/", E = m;
        E.indexOf("::") != -1 && (E = E.split("::")[1]);
        var v = c.findIndex(function(b) {
          return b.value === y;
        });
        v === -1 && c.push(
          {
            value: y,
            content: E,
            has_submenu: !0,
            callback: function(b, C, O, M) {
              o(b.value, M);
            }
          }
        );
      }
    });
    var _ = u.getNodeTypesInCategory(h.slice(0, -1), r.filter || l.filter);
    _.map(function(f) {
      if (!f.skip_list) {
        var g = {
          value: f.class,
          content: f.title,
          has_submenu: !1,
          callback: function(m, y, E, v) {
            var b = v.getFirstEvent();
            r.graph.beforeChange();
            var C = u.createNode(m.value);
            C && (C.pos = r.convertEventToCanvasOffset(b), r.graph.add(C)), s && s(C), r.graph.afterChange();
          }
        };
        c.push(g);
      }
    }), new X(c, { event: i, parentMenu: p }, a);
  }
  return o("", n), !1;
};
N.showMenuNodeOptionalInputs = function(t, e, i, n, s) {
  if (!s)
    return;
  var r = this, a = T.active_canvas, l = a.getCanvasWindow();
  let o = s.getOptionalSlots().inputs, h = [];
  if (o)
    for (let _ = 0; _ < o.length; _++) {
      let f = o[_];
      if (!f) {
        h.push(x.SEPARATOR);
        continue;
      }
      let { name: g, type: m, options: y } = f;
      y || (y = {}), y.label && (g = y.label), y.removable = !0;
      var p = { content: g, value: f };
      m == A.ACTION && (p.className = "event"), h.push(p);
    }
  if (s.onMenuNodeInputs) {
    var d = s.onMenuNodeInputs(h);
    d && (h = d);
  }
  if (!h.length) {
    console.log("no input entries");
    return;
  }
  new X(
    h,
    {
      event: i,
      callback: c,
      parentMenu: n,
      node: s
    },
    l
  );
  function c(_, f, g, m) {
    if (s && (_.callback && _.callback.call(r, s, _, g, m), _.value)) {
      let y = _.value;
      s.graph.beforeChange(), s.addInput(y.name, y.type, y.options), s.onNodeOptionalInputAdd && s.onNodeOptionalInputAdd(_.value), s.setDirtyCanvas(!0, !0), s.graph.afterChange();
    }
  }
  return !1;
};
N.showMenuNodeOptionalOutputs = function(t, e, i, n, s) {
  if (!s)
    return;
  var r = this, a = T.active_canvas, l = a.getCanvasWindow(), o = s.getOptionalSlots().outputs, h = [];
  if (o)
    for (var p = 0; p < o.length; p++) {
      var d = o[p];
      if (!d) {
        h.push(x.SEPARATOR);
        continue;
      }
      let { name: g, type: m, options: y } = d;
      if (!(s.flags && s.flags.skip_repeated_outputs && s.findOutputSlotIndexByName(d[0]) != -1)) {
        y || (y = {}), y.label && (g = y.label), y.removable = !0;
        var c = { content: g, value: [g, m, y] };
        m == A.EVENT && (c.className = "event"), h.push(c);
      }
    }
  if (this.onMenuNodeOutputs && (h = this.onMenuNodeOutputs(h)), u.do_add_triggers_slots && s.findOutputSlotIndexByName("onExecuted") == -1 && h.push({ content: "On Executed", value: ["onExecuted", A.EVENT, { nameLocked: !0 }], className: "event" }), s.onMenuNodeOutputs) {
    var _ = s.onMenuNodeOutputs(h);
    _ && (h = _);
  }
  if (!h.length)
    return;
  let f = function(g, m, y, E) {
    if (s && (g.callback && g.callback.call(r, s, g, y, E), !!g.value)) {
      var v = g.value[1];
      if (v && (v.constructor === Object || v.constructor === Array)) {
        var b = [];
        for (var C in v)
          b.push({ content: C, value: v[C] });
        return new X(b, {
          event: y,
          callback: f,
          parentMenu: n,
          node: s
        }), !1;
      } else {
        const O = g.value;
        s.graph.beforeChange(), s.addOutput(O.name, O.type, O.options), s.onNodeOptionalOutputAdd && s.onNodeOptionalOutputAdd(g.value), s.setDirtyCanvas(!0, !0), s.graph.afterChange();
      }
    }
  };
  return new X(
    h,
    {
      event: i,
      callback: f,
      parentMenu: n,
      node: s
    },
    l
  ), !1;
};
N.onMenuResizeNode = function(t, e, i, n, s) {
  if (s) {
    var r = function(o) {
      o.size = o.computeSize(), o.onResize && o.onResize(o.size);
    }, a = T.active_canvas;
    if (!a.selected_nodes || Object.keys(a.selected_nodes).length <= 1)
      r(s);
    else
      for (var l in a.selected_nodes)
        r(a.selected_nodes[l]);
    s.setDirtyCanvas(!0, !0);
  }
};
N.onShowMenuNodeProperties = function(t, e, i, n, s) {
  if (!s || !s.properties)
    return;
  var r = T.active_canvas, a = r.getCanvasWindow(), l = [];
  for (var o in s.properties) {
    var h = s.properties[o] !== void 0 ? s.properties[o] : " ";
    typeof h == "object" && (h = JSON.stringify(h));
    var p = s.getPropertyInfo(o);
    (p.type == "enum" || p.type == "combo") && (h = T.getPropertyPrintableValue(h, p.values)), h = T.decodeHTML(h), l.push({
      content: "<span class='property_name'>" + (p.label ? p.label : o) + "</span><span class='property_value'>" + h + "</span>",
      value: o
    });
  }
  if (!l.length)
    return;
  new X(
    l,
    {
      event: i,
      callback: d,
      parentMenu: n,
      allow_html: !0,
      node: s
    },
    a
  );
  function d(c, _, f, g) {
    if (s) {
      var m = this.getBoundingClientRect();
      r.showEditPropertyValue(s, c.value, {
        position: [m.left, m.top]
      });
    }
  }
  return !1;
};
N.onResizeNode = function(t, e, i, n, s) {
  s && (s.size = s.computeSize(), s.setDirtyCanvas(!0, !0));
};
N.onMenuNodeCollapse = function(t, e, i, n, s) {
  s.graph.beforeChange(
    /*?*/
  );
  var r = function(o) {
    o.collapse();
  }, a = T.active_canvas;
  if (!a.selected_nodes || Object.keys(a.selected_nodes).length <= 1)
    r(s);
  else
    for (var l in a.selected_nodes)
      r(a.selected_nodes[l]);
  s.graph.afterChange(
    /*?*/
  );
};
N.onMenuNodePin = function(t, e, i, n, s) {
  s.pin();
};
N.onMenuNodeMode = function(t, e, i, n, s) {
  let r = Array.from(ie).map((l) => ({ content: l }));
  new X(
    r,
    { event: i, callback: a, parentMenu: n, node: s }
  );
  function a(l) {
    if (s) {
      var o = Object.values(ie).indexOf(l.content), h = function(c) {
        o >= j.ALWAYS && ie[o] ? c.changeMode(o) : (console.warn("unexpected mode: " + l), c.changeMode(j.ALWAYS));
      }, p = T.active_canvas;
      if (!p.selected_nodes || Object.keys(p.selected_nodes).length <= 1)
        h(s);
      else
        for (var d in p.selected_nodes)
          h(p.selected_nodes[d]);
    }
  }
  return !1;
};
N.onMenuNodeColors = function(t, e, i, n, s) {
  if (!s)
    throw "no node for color";
  var r = [];
  r.push({
    value: null,
    content: "<span style='display: block; padding-left: 4px;'>No color</span>"
  });
  for (let o in T.node_colors) {
    var a = T.node_colors[o];
    let h = {
      value: o,
      content: "<span style='display: block; color: #999; padding-left: 4px; border-left: 8px solid " + a.color + "; background-color:" + a.bgColor + "'>" + o + "</span>"
    };
    r.push(h);
  }
  new X(r, {
    event: i,
    callback: l,
    parentMenu: n,
    node: s,
    allow_html: !0
  });
  function l(o) {
    if (s) {
      var h = o.value ? T.node_colors[o.value] : null, p = function(_) {
        h ? _ instanceof pe ? _.color = h.groupcolor : (_.color = h.color, _.bgColor = h.bgColor) : (delete _.color, _ instanceof te && delete _.bgColor);
      }, d = T.active_canvas;
      if (!d.selected_nodes || Object.keys(d.selected_nodes).length <= 1)
        p(s);
      else
        for (var c in d.selected_nodes)
          p(d.selected_nodes[c]);
      s.setDirtyCanvas(!0, !0);
    }
  }
  return !1;
};
N.onMenuNodeShapes = function(t, e, i, n, s) {
  if (!s)
    throw "no node passed";
  const r = Array.from(be).map((l) => ({ content: l }));
  new X(r, {
    event: i,
    callback: a,
    parentMenu: n,
    node: s
  });
  function a(l) {
    if (s) {
      s.graph.beforeChange(
        /*?*/
      );
      var o = function(d) {
        d.shape = be.indexOf(l.content);
      }, h = T.active_canvas;
      if (!h.selected_nodes || Object.keys(h.selected_nodes).length <= 1)
        o(s);
      else
        for (var p in h.selected_nodes)
          o(h.selected_nodes[p]);
      s.graph.afterChange(
        /*?*/
      ), s.setDirtyCanvas(!0);
    }
  }
  return !1;
};
N.onMenuNodeRemove = function(t, e, i, n, s) {
  if (!s)
    throw "no node passed";
  var r = s.graph;
  r.beforeChange();
  var a = function(h) {
    h.removable !== !1 && r.remove(h);
  }, l = T.active_canvas;
  if (!l.selected_nodes || Object.keys(l.selected_nodes).length <= 1)
    a(s);
  else
    for (var o in l.selected_nodes)
      a(l.selected_nodes[o]);
  r.afterChange(), s.setDirtyCanvas(!0, !0);
};
N.onMenuNodeToSubgraph = function(t, e, i, n, s) {
  var r = s.graph, a = T.active_canvas;
  if (a) {
    var l = Object.values(a.selected_nodes || {});
    l.length || (l = [s]);
    var o = u.createNode("graph/subgraph");
    o.pos = s.pos.concat(), r.add(o), o.buildFromNodes(l), a.deselectAllNodes(), s.setDirtyCanvas(!0, !0);
  }
};
N.onMenuNodeClone = function(t, e, i, n, s) {
  s.graph.beforeChange();
  var r = {}, a = function(h) {
    if (h.clonable != !1) {
      var p = h.clone();
      p && (p.pos = [h.pos[0] + 5, h.pos[1] + 5], h.graph.add(p), r[p.id] = p);
    }
  }, l = T.active_canvas;
  if (!l.selected_nodes || Object.keys(l.selected_nodes).length <= 1)
    a(s);
  else
    for (var o in l.selected_nodes)
      a(l.selected_nodes[o]);
  Object.keys(r).length && l.selectNodes(Object.values(r)), s.graph.afterChange(), s.setDirtyCanvas(!0, !0);
};
const Se = function(t, e, i) {
  return e > t ? e : i < t ? i : t;
}, ue = class {
  constructor(t, e, i = {}) {
    this.node_panel = null, this.options_panel = null, this.render_time = 0, this.allow_dragcanvas = !0, this.allow_dragnodes = !0, this.allow_interaction = !0, this.allow_reconnect_links = !0, this.allow_searchbox = !0, this.always_render_background = !1, this.background_image = ue.DEFAULT_BACKGROUND_IMAGE, this.block_click = !1, this.clear_background = !0, this.connecting_pos = null, this.connecting_slot = null, this.connecting_input = null, this.connecting_output = null, this.connections_width = 3, this.current_node = null, this.drag_mode = !1, this.dragging_rectangle = null, this.ds = new Ae(), this.editor_alpha = 1, this.filter = null, this.highquality_render = !0, this.skip_events = !1, this.last_mouse_position = [0, 0], this.last_click_position = [0, 0], this.last_mouse_dragging = !1, this.links_render_mode = le.SPLINE_LINK, this.live_mode = !1, this.mouse = [0, 0], this.graph_mouse = [0, 0], this.node_widget = null, this.maxZoom = null, this.minZoom = null, this.multi_select = !1, this.over_link_center = null, this.pause_rendering = !1, this.read_only = !1, this.render_canvas_border = !0, this.render_collapsed_slots = !0, this.render_connection_arrows = !1, this.render_connections_border = !0, this.render_connections_shadows = !1, this.render_curved_connections = !1, this.render_execution_order = !1, this.render_link_tooltip = !0, this.render_only_selected = !0, this.render_shadows = !0, this.render_title_colored = !0, this.round_radius = 8, this.set_canvas_dirty_on_mouse_event = !0, this.show_info = !0, this.use_gradients = !1, this.visible_links = [], this.zoom_modify_alpha = !0, this.pointer_is_down = !1, this.pointer_is_double = !1, this._highlight_input = null, this._highlight_input_slot = null, this._highlight_output = null, this._graph_stack = null, this._bg_img = null, this._pattern = null, this._pattern_img = null, this.search_box = null, this.prompt_box = null, this._events_binded = !1, this.resizing_node = null, typeof t == "string" && (t = document.querySelector(t)), this.skip_events = i.skip_events || !1, this.title_text_font = "" + u.NODE_TEXT_SIZE + "px Arial", this.inner_text_font = "normal " + u.NODE_SUBTEXT_SIZE + "px Arial", this.node_title_color = u.NODE_TITLE_COLOR, this.default_link_color = u.LINK_COLOR, this.default_connection_color = {
      input_off: "#778",
      input_on: "#7F7",
      //"#BBD"
      output_off: "#778",
      output_on: "#7F7"
      //"#BBD"
    }, this.canvas_mouse = this.graph_mouse, this.visible_area = this.ds.visible_area, this.viewport = i.viewport || null, e && e.attachCanvas(this), this.setCanvas(t, i.skip_events), this.clear(), i.skip_render || this.startRendering(), this.autoresize = i.autoresize;
  }
  static getFileExtension(t) {
    var e = t.indexOf("?");
    e != -1 && (t = t.substr(0, e));
    var i = t.lastIndexOf(".");
    return i == -1 ? "" : t.substr(i + 1).toLowerCase();
  }
  static decodeHTML(t) {
    var e = document.createElement("div");
    return e.innerText = t, e.innerHTML;
  }
  static getPropertyPrintableValue(t, e) {
    if (!e || e.constructor === Array)
      return String(t);
    if (e.constructor === Object) {
      var i = "";
      for (var n in e)
        if (e[n] == t) {
          i = n;
          break;
        }
      return String(t) + " (" + i + ")";
    }
  }
  get scale() {
    return this.ds.scale;
  }
  set scale(t) {
    this.ds.scale = t;
  }
  /** clears all the data inside */
  clear() {
    this.frame = 0, this.last_draw_time = 0, this.render_time = 0, this.fps = 0, this.dragging_rectangle = null, this.selected_nodes = {}, this.selected_group = null, this.visible_nodes = [], this.node_dragged = null, this.node_over = null, this.node_capturing_input = null, this.connecting_node = null, this.highlighted_links = {}, this.dragging_canvas = !1, this.dirty_canvas = !0, this.dirty_bgcanvas = !0, this.dirty_area = null, this.node_in_panel = null, this.node_widget = null, this.last_mouse = [0, 0], this.last_mouseclick = 0, this.pointer_is_down = !1, this.pointer_is_double = !1, this.onClear && this.onClear();
  }
  /** assigns a graph, you can reassign graphs to the same canvas */
  setGraph(t, e = !1) {
    if (this.graph != t) {
      if (e || this.clear(), !t && this.graph) {
        this.graph.detachCanvas(this);
        return;
      }
      t.attachCanvas(this), this._graph_stack && (this._graph_stack = null), this.setDirty(!0, !0);
    }
  }
  /** opens a graph contained inside a node in the current graph */
  openSubgraph(t) {
    if (!t)
      throw "graph cannot be null";
    if (this.graph == t)
      throw "graph cannot be the same";
    this.clear(), this.graph && (this._graph_stack || (this._graph_stack = []), this._graph_stack.push(this.graph)), t.attachCanvas(this), this.checkPanels(), this.setDirty(!0, !0);
  }
  /** closes a subgraph contained inside a node */
  closeSubgraph() {
    if (!(!this._graph_stack || this._graph_stack.length == 0)) {
      var t = this.graph._subgraph_node, e = this._graph_stack.pop();
      this.selected_nodes = {}, this.highlighted_links = {}, e.attachCanvas(this), this.setDirty(!0, !0), t && (this.centerOnNode(t), this.selectNodes([t])), this.ds.offset = [0, 0], this.ds.scale = 1;
    }
  }
  /** assigns a canvas */
  setCanvas(t, e = !1) {
    if (t && typeof t == "string" && (t = document.getElementById(t), !t))
      throw "Error creating LiteGraph canvas: Canvas not found";
    if (t = t, t !== this.canvas && (!t && this.canvas && (e || this.unbindEvents()), this.canvas = t, this.ds.element = t, !!t)) {
      if (t.className += " lgraphcanvas", t.data = this, t.tabIndex = 1, this.bgcanvas = null, this.bgcanvas || (this.bgcanvas = document.createElement("canvas"), this.bgcanvas.width = this.canvas.width, this.bgcanvas.height = this.canvas.height), t.getContext == null)
        throw t.localName != "canvas" ? "Element supplied for LGraphCanvas must be a <canvas> element, you passed a " + t.localName : "This browser doesn't support Canvas";
      e || this.bindEvents(), this.adjustCanvasForHiDPI();
    }
  }
  //used in some events to capture them
  _doNothing(t) {
    return t.preventDefault(), !1;
  }
  _doReturnTrue(t) {
    return t.preventDefault(), !0;
  }
  /** binds mouse, keyboard, touch and drag events to the canvas */
  bindEvents() {
    if (this._events_binded) {
      console.warn("LGraphCanvas: events already binded");
      return;
    }
    var t = this.canvas, e = this.getCanvasWindow(), i = e.document;
    this._mousedown_callback = this.processMouseDown.bind(this), this._mousewheel_callback = this.processMouseWheel.bind(this), this._mousemove_callback = this.processMouseMove.bind(this), this._mouseup_callback = this.processMouseUp.bind(this), u.pointerListenerAdd(t, "down", this._mousedown_callback, !0), t.addEventListener("mousewheel", this._mousewheel_callback, !1), u.pointerListenerAdd(t, "up", this._mouseup_callback, !0), u.pointerListenerAdd(t, "move", this._mousemove_callback), t.addEventListener("contextmenu", this._doNothing), t.addEventListener(
      "DOMMouseScroll",
      this._mousewheel_callback,
      !1
    ), this._key_callback = this.processKey.bind(this), t.addEventListener("keydown", this._key_callback, !0), i.addEventListener("keyup", this._key_callback, !0), this._ondrop_callback = this.processDrop.bind(this), t.addEventListener("dragover", this._doNothing, !1), t.addEventListener("dragend", this._doNothing, !1), t.addEventListener("drop", this._ondrop_callback, !1), t.addEventListener("dragenter", this._doReturnTrue, !1), this._events_binded = !0;
  }
  /** unbinds mouse events from the canvas */
  unbindEvents() {
    if (!this._events_binded) {
      console.warn("LGraphCanvas: no events binded");
      return;
    }
    u.debug && console.log("pointerevents: unbindEvents");
    var t = this.getCanvasWindow(), e = t.document;
    u.pointerListenerRemove(this.canvas, "move", this._mousedown_callback), u.pointerListenerRemove(this.canvas, "up", this._mousedown_callback), u.pointerListenerRemove(this.canvas, "down", this._mousedown_callback), this.canvas.removeEventListener(
      "mousewheel",
      this._mousewheel_callback
    ), this.canvas.removeEventListener(
      "DOMMouseScroll",
      this._mousewheel_callback
    ), this.canvas.removeEventListener("keydown", this._key_callback), e.removeEventListener("keyup", this._key_callback), this.canvas.removeEventListener("contextmenu", this._doNothing), this.canvas.removeEventListener("drop", this._ondrop_callback), this.canvas.removeEventListener("dragenter", this._doReturnTrue), this._mousedown_callback = null, this._mousewheel_callback = null, this._key_callback = null, this._ondrop_callback = null, this._events_binded = !1;
  }
  /**
   * this function allows to render the canvas using WebGL instead of Canvas2D
   * this is useful if you plant to render 3D objects inside your nodes, it uses litegl.js for webgl and canvas2DtoWebGL to emulate the Canvas2D calls in webGL
   **/
  enableWebGL() {
  }
  /**
   * marks as dirty the canvas, this way it will be rendered again
   * @param fg if the foreground canvas is dirty (the one containing the nodes)
   * @param bg if the background canvas is dirty (the one containing the wires)
   */
  setDirty(t = !1, e = !1) {
    t && (this.dirty_canvas = !0), e && (this.dirty_bgcanvas = !0);
  }
  /**
   * Used to attach the canvas in a popup
   * @return the window where the canvas is attached (the DOM root node)
   */
  getCanvasWindow() {
    if (!this.canvas)
      return window;
    var t = this.canvas.ownerDocument;
    return t.defaultView;
  }
  adjustCanvasForHiDPI(t) {
    if (t || (t = window.devicePixelRatio), t == 1 || !this.canvas.parentNode)
      return;
    const e = this.canvas.parentNode.getBoundingClientRect(), { width: i, height: n } = e;
    this.canvas.width = i * t, this.canvas.height = n * t, this.canvas.style.width = i + "px", this.canvas.style.height = n + "px", this.canvas.getContext("2d").scale(t, t);
  }
  /** starts rendering the content of the canvas when needed */
  startRendering() {
    if (this.is_rendering)
      return;
    this.is_rendering = !0, t.call(this);
    function t() {
      this.pause_rendering || this.draw();
      var e = this.getCanvasWindow();
      this.is_rendering && e.requestAnimationFrame(t.bind(this));
    }
  }
  /** stops rendering the content of the canvas (to save resources) */
  stopRendering() {
    this.is_rendering = !1;
  }
  //used to block future mouse events (because of im gui)
  blockClick() {
    this.block_click = !0, this.last_mouseclick = 0;
  }
  createDefaultNodeForSlot(t, e = {
    position: [0, 0],
    posAdd: [0, 0],
    posSizeFix: [0, 0]
  }) {
    var i = this, n = e.nodeFrom && e.slotFrom !== null, s = !n && e.nodeTo && e.slotTo !== null;
    if (!n && !s)
      return console.warn("No data passed to createDefaultNodeForSlot " + e.nodeFrom + " " + e.slotFrom + " " + e.nodeTo + " " + e.slotTo), !1;
    if (!t)
      return console.warn("No type to createDefaultNodeForSlot"), !1;
    var r = n ? e.nodeFrom : e.nodeTo, a = n ? e.slotFrom : e.slotTo, l = null;
    switch (typeof a) {
      case "string":
        l = n ? r.findOutputSlotIndexByName(a) : r.findInputSlotIndexByName(a), a = n ? r.outputs[a] : r.inputs[a];
        break;
      case "object":
        l = n ? r.findOutputSlotIndexByName(a.name) : r.findInputSlotIndexByName(a.name);
        break;
      case "number":
        l = a, a = n ? r.outputs[a] : r.inputs[a];
        break;
      case "undefined":
      default:
        return console.warn("Cant get slot information " + a), !1;
    }
    a = a, (!a || !l) && console.warn("createDefaultNodeForSlot bad slotX " + a + " " + l);
    var o = a.type == A.EVENT ? "_event_" : a.type, h = n ? u.slot_types_default_out : u.slot_types_default_in;
    const p = h[o];
    if (h && p) {
      a.link !== null || a.links && a.links.length > 0;
      let g = null;
      if (typeof p == "object" && Array.isArray(p)) {
        for (var d of p)
          if (t == h[o][d] || t == "AUTO") {
            g = h[o][d], u.debug && console.log("opts.nodeType == slotTypesDefault[fromSlotType][typeX] :: " + t);
            break;
          }
      } else
        (t == p || t == "AUTO") && (g = p);
      if (g) {
        var c = null;
        typeof g == "object" && g.node && (c = g, g = g.node);
        var _ = u.createNode(g);
        if (_) {
          if (c) {
            if (c.properties)
              for (var f in c.properties)
                _.addProperty(f, c.properties[f]);
            if (c.inputs) {
              _.inputs = [];
              for (var f in c.inputs)
                _.addOutput(
                  c.inputs[f][0],
                  c.inputs[f][1]
                );
            }
            if (c.outputs) {
              _.outputs = [];
              for (var f in c.outputs)
                _.addOutput(
                  c.outputs[f][0],
                  c.outputs[f][1]
                );
            }
            c.title && (_.title = c.title), c.json && _.configure(c.json);
          }
          return i.graph.add(_), _.pos = [
            e.position[0] + e.posAdd[0] + (e.posSizeFix[0] ? e.posSizeFix[0] * _.size[0] : 0),
            e.position[1] + e.posAdd[1] + (e.posSizeFix[1] ? e.posSizeFix[1] * _.size[1] : 0)
          ], n ? e.nodeFrom.connectByTypeInput(l, _, o) : e.nodeTo.connectByTypeOutput(l, _, o), n && s && console.debug("connecting in between"), !0;
        } else
          console.log("failed creating " + g);
      }
    }
    return !1;
  }
  /** returns true if a position (in graph space) is on top of a node little corner box */
  isOverNodeBox(t, e, i) {
    var n = u.NODE_TITLE_HEIGHT;
    return !!u.isInsideRectangle(
      e,
      i,
      t.pos[0] + 2,
      t.pos[1] + 2 - n,
      n - 4,
      n - 4
    );
  }
  /** returns slot index if a position (in graph space) is on top of a node input slot */
  isOverNodeInput(t, e, i, n) {
    if (t.inputs)
      for (var s = 0, r = t.inputs.length; s < r; ++s) {
        var a = t.getConnectionPos(!0, s), l = !1;
        if (t.horizontal ? l = u.isInsideRectangle(
          e,
          i,
          a[0] - 5,
          a[1] - 10,
          10,
          20
        ) : l = u.isInsideRectangle(
          e,
          i,
          a[0] - 10,
          a[1] - 5,
          40,
          10
        ), l)
          return n && (n[0] = a[0], n[1] = a[1]), s;
      }
    return -1;
  }
  /**
   * returns the INDEX if a position (in graph space) is on top of a node output slot
   * @method isOverNodeOuput
   **/
  isOverNodeOutput(t, e, i, n) {
    if (t.outputs)
      for (var s = 0, r = t.outputs.length; s < r; ++s) {
        t.outputs[s];
        var a = t.getConnectionPos(!1, s), l = !1;
        if (t.horizontal ? l = u.isInsideRectangle(
          e,
          i,
          a[0] - 5,
          a[1] - 10,
          10,
          20
        ) : l = u.isInsideRectangle(
          e,
          i,
          a[0] - 10,
          a[1] - 5,
          40,
          10
        ), l)
          return n && (n[0] = a[0], n[1] = a[1]), s;
      }
    return -1;
  }
  /** process a key event */
  processKey(t) {
    if (this.graph) {
      var e = !1;
      if (u.debug && console.log("processKey", t), !(t.target instanceof Element && t.target.localName == "input")) {
        if (t.type == "keydown") {
          if (t.keyCode == 32 && (this.dragging_canvas = !0, e = !0), t.keyCode == 27 && (this.node_panel && this.node_panel.close(), this.options_panel && this.options_panel.close(), e = !0), t.keyCode == 65 && t.ctrlKey && (this.selectNodes(), e = !0), t.code == "KeyC" && (t.metaKey || t.ctrlKey) && !t.shiftKey && this.selected_nodes && (this.copyToClipboard(), e = !0), t.code == "KeyV" && (t.metaKey || t.ctrlKey) && !t.shiftKey && this.pasteFromClipboard(), (t.keyCode == 46 || t.keyCode == 8) && t.target instanceof Element && t.target.localName != "input" && t.target.localName != "textarea" && (this.deleteSelectedNodes(), e = !0), this.selected_nodes)
            for (var i in this.selected_nodes)
              this.selected_nodes[i].onKeyDown && this.selected_nodes[i].onKeyDown(t);
        } else if (t.type == "keyup" && (t.keyCode == 32 && (this.dragging_canvas = !1), this.selected_nodes))
          for (var i in this.selected_nodes)
            this.selected_nodes[i].onKeyUp && this.selected_nodes[i].onKeyUp(t);
        if (this.graph.change(), e)
          return t.preventDefault(), t.stopImmediatePropagation(), !1;
      }
    }
  }
  copyToClipboard() {
    var t = {
      nodes: [],
      links: []
    }, e = 0, i = [];
    for (var n in this.selected_nodes) {
      var s = this.selected_nodes[n];
      s._relative_id = e, i.push(s), e += 1;
    }
    for (let h = 0; h < i.length; ++h) {
      let p = i[h], d = p.clone();
      if (!d) {
        console.warn("node type not found: " + p.type);
        continue;
      }
      if (t.nodes.push(d.serialize()), p.inputs && p.inputs.length)
        for (var r = 0; r < p.inputs.length; ++r) {
          var a = p.inputs[r];
          if (!(!a || a.link == null)) {
            var l = this.graph.links[a.link];
            if (l) {
              var o = this.graph.getNodeById(
                l.origin_id
              );
              !o || !this.selected_nodes[o.id] || t.links.push([
                o._relative_id,
                l.origin_slot,
                //j,
                p._relative_id,
                l.target_slot
              ]);
            }
          }
        }
    }
    localStorage.setItem(
      "litegrapheditor_clipboard",
      JSON.stringify(t)
    );
  }
  pasteFromClipboard() {
    var t = localStorage.getItem("litegrapheditor_clipboard");
    if (t) {
      this.graph.beforeChange();
      for (var e = JSON.parse(t), i = null, n = null, s = 0; s < e.nodes.length; ++s)
        i ? (i[0] > e.nodes[s].pos[0] && (i[0] = e.nodes[s].pos[0], n[0] = s), i[1] > e.nodes[s].pos[1] && (i[1] = e.nodes[s].pos[1], n[1] = s)) : (i = [e.nodes[s].pos[0], e.nodes[s].pos[1]], n = [s, s]);
      for (var r = [], s = 0; s < e.nodes.length; ++s) {
        var a = e.nodes[s], l = u.createNode(a.type);
        l && (l.configure(a), l.pos[0] += this.graph_mouse[0] - i[0], l.pos[1] += this.graph_mouse[1] - i[1], this.graph.add(l, { doProcessChange: !1 }), r.push(l));
      }
      for (var s = 0; s < e.links.length; ++s) {
        var o = e.links[s], h = r[o[0]], p = r[o[2]];
        h && p ? h.connect(o[1], p, o[3]) : console.warn("Warning, nodes missing on pasting");
      }
      this.selectNodes(r), this.graph.afterChange();
    }
  }
  processDrop(t) {
    let e = t;
    e.preventDefault(), this.adjustMouseEvent(e);
    var i = e.clientX, n = e.clientY, s = !this.viewport || this.viewport && i >= this.viewport[0] && i < this.viewport[0] + this.viewport[2] && n >= this.viewport[1] && n < this.viewport[1] + this.viewport[3];
    if (s) {
      var r = [e.canvasX, e.canvasY], a = this.graph ? this.graph.getNodeOnPos(r[0], r[1]) : null;
      if (!a) {
        var l = null;
        this.onDropItem && (l = this.onDropItem(e)), l || this.checkDropItem(e);
        return;
      }
      if (a.onDropFile || a.onDropData) {
        var o = e.dataTransfer.files;
        if (o && o.length)
          for (var h = 0; h < o.length; h++) {
            var p = e.dataTransfer.files[0], d = p.name;
            if (ue.getFileExtension(d), a.onDropFile && a.onDropFile(p), a.onDropData) {
              var c = new FileReader();
              c.onload = function(f) {
                var g = f.target.result;
                a.onDropData(g, d, p);
              };
              var _ = p.type.split("/")[0];
              _ == "text" || _ == "" ? c.readAsText(p) : _ == "image" ? c.readAsDataURL(p) : c.readAsArrayBuffer(p);
            }
          }
      }
      return !!(a.onDropItem && a.onDropItem(e) || this.onDropItem && this.onDropItem(e));
    }
  }
  checkDropItem(t) {
    let e = t;
    if (e.dataTransfer.files.length) {
      var i = e.dataTransfer.files[0], n = ue.getFileExtension(i.name).toLowerCase(), s = u.node_types_by_file_extension[n];
      if (s) {
        this.graph.beforeChange();
        var r = u.createNode(s.type);
        r.pos = [e.canvasX, e.canvasY], this.graph.add(r), r.onDropFile && r.onDropFile(i), this.graph.afterChange();
      }
    }
  }
  processNodeDblClicked(t) {
    this.onShowNodePanel ? this.onShowNodePanel(t) : this.showShowNodePanel(t), this.onNodeDblClicked && this.onNodeDblClicked(t), this.setDirty(!0);
  }
  processNodeSelected(t, e) {
    this.selectNode(t, e && (e.shiftKey || e.ctrlKey || this.multi_select)), this.onNodeSelected && this.onNodeSelected(t);
  }
  /** selects a given node (or adds it to the current selection) */
  selectNode(t, e = !1) {
    t == null ? this.deselectAllNodes() : this.selectNodes([t], e);
  }
  /** selects several nodes (or adds them to the current selection) */
  selectNodes(t, e = !1) {
    e || this.deselectAllNodes(), t = t || this.graph._nodes, typeof t == "string" && (t = [t]);
    for (var i in t) {
      var n = t[i];
      if (n.is_selected) {
        this.deselectNode(n);
        continue;
      }
      if (!n.is_selected && n.onSelected && n.onSelected(), n.is_selected = !0, this.selected_nodes[n.id] = n, n.inputs)
        for (var s = 0; s < n.inputs.length; ++s)
          this.highlighted_links[n.inputs[s].link] = !0;
      if (n.outputs)
        for (var s = 0; s < n.outputs.length; ++s) {
          var r = n.outputs[s];
          if (r.links)
            for (var a = 0; a < r.links.length; ++a)
              this.highlighted_links[r.links[a]] = !0;
        }
    }
    this.onSelectionChange && this.onSelectionChange(this.selected_nodes), this.setDirty(!0);
  }
  /** removes a node from the current selection */
  deselectNode(t) {
    if (t.is_selected) {
      if (t.onDeselected && t.onDeselected(), t.is_selected = !1, this.onNodeDeselected && this.onNodeDeselected(t), t.inputs)
        for (var e = 0; e < t.inputs.length; ++e)
          delete this.highlighted_links[t.inputs[e].link];
      if (t.outputs)
        for (var e = 0; e < t.outputs.length; ++e) {
          var i = t.outputs[e];
          if (i.links)
            for (var n = 0; n < i.links.length; ++n)
              delete this.highlighted_links[i.links[n]];
        }
    }
  }
  /** removes all nodes from the current selection */
  deselectAllNodes() {
    if (this.graph) {
      for (var t = this.graph._nodes, e = 0, i = t.length; e < i; ++e) {
        var n = t[e];
        n.is_selected && (n.onDeselected && n.onDeselected(), n.is_selected = !1, this.onNodeDeselected && this.onNodeDeselected(n));
      }
      this.selected_nodes = {}, this.current_node = null, this.highlighted_links = {}, this.onSelectionChange && this.onSelectionChange(this.selected_nodes), this.setDirty(!0);
    }
  }
  /** deletes all nodes in the current selection from the graph */
  deleteSelectedNodes() {
    this.graph.beforeChange();
    for (var t in this.selected_nodes) {
      var e = this.selected_nodes[t];
      if (!e.block_delete) {
        if (e.inputs && e.inputs.length && e.outputs && e.outputs.length && u.isValidConnection(e.inputs[0].type, e.outputs[0].type) && e.inputs[0].link && e.outputs[0].links && e.outputs[0].links.length) {
          var i = e.graph.links[e.inputs[0].link], n = e.graph.links[e.outputs[0].links[0]], s = e.getInputNode(0), r = e.getOutputNodes(0)[0];
          s && r && s.connect(i.origin_slot, r, n.target_slot);
        }
        this.graph.remove(e), this.onNodeDeselected && this.onNodeDeselected(e);
      }
    }
    this.selected_nodes = {}, this.current_node = null, this.highlighted_links = {}, this.setDirty(!0), this.graph.afterChange();
  }
  /** centers the camera on a given node */
  centerOnNode(t) {
    this.ds.offset[0] = -t.pos[0] - t.size[0] * 0.5 + this.canvas.width * 0.5 / this.ds.scale, this.ds.offset[1] = -t.pos[1] - t.size[1] * 0.5 + this.canvas.height * 0.5 / this.ds.scale, this.setDirty(!0, !0);
  }
  /**
   * adds some useful properties to a mouse event, like the position in graph coordinates
   * @method adjustMouseEvent
   **/
  adjustMouseEvent(t) {
    let e = t;
    var i = 0, n = 0;
    if (this.canvas) {
      var s = this.canvas.getBoundingClientRect();
      i = e.clientX - s.left, n = e.clientY - s.top;
    } else
      i = e.clientX, n = e.clientY;
    this.last_mouse_position[0] = i, this.last_mouse_position[1] = n, e.canvasX = i / this.ds.scale - this.ds.offset[0], e.canvasY = n / this.ds.scale - this.ds.offset[1];
  }
  /** process an event on widgets */
  processNodeWidgets(t, e, i, n) {
    if (!t.widgets || !t.widgets.length || u.ignore_all_widget_events)
      return null;
    for (var s = e[0] - t.pos[0], r = e[1] - t.pos[1], a = t.size[0], l = this, o = this.getCanvasWindow(), h = 0; h < t.widgets.length; ++h) {
      var p = t.widgets[h];
      if (!(!p || p.disabled)) {
        var d = p.computeSize ? p.computeSize(a)[1] : u.NODE_WIDGET_HEIGHT, c = p.width || a;
        if (!(p != n && (s < 6 || s > c - 12 || r < p.last_y || r > p.last_y + d || p.last_y === void 0))) {
          var _ = p.value;
          switch (p.type) {
            case "button":
              i.type === u.pointerevents_method + "down" && (p.callback && setTimeout(function() {
                p.callback(p, l, t, e, i);
              }, 20), p.clicked = !0, this.dirty_canvas = !0);
              break;
            case "slider":
              p.options.max - p.options.min;
              var f = Se((s - 15) / (c - 30), 0, 1);
              p.value = p.options.min + (p.options.max - p.options.min) * f, p.callback && setTimeout(function() {
                b(p, p.value);
              }, 20), this.dirty_canvas = !0;
              break;
            case "number":
            case "combo":
              var _ = p.value;
              if (i.type == u.pointerevents_method + "move" && p.type == "number")
                i.deltaX && (p.value += i.deltaX * 0.1 * (p.options.step || 1)), p.options.min != null && p.value < p.options.min && (p.value = p.options.min), p.options.max != null && p.value > p.options.max && (p.value = p.options.max);
              else if (i.type == u.pointerevents_method + "down") {
                var g = p.options.values;
                if (g && typeof g == "function") {
                  let O = p.options.values;
                  g = O(p, t);
                }
                var m = null;
                p.type != "number" && (m = Array.isArray(g) ? g : Object.keys(g));
                var y = s < 40 ? -1 : s > c - 40 ? 1 : 0;
                if (p.type == "number")
                  p.value += y * (p.options.step || 0.1), p.options.min != null && p.value < p.options.min && (p.value = p.options.min), p.options.max != null && p.value > p.options.max && (p.value = p.options.max);
                else if (y) {
                  var E = -1;
                  this.last_mouseclick = 0, g.constructor === Object ? E = m.indexOf(String(p.value)) + y : E = m.indexOf(p.value) + y, E >= m.length && (E = m.length - 1), E < 0 && (E = 0), Array.isArray(g) ? p.value = g[E] : p.value = E;
                } else {
                  let O = function(G, F, B) {
                    let D = G.content;
                    return g != m && (D = v.indexOf(D)), this.value = G, b(this, G), l.dirty_canvas = !0, !1;
                  };
                  var v = g != m ? Object.values(g) : g;
                  let M = Array.from(v).map((G) => ({ content: G }));
                  new X(
                    M,
                    {
                      scale: Math.max(1, this.ds.scale),
                      event: i,
                      className: "dark",
                      callback: O.bind(p)
                    },
                    o
                  );
                }
              } else if (i.type == u.pointerevents_method + "up" && p.type == "number") {
                var y = s < 40 ? -1 : s > c - 40 ? 1 : 0;
                i.click_time < 200 && y == 0 && this.prompt(
                  "Value",
                  p.value,
                  function(M) {
                    this.value = Number(M), b(this, this.value);
                  }.bind(p),
                  i
                );
              }
              _ != p.value && setTimeout(
                function() {
                  b(this, this.value);
                }.bind(p),
                20
              ), this.dirty_canvas = !0;
              break;
            case "toggle":
              i.type == u.pointerevents_method + "down" && (p.value = !p.value, setTimeout(function() {
                b(p, p.value);
              }, 20));
              break;
            case "string":
            case "text":
              i.type == u.pointerevents_method + "down" && this.prompt(
                "Value",
                p.value,
                function(O) {
                  this.value = O, b(this, O);
                }.bind(p),
                i,
                p.options ? p.options.multiline : !1
              );
              break;
            default:
              p.mouse && (this.dirty_canvas = p.mouse(i, [s, r], t));
              break;
          }
          return _ != p.value && (t.onWidgetChanged && t.onWidgetChanged(p, _), t.graph._version++), p;
        }
      }
    }
    function b(C, O) {
      C.value = O, C.options && C.options.property && t.properties[C.options.property] !== void 0 && t.setProperty(C.options.property, O), C.callback && C.callback(C.value, l, t, e, i);
    }
    return null;
  }
  adjustNodesSize() {
    for (var t = this.graph._nodes, e = 0; e < t.length; ++e)
      t[e].size = t[e].computeSize();
    this.setDirty(!0, !0);
  }
  /** resizes the canvas to a given size, if no size is passed, then it tries to fill the parentNode */
  resize(t, e) {
    if (!t && !e) {
      var i = this.canvas.parentNode;
      t = i.offsetWidth, e = i.offsetHeight;
    }
    this.canvas.width == t && this.canvas.height == e || (this.canvas.width = t, this.canvas.height = e, this.bgcanvas.width = this.canvas.width, this.bgcanvas.height = this.canvas.height, this.adjustCanvasForHiDPI(), this.setDirty(!0, !0));
  }
  isAreaClicked(t, e, i, n, s) {
    var r = this.mouse;
    u.isInsideRectangle(r[0], r[1], t, e, i, n), r = this.last_click_position;
    var a = r && u.isInsideRectangle(r[0], r[1], t, e, i, n), l = a && !this.block_click;
    return a && s && this.blockClick(), l;
  }
  /**
   * switches to live mode (node shapes are not rendered, only the content)
   * this feature was designed when graphs where meant to create user interfaces
   **/
  switchLiveMode(t) {
    if (!t) {
      this.live_mode = !this.live_mode, this.dirty_canvas = !0, this.dirty_bgcanvas = !0;
      return;
    }
    var e = this, i = this.live_mode ? 1.1 : 0.9;
    this.live_mode && (this.live_mode = !1, this.editor_alpha = 0.1);
    var n = setInterval(function() {
      e.editor_alpha *= i, e.dirty_canvas = !0, e.dirty_bgcanvas = !0, i < 1 && e.editor_alpha < 0.01 && (clearInterval(n), i < 1 && (e.live_mode = !0)), i > 1 && e.editor_alpha > 0.99 && (clearInterval(n), e.editor_alpha = 1);
    }, 1);
  }
  onNodeSelectionChange() {
  }
  touchHandler(t) {
  }
  convertOffsetToCanvas(t) {
    return this.ds.convertOffsetToCanvas(t);
  }
  convertCanvasToOffset(t, e = [0, 0]) {
    return this.ds.convertCanvasToOffset(t, e);
  }
  /** converts event coordinates from canvas2D to graph coordinates */
  convertEventToCanvasOffset(t) {
    var e = this.canvas.getBoundingClientRect();
    return this.convertCanvasToOffset([
      t.clientX - e.left,
      t.clientY - e.top
    ]);
  }
  getCanvasMenuOptions() {
    return N.prototype.getCanvasMenuOptions.apply(this, arguments);
  }
  getNodeMenuOptions(t) {
    return N.prototype.getNodeMenuOptions.apply(this, arguments);
  }
  getGroupMenuOptions(t) {
    return N.prototype.getGroupMenuOptions.apply(this, arguments);
  }
  checkPanels() {
    N.prototype.checkPanels.apply(this, arguments);
  }
  closePanels() {
    N.prototype.closePanels.apply(this, arguments);
  }
  createDialog(t, e) {
    return N.prototype.createDialog.apply(this, arguments);
  }
  createPanel(t, e = {}) {
    return N.prototype.createPanel.apply(this, arguments);
  }
  showSearchBox(t, e = {}) {
    return N.prototype.showSearchBox.apply(this, arguments);
  }
  prompt(t = "", e, i, n, s = !1) {
    return N.prototype.prompt.apply(this, arguments);
  }
  showConnectionMenu(t = {}) {
    return N.prototype.showConnectionMenu.apply(this, arguments);
  }
  showLinkMenu(t, e) {
    return N.prototype.showLinkMenu.apply(this, arguments);
  }
  showEditPropertyValue(t, e, i) {
    return N.prototype.showEditPropertyValue.apply(this, arguments);
  }
  showShowNodePanel(t) {
    N.prototype.showShowNodePanel.apply(this, arguments);
  }
  showSubgraphPropertiesDialog() {
    return N.prototype.showSubgraphPropertiesDialog.apply(this, arguments);
  }
  showSubgraphPropertiesDialogRight(t) {
    return N.prototype.showSubgraphPropertiesDialogRight.apply(this, arguments);
  }
  processContextMenu(t, e) {
    N.prototype.processContextMenu.apply(this, arguments);
  }
  /*
   * Events
   */
  processMouseMove(t) {
    return he.prototype.processMouseMove.apply(this, arguments);
  }
  processMouseDown(t) {
    return he.prototype.processMouseDown.apply(this, arguments);
  }
  processMouseUp(t) {
    return he.prototype.processMouseUp.apply(this, arguments);
  }
  processMouseWheel(t) {
    return he.prototype.processMouseWheel.apply(this, arguments);
  }
  /*
   * Rendering
   */
  setZoom(t, e) {
    H.prototype.setZoom.apply(this, arguments);
  }
  bringToFront(t) {
    H.prototype.bringToFront.apply(this, arguments);
  }
  sendToBack(t) {
    H.prototype.sendToBack.apply(this, arguments);
  }
  computeVisibleNodes(t, e = []) {
    return H.prototype.computeVisibleNodes.apply(this, arguments);
  }
  draw(t = !1, e = !1) {
    H.prototype.draw.apply(this, arguments);
  }
  drawFrontCanvas() {
    H.prototype.drawFrontCanvas.apply(this, arguments);
  }
  drawSubgraphPanel(t) {
    H.prototype.drawSubgraphPanel.apply(this, arguments);
  }
  drawSubgraphPanelLeft(t, e, i) {
    H.prototype.drawSubgraphPanelLeft.apply(this, arguments);
  }
  drawSubgraphPanelRight(t, e, i) {
    H.prototype.drawSubgraphPanelRight.apply(this, arguments);
  }
  drawButton(t, e, i, n, s, r = u.NODE_DEFAULT_COLOR, a = "#555", l = u.NODE_TEXT_COLOR) {
    return H.prototype.drawButton.apply(this, arguments);
  }
  drawBackCanvas() {
    H.prototype.drawBackCanvas.apply(this, arguments);
  }
  renderInfo(t, e = 10, i) {
    H.prototype.renderInfo.apply(this, arguments);
  }
  drawNode(t, e) {
    H.prototype.drawNode.apply(this, arguments);
  }
  drawLinkTooltip(t, e) {
    H.prototype.drawLinkTooltip.apply(this, arguments);
  }
  drawNodeShape(t, e, i, n, s, r, a) {
    H.prototype.drawNodeShape.apply(this, arguments);
  }
  drawConnections(t) {
    H.prototype.drawConnections.apply(this, arguments);
  }
  renderLink(t, e, i, n, s, r, a, l, o, h) {
    H.prototype.renderLink.apply(this, arguments);
  }
  computeConnectionPoint(t, e, i, n = k.RIGHT, s = k.LEFT) {
    return H.prototype.computeConnectionPoint.apply(this, arguments);
  }
  drawExecutionOrder(t) {
    H.prototype.drawExecutionOrder.apply(this, arguments);
  }
  drawNodeWidgets(t, e, i, n) {
    H.prototype.drawNodeWidgets.apply(this, arguments);
  }
  drawGroups(t, e) {
    H.prototype.drawGroups.apply(this, arguments);
  }
};
let T = ue;
T.DEFAULT_BACKGROUND_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNrs1rEKwjAUhlETUkj3vP9rdmr1Ysammk2w5wdxuLgcMHyptfawuZX4pJSWZTnfnu/lnIe/jNNxHHGNn//HNbbv+4dr6V+11uF527arU7+u63qfa/bnmh8sWLBgwYJlqRf8MEptXPBXJXa37BSl3ixYsGDBMliwFLyCV/DeLIMFCxYsWLBMwSt4Be/NggXLYMGCBUvBK3iNruC9WbBgwYJlsGApeAWv4L1ZBgsWLFiwYJmCV/AK3psFC5bBggULloJX8BpdwXuzYMGCBctgwVLwCl7Be7MMFixYsGDBsu8FH1FaSmExVfAxBa/gvVmwYMGCZbBg/W4vAQYA5tRF9QYlv/QAAAAASUVORK5CYII=";
T.node_colors = {
  red: { color: "#322", bgColor: "#533", groupcolor: "#A88" },
  brown: { color: "#332922", bgColor: "#593930", groupcolor: "#b06634" },
  green: { color: "#232", bgColor: "#353", groupcolor: "#8A8" },
  blue: { color: "#223", bgColor: "#335", groupcolor: "#88A" },
  pale_blue: { color: "#2a363b", bgColor: "#3f5159", groupcolor: "#3f789e" },
  cyan: { color: "#233", bgColor: "#355", groupcolor: "#8AA" },
  purple: { color: "#323", bgColor: "#535", groupcolor: "#a1309b" },
  yellow: { color: "#432", bgColor: "#653", groupcolor: "#b58b2a" },
  black: { color: "#222", bgColor: "#000", groupcolor: "#444" }
};
T.link_type_colors = {
  [A.ACTION]: u.ACTION_LINK_COLOR,
  [A.EVENT]: u.EVENT_LINK_COLOR,
  number: "#AAA",
  node: "#DCA"
};
T.active_canvas = null;
T.active_node = null;
T.onMenuCollapseAll = N.onMenuCollapseAll;
T.onMenuNodeEdit = N.onMenuNodeEdit;
T.onShowPropertyEditor = N.onShowPropertyEditor;
T.onGroupAdd = N.onGroupAdd;
T.onMenuAdd = N.onMenuAdd;
T.showMenuNodeOptionalInputs = N.showMenuNodeOptionalInputs;
T.showMenuNodeOptionalOutputs = N.showMenuNodeOptionalOutputs;
T.onShowMenuNodeProperties = N.onShowMenuNodeProperties;
T.onResizeNode = N.onResizeNode;
T.onMenuResizeNode = N.onMenuResizeNode;
T.onMenuNodeCollapse = N.onMenuNodeCollapse;
T.onMenuNodePin = N.onMenuNodePin;
T.onMenuNodeMode = N.onMenuNodeMode;
T.onMenuNodeColors = N.onMenuNodeColors;
T.onMenuNodeShapes = N.onMenuNodeShapes;
T.onMenuNodeRemove = N.onMenuNodeRemove;
T.onMenuNodeClone = N.onMenuNodeClone;
T.onMenuNodeToSubgraph = N.onMenuNodeToSubgraph;
class _e extends te {
  constructor(e) {
    super(e), this.properties = {
      name: "",
      type: "number",
      value: 0
    }, this.nameInGraph = "", this.size = [180, 90];
    let i = this;
    this.nameWidget = this.addWidget(
      "text",
      "Name",
      this.properties.name,
      function(n) {
        n && i.setProperty("name", n);
      }
    ), this.typeWidget = this.addWidget(
      "text",
      "Type",
      "" + this.properties.type,
      function(n) {
        n && i.setProperty("type", n);
      }
    ), this.valueWidget = this.addWidget(
      "number",
      "Value",
      this.properties.value,
      function(n) {
        i.setProperty("value", n);
      }
    ), this.widgets_up = !0;
  }
  onConfigure() {
    this.updateType();
  }
  /** ensures the type in the node output and the type in the associated graph input are the same */
  updateType() {
    var e = this.properties.type;
    this.typeWidget.value = "" + e, this.outputs[0].type != e && (u.isValidConnection(this.outputs[0].type, e) || this.disconnectOutput(0), this.outputs[0].type = e), e == "number" ? (this.valueWidget.type = "number", this.valueWidget.value = 0) : e == "boolean" ? (this.valueWidget.type = "toggle", this.valueWidget.value = !0) : e == "string" ? (this.valueWidget.type = "text", this.valueWidget.value = "") : (this.valueWidget.type = null, this.valueWidget.value = null), this.properties.value = this.valueWidget.value, this.graph && this.nameInGraph && typeof e == "string" ? this.graph.changeInputType(this.nameInGraph, e) : console.error("Can't change GraphInput to type", e, this.graph, this.nameInGraph);
  }
  /** this is executed AFTER the property has changed */
  onPropertyChanged(e, i) {
    if (e == "name") {
      if (i == "" || i == this.nameInGraph || i == "enabled")
        return !1;
      this.graph && (this.nameInGraph ? this.graph.renameInput(this.nameInGraph, i) : this.graph.addInput(i, "" + this.properties.type, null)), this.nameWidget.value = i, this.nameInGraph = i;
    } else
      e == "type" && this.updateType();
  }
  getTitle() {
    return this.flags.collapsed ? this.properties.name : this.title;
  }
  onAction(e, i) {
    this.properties.type == A.EVENT && this.triggerSlot(0, i);
  }
  onExecute() {
    var e = this.properties.name, i = this.graph.inputs[e];
    if (!i) {
      this.setOutputData(0, this.properties.value);
      return;
    }
    this.setOutputData(0, i.value !== void 0 ? i.value : this.properties.value);
  }
  onRemoved() {
    this.nameInGraph && this.graph.removeInput(this.nameInGraph);
  }
}
_e.slotLayout = {
  inputs: [
    { name: "", type: "number" }
  ],
  outputs: []
};
u.registerNodeType({
  class: _e,
  title: "Input",
  desc: "Input of the graph",
  type: "graph/input"
});
var Le = /* @__PURE__ */ ((t) => (t[t.STATUS_STOPPED = 1] = "STATUS_STOPPED", t[t.STATUS_RUNNING = 2] = "STATUS_RUNNING", t))(Le || {});
const Ee = class {
  constructor(t) {
    this.supported_types = null, this.vars = {}, this.extra = {}, this.inputs = {}, this.outputs = {}, this._nodes = [], this._groups = [], this._nodes_by_id = {}, this._nodes_executable = null, this._nodes_in_order = [], this._version = -1, this._last_trigger_time = 0, this._is_subgraph = !1, this._subgraph_node = null, this.nodes_executing = [], this.nodes_actioning = [], this.nodes_executedAction = [], this.execution_timer_id = -1, this.execution_time = 0, this.errors_in_execution = !1, this._input_nodes = [], u.debug && console.log("Graph created"), this.list_of_graphcanvas = null, this.clear(), t && this.configure(t);
  }
  getSupportedTypes() {
    return this.supported_types || Ee.DEFAULT_SUPPORTED_TYPES;
  }
  /** Removes all nodes from this graph */
  clear() {
    if (this.stop(), this.status = 1, this.last_node_id = 0, this.last_link_id = 0, this._version = -1, this._nodes)
      for (var t = 0; t < this._nodes.length; ++t) {
        var e = this._nodes[t];
        e.onRemoved && e.onRemoved();
      }
    this._nodes = [], this._nodes_by_id = {}, this._nodes_in_order = [], this._nodes_executable = null, this._groups = [], this.links = {}, this.iteration = 0, this.config = {}, this.vars = {}, this.extra = {}, this.globaltime = 0, this.runningtime = 0, this.fixedtime = 0, this.fixedtime_lapse = 0.01, this.elapsed_time = 0.01, this.last_update_time = 0, this.starttime = 0, this.catch_errors = !0, this.nodes_executing = [], this.nodes_actioning = [], this.nodes_executedAction = [], this.inputs = {}, this.outputs = {}, this.change(), this.sendActionToCanvas("clear");
  }
  /** Attach Canvas to this graph */
  attachCanvas(t) {
    if (!(t instanceof T))
      throw "attachCanvas expects a LGraphCanvas instance";
    t.graph && t.graph != this && t.graph.detachCanvas(t), t.graph = this, this.list_of_graphcanvas || (this.list_of_graphcanvas = []), this.list_of_graphcanvas.push(t);
  }
  /** Detach Canvas to this graph */
  detachCanvas(t) {
    if (this.list_of_graphcanvas) {
      var e = this.list_of_graphcanvas.indexOf(t);
      e != -1 && (t.graph = null, this.list_of_graphcanvas.splice(e, 1));
    }
  }
  /**
   * Starts running this graph every interval milliseconds.
   * @param interval amount of milliseconds between executions, if 0 then it renders to the monitor refresh rate
   */
  start(t) {
    if (this.status != 2) {
      this.status = 2, this.onPlayEvent && this.onPlayEvent(), this.sendEventToAllNodes("onStart"), this.starttime = u.getTime(), this.last_update_time = this.starttime, t = t || 0;
      var e = this;
      if (t == 0 && typeof window < "u" && window.requestAnimationFrame) {
        let i = function() {
          e.execution_timer_id == -1 && (window.requestAnimationFrame(i), e.onBeforeStep && e.onBeforeStep(), e.runStep(1, !e.catch_errors), e.onAfterStep && e.onAfterStep());
        };
        this.execution_timer_id = -1, i();
      } else
        this.execution_timer_id = setInterval(function() {
          e.onBeforeStep && e.onBeforeStep(), e.runStep(1, !e.catch_errors), e.onAfterStep && e.onAfterStep();
        }, t);
    }
  }
  /** Stops the execution loop of the graph */
  stop() {
    this.status != 1 && (this.status = 1, this.onStopEvent && this.onStopEvent(), this.execution_timer_id != null && (this.execution_timer_id != -1 && clearInterval(this.execution_timer_id), this.execution_timer_id = null), this.sendEventToAllNodes("onStop"));
  }
  /**
   * Run N steps (cycles) of the graph
   * @param num number of steps to run, default is 1
   * @param do_not_catch_errors if you want to try/catch errors
   */
  runStep(t = 1, e = !1, i) {
    var n = u.getTime();
    this.globaltime = 1e-3 * (n - this.starttime);
    let s = this._nodes_executable ? this._nodes_executable : this._nodes;
    if (s) {
      if (i = i || s.length, e) {
        for (var r = 0; r < t; r++) {
          for (var a = 0; a < i; ++a) {
            var l = s[a];
            l.mode == j.ALWAYS && l.onExecute && l.doExecute();
          }
          this.fixedtime += this.fixedtime_lapse, this.onExecuteStep && this.onExecuteStep();
        }
        this.onAfterExecute && this.onAfterExecute();
      } else
        try {
          for (var r = 0; r < t; r++) {
            for (var a = 0; a < i; ++a) {
              var l = s[a];
              l.mode == j.ALWAYS && l.onExecute && l.onExecute(null, {});
            }
            this.fixedtime += this.fixedtime_lapse, this.onExecuteStep && this.onExecuteStep();
          }
          this.onAfterExecute && this.onAfterExecute(), this.errors_in_execution = !1;
        } catch (p) {
          if (this.errors_in_execution = !0, u.throw_errors)
            throw p;
          u.debug && console.log("Error during execution: " + p), this.stop();
        }
      var o = u.getTime(), h = o - n;
      h == 0 && (h = 1), this.execution_time = 1e-3 * h, this.globaltime += 1e-3 * h, this.iteration += 1, this.elapsed_time = (o - this.last_update_time) * 1e-3, this.last_update_time = o, this.nodes_executing = [], this.nodes_actioning = [], this.nodes_executedAction = [];
    }
  }
  /**
   * Updates the graph execution order according to relevance of the nodes (nodes with only outputs have more relevance than
   * nodes with only inputs.
   */
  updateExecutionOrder() {
    this._nodes_in_order = this.computeExecutionOrder(!1), this._nodes_executable = [];
    for (var t = 0; t < this._nodes_in_order.length; ++t)
      if (this._nodes_in_order[t].onExecute) {
        let e = this._nodes_in_order[t];
        this._nodes_executable.push(e);
      }
  }
  /** This is more internal, it computes the executable nodes in order and returns it */
  computeExecutionOrder(t = !1, e) {
    for (var i = [], n = [], s = {}, r = {}, a = {}, l = 0, m = this._nodes.length; l < m; ++l) {
      var o = this._nodes[l];
      if (!(t && !o.onExecute)) {
        s[o.id] = o;
        var h = 0;
        if (o.inputs)
          for (var p = 0, d = o.inputs.length; p < d; p++)
            o.inputs[p] && o.inputs[p].link != null && (h += 1);
        h == 0 ? (n.push(o), e && (o._level = 1)) : (e && (o._level = 0), a[o.id] = h);
      }
    }
    for (; n.length != 0; ) {
      let y = n.shift();
      if (i.push(y), delete s[y.id], !!y.outputs)
        for (var l = 0; l < y.outputs.length; l++) {
          var c = y.outputs[l];
          if (!(c == null || c.links == null || c.links.length == 0))
            for (var p = 0; p < c.links.length; p++) {
              var _ = c.links[p], f = this.links[_];
              if (f && !r[f.id]) {
                var g = this.getNodeById(f.target_id);
                if (g == null) {
                  r[f.id] = !0;
                  continue;
                }
                e && (!g._level || g._level <= y._level) && (g._level = y._level + 1), r[f.id] = !0, a[g.id] -= 1, a[g.id] == 0 && n.push(g);
              }
            }
        }
    }
    for (let y in s)
      i.push(s[y]);
    i.length != this._nodes.length && u.debug && console.warn("something went wrong, nodes missing");
    for (var m = i.length, l = 0; l < m; ++l)
      i[l].order = l;
    i = i.sort(function(y, E) {
      var v = y.constructor.priority || y.priority || 0, b = E.constructor.priority || E.priority || 0;
      return v == b ? y.order - E.order : v - b;
    });
    for (var l = 0; l < m; ++l)
      i[l].order = l;
    return i;
  }
  /**
   * Returns all the nodes that could affect this one (ancestors) by crawling all the inputs recursively.
   * It doesn't include the node itself
   * @return an array with all the LGraphNodes that affect this node, in order of execution
   */
  getAncestors(t) {
    for (var e = [], i = [t], n = {}; i.length; ) {
      var s = i.shift();
      if (s.inputs) {
        !n[s.id] && s != t && (n[s.id] = !0, e.push(s));
        for (var r = 0; r < s.inputs.length; ++r) {
          var a = s.getInputNode(r);
          a && e.indexOf(a) == -1 && i.push(a);
        }
      }
    }
    return e.sort(function(l, o) {
      return l.order - o.order;
    }), e;
  }
  /**
   * Positions every node in a more readable manner
   */
  arrange(t = 100, e = se.HORIZONTAL_LAYOUT) {
    const i = this.computeExecutionOrder(!1, !0), n = [];
    for (let r = 0; r < i.length; ++r) {
      const a = i[r], l = a._level || 1;
      n[l] || (n[l] = []), n[l].push(a);
    }
    let s = t;
    for (let r = 0; r < n.length; ++r) {
      const a = n[r];
      if (!a)
        continue;
      let l = 100, o = t + u.NODE_TITLE_HEIGHT;
      for (let h = 0; h < a.length; ++h) {
        const p = a[h];
        p.pos[0] = e == se.VERTICAL_LAYOUT ? o : s, p.pos[1] = e == se.VERTICAL_LAYOUT ? s : o;
        const d = e == se.VERTICAL_LAYOUT ? 1 : 0;
        p.size[d] > l && (l = p.size[d]);
        const c = e == se.VERTICAL_LAYOUT ? 0 : 1;
        o += p.size[c] + t + u.NODE_TITLE_HEIGHT;
      }
      s += l + t;
    }
    this.setDirtyCanvas(!0, !0);
  }
  /**
   * Returns the amount of time the graph has been running in milliseconds
   * @return number of milliseconds the graph has been running
   */
  getTime() {
    return this.globaltime;
  }
  /**
   * Returns the amount of time accumulated using the fixedtime_lapse var. This is used in context where the time increments should be constant
   * @return number of milliseconds the graph has been running
   */
  getFixedTime() {
    return this.fixedtime;
  }
  /**
   * Returns the amount of time it took to compute the latest iteration. Take into account that this number could be not correct
   * if the nodes are using graphical actions
   * @return number of milliseconds it took the last cycle
   */
  getElapsedTime() {
    return this.elapsed_time;
  }
  /**
   * Sends an event to all the nodes, useful to trigger stuff
   * @param eventName the name of the event (function to be called)
   * @param params parameters in array format
   */
  sendEventToAllNodes(t, e = [], i = j.ALWAYS) {
    var n = this._nodes_in_order ? this._nodes_in_order : this._nodes;
    if (n)
      for (var s = 0, r = n.length; s < r; ++s) {
        var a = n[s];
        !a[t] || a.mode != i || (e === void 0 ? a[t]() : e && e.constructor === Array ? a[t].apply(a, e) : a[t](e));
      }
  }
  sendActionToCanvas(t, e = []) {
    if (this.list_of_graphcanvas)
      for (var i = 0; i < this.list_of_graphcanvas.length; ++i) {
        var n = this.list_of_graphcanvas[i];
        n[t] && n[t].apply(n, e);
      }
  }
  addGroup(t) {
    return this._groups.push(t), this.setDirtyCanvas(!0), this.change(), t.graph = this, this._version++, t;
  }
  /**
   * Adds a new node instance to this graph
   * @param node the instance of the node
   */
  add(t, e = {}) {
    if (t.id != -1 && this._nodes_by_id[t.id] != null && (console.warn(
      "LiteGraph: there is already a node with this ID, changing it"
    ), t.id = ++this.last_node_id), this._nodes.length >= u.MAX_NUMBER_OF_NODES)
      throw "LiteGraph: max number of nodes in a graph reached";
    return t.id == null || t.id == -1 ? t.id = ++this.last_node_id : this.last_node_id < t.id && (this.last_node_id = t.id), t.graph = this, this._version++, this._nodes.push(t), this._nodes_by_id[t.id] = t, t.onAdded && t.onAdded(this), this.config.align_to_grid && t.alignToGrid(), e.skipComputeOrder || this.updateExecutionOrder(), this.onNodeAdded && this.onNodeAdded(t), this.setDirtyCanvas(!0), this.change(), t;
  }
  /** Removes a node from the graph */
  remove(t) {
    if (t instanceof pe) {
      var e = this._groups.indexOf(t);
      e != -1 && this._groups.splice(e, 1), t.graph = null, this._version++, this.setDirtyCanvas(!0, !0), this.change();
      return;
    }
    if (this._nodes_by_id[t.id] != null && !t.ignore_remove) {
      if (this.beforeChange(), t.inputs)
        for (var i = 0; i < t.inputs.length; i++) {
          var n = t.inputs[i];
          n.link != null && t.disconnectInput(i);
        }
      if (t.outputs)
        for (var i = 0; i < t.outputs.length; i++) {
          let l = t.outputs[i];
          l.links != null && l.links.length && t.disconnectOutput(i);
        }
      if (t.onRemoved && t.onRemoved(), t.graph = null, this._version++, this.list_of_graphcanvas)
        for (var i = 0; i < this.list_of_graphcanvas.length; ++i) {
          var s = this.list_of_graphcanvas[i];
          s.selected_nodes[t.id] && delete s.selected_nodes[t.id], s.node_dragged == t && (s.node_dragged = null);
        }
      var r = this._nodes.indexOf(t);
      r != -1 && this._nodes.splice(r, 1), delete this._nodes_by_id[t.id], this.onNodeRemoved && this.onNodeRemoved(t), this.sendActionToCanvas("checkPanels"), this.setDirtyCanvas(!0, !0), this.afterChange(), this.change(), this.updateExecutionOrder();
    }
  }
  /** Returns a node by its id. */
  getNodeById(t) {
    return t == null ? null : this._nodes_by_id[t];
  }
  /**
   * Returns a list of nodes that matches a class
   * @param classObject the class itself (not an string)
   * @return a list with all the nodes of this type
   */
  findNodesByClass(t, e = []) {
    e.length = 0;
    for (var i = 0, n = this._nodes.length; i < n; ++i)
      this._nodes[i] instanceof t && e.push(this._nodes[i]);
    return e;
  }
  /**
   * Returns a list of nodes that matches a type
   * @param type the name of the node type
   * @return a list with all the nodes of this type
   */
  findNodesByType(i, e = []) {
    var i = i.toLowerCase();
    e.length = 0;
    for (var n = 0, s = this._nodes.length; n < s; ++n)
      this._nodes[n].type.toLowerCase() == i && e.push(this._nodes[n]);
    return e;
  }
  /**
   * Returns the first node that matches a name in its title
   * @param title the name of the node to search
   * @return the node or null
   */
  findNodeByTitle(t) {
    for (var e = 0, i = this._nodes.length; e < i; ++e)
      if (this._nodes[e].title == t)
        return this._nodes[e];
    return null;
  }
  /**
   * Returns a list of nodes that matches a name
   * @param title the name of the node to search
   * @return a list with all the nodes with this name
   */
  findNodesByTitle(t) {
    for (var e = [], i = 0, n = this._nodes.length; i < n; ++i)
      this._nodes[i].title == t && e.push(this._nodes[i]);
    return e;
  }
  /**
   * Returns the top-most node in this position of the canvas
   * @param x the x coordinate in canvas space
   * @param y the y coordinate in canvas space
   * @param nodesList a list with all the nodes to search from, by default is all the nodes in the graph
   * @return the node at this position or null
   */
  getNodeOnPos(t, e, i, n) {
    i = i || this._nodes;
    for (var s = null, r = i.length - 1; r >= 0; r--) {
      var a = i[r];
      if (a.isPointInside(t, e, n))
        return a;
    }
    return s;
  }
  /**
   * Returns the top-most group in that position
   * @param x the x coordinate in canvas space
   * @param y the y coordinate in canvas space
   * @return the group or null
   */
  getGroupOnPos(t, e) {
    for (var i = this._groups.length - 1; i >= 0; i--) {
      var n = this._groups[i];
      if (n.isPointInside(t, e, 2, !0))
        return n;
    }
    return null;
  }
  /**
   * Checks that the node type matches the node type registered, used when replacing a nodetype by a newer version during execution
   * this replaces the ones using the old version with the new version
   * @method checkNodeTypes
   */
  checkNodeTypes() {
    for (var t = !1, e = 0; e < this._nodes.length; e++) {
      var i = this._nodes[e], n = u.registered_node_types[i.type];
      if (i.constructor != n.class) {
        console.log("node being replaced by newer version: " + i.type);
        var s = u.createNode(i.type);
        t = !0, this._nodes[e] = s, s.configure(i.serialize()), s.graph = this, this._nodes_by_id[s.id] = s, i.inputs && (s.inputs = i.inputs.concat()), i.outputs && (s.outputs = i.outputs.concat());
      }
    }
    return this.updateExecutionOrder(), t;
  }
  onAction(t, e, i = {}) {
    this._input_nodes = this.findNodesByClass(_e, this._input_nodes);
    for (var n = 0; n < this._input_nodes.length; ++n) {
      var s = this._input_nodes[n];
      if (s.properties.name == t) {
        s.actionDo(t, e, i);
        break;
      }
    }
  }
  trigger(t, e) {
    this.onTrigger && this.onTrigger(t, e);
  }
  /** Tell this graph it has a global graph input of this type */
  addInput(t, e, i) {
    var n = this.inputs[t];
    n || (this.beforeChange(), this.inputs[t] = { name: t, type: e, value: i }, this._version++, this.afterChange(), this.onInputAdded && this.onInputAdded(t, e, i), this.onInputsOutputsChange && this.onInputsOutputsChange());
  }
  /** Assign a data to the global graph input */
  setInputData(t, e) {
    var i = this.inputs[t];
    i && (i.value = e);
  }
  /** Returns the current value of a global graph input */
  getInputData(t) {
    var e = this.inputs[t];
    return e ? e.value : null;
  }
  /** Changes the name of a global graph input */
  renameInput(t, e) {
    if (e != t)
      return this.inputs[t] ? this.inputs[e] ? (console.error("there is already one input with that name"), !1) : (this.inputs[e] = this.inputs[t], delete this.inputs[t], this._version++, this.onInputRenamed && this.onInputRenamed(t, e), this.onInputsOutputsChange && this.onInputsOutputsChange(), !0) : !1;
  }
  /** Changes the type of a global graph input */
  changeInputType(t, e) {
    if (!this.inputs[t])
      return !1;
    if (this.inputs[t].type && String(this.inputs[t].type).toLowerCase() == String(e).toLowerCase())
      return;
    const i = this.inputs[t].type;
    return this.inputs[t].type = e, this._version++, this.onInputTypeChanged && this.onInputTypeChanged(t, i, e), !0;
  }
  /** Removes a global graph input */
  removeInput(t) {
    return this.inputs[t] ? (delete this.inputs[t], this._version++, this.onInputRemoved && this.onInputRemoved(t), this.onInputsOutputsChange && this.onInputsOutputsChange(), !0) : !1;
  }
  /** Creates a global graph output */
  addOutput(t, e, i) {
    this.outputs[t] = { name: t, type: e, value: i }, this._version++, this.onOutputAdded && this.onOutputAdded(t, e, i), this.onInputsOutputsChange && this.onInputsOutputsChange();
  }
  /** Assign a data to the global output */
  setOutputData(t, e) {
    var i = this.outputs[t];
    i && (i.value = e);
  }
  /** Returns the current value of a global graph output */
  getOutputData(t) {
    var e = this.outputs[t];
    return e ? e.value : null;
  }
  /** Renames a global graph output */
  renameOutput(t, e) {
    return this.outputs[t] ? this.outputs[e] ? (console.error("there is already one output with that name"), !1) : (this.outputs[e] = this.outputs[t], delete this.outputs[t], this._version++, this.onOutputRenamed && this.onOutputRenamed(t, e), this.onInputsOutputsChange && this.onInputsOutputsChange(), !0) : !1;
  }
  /** Changes the type of a global graph output */
  changeOutputType(t, e) {
    if (!this.outputs[t])
      return !1;
    if (this.outputs[t].type && String(this.outputs[t].type).toLowerCase() == String(e).toLowerCase())
      return;
    const i = this.outputs[t].type;
    return this.outputs[t].type = e, this._version++, this.onOutputTypeChanged && this.onOutputTypeChanged(t, i, e), !0;
  }
  /** Removes a global graph output */
  removeOutput(t) {
    return this.outputs[t] ? (delete this.outputs[t], this._version++, this.onOutputRemoved && this.onOutputRemoved(t), this.onInputsOutputsChange && this.onInputsOutputsChange(), !0) : !1;
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
  beforeChange(t) {
    this.onBeforeChange && this.onBeforeChange(this, t), this.sendActionToCanvas("onBeforeChange", [this]);
  }
  /** used to resend actions, called after any change is made to the graph */
  afterChange(t) {
    this.onAfterChange && this.onAfterChange(this, t), this.sendActionToCanvas("onAfterChange", [this]);
  }
  connectionChange(t, e) {
    this.updateExecutionOrder(), this.onConnectionChange && this.onConnectionChange(t), this._version++, this.sendActionToCanvas("onConnectionChange");
  }
  /** returns if the graph is in live mode */
  isLive() {
    if (!this.list_of_graphcanvas)
      return !1;
    for (var t = 0; t < this.list_of_graphcanvas.length; ++t) {
      var e = this.list_of_graphcanvas[t];
      if (e.live_mode)
        return !0;
    }
    return !1;
  }
  /** clears the triggered slot animation in all links (stop visual animation) */
  clearTriggeredSlots() {
    for (var t in this.links) {
      var e = this.links[t];
      e && e._last_time && (e._last_time = 0);
    }
  }
  /* Called when something visually changed (not the graph!) */
  change() {
    u.debug && console.log("Graph changed"), this.sendActionToCanvas("setDirty", [!0, !0]), this.onChange && this.onChange(this);
  }
  setDirtyCanvas(t = !1, e = !1) {
    this.sendActionToCanvas("setDirty", [t, e]);
  }
  /** Destroys a link */
  removeLink(t) {
    var e = this.links[t];
    if (e) {
      var i = this.getNodeById(e.target_id);
      i && i.disconnectInput(e.target_slot);
    }
  }
  /** Creates a Object containing all the info about this graph, it can be serialized */
  serialize() {
    for (var t = [], e = 0, i = this._nodes.length; e < i; ++e)
      t.push(this._nodes[e].serialize());
    var n = [];
    for (const h in this.links) {
      var s = this.links[h];
      if (!s.serialize) {
        console.error(
          "weird LLink bug, link info is not a LLink but a regular object",
          s
        );
        var r = ne.configure(s);
        for (var a in s)
          r[a] = s[a];
        this.links[h] = r, s = r;
      }
      n.push(s.serialize());
    }
    for (var l = [], e = 0; e < this._groups.length; ++e)
      l.push(this._groups[e].serialize());
    var o = {
      last_node_id: this.last_node_id,
      last_link_id: this.last_link_id,
      nodes: t,
      links: n,
      groups: l,
      config: this.config,
      extra: this.extra,
      version: u.VERSION
    };
    return this.onSerialize && this.onSerialize(o), o;
  }
  /**
   * Configure a graph from a JSON string
   * @param data configure a graph from a JSON string
   * @returns if there was any error parsing
   */
  configure(t, e) {
    if (t) {
      e || this.clear();
      var i = t.nodes;
      if (t.links && t.links.constructor === Array) {
        for (var n = [], s = 0; s < t.links.length; ++s) {
          var r = t.links[s];
          if (!r) {
            console.warn("serialized graph link data contains errors, skipping.");
            continue;
          }
          var a = ne.configure(r);
          n[a.id] = a;
        }
        t.links = n;
      }
      for (const c in t)
        c == "nodes" || c == "groups" || (this[c] = t[c]);
      var l = !1;
      if (this._nodes = [], i) {
        for (var s = 0, o = i.length; s < o; ++s) {
          var h = i[s], p = u.createNode(h.type, h.title);
          p || (u.debug && console.log(
            "Node not found or has errors: " + h.type
          ), p = new te(), p.last_serialization = h, p.has_errors = !0, l = !0), p.id = h.id, this.add(p, { skipComputeOrder: !0 });
        }
        for (var s = 0, o = i.length; s < o; ++s) {
          var h = i[s], p = this.getNodeById(h.id);
          p && p.configure(h);
        }
      }
      if (this._groups.length = 0, t.groups)
        for (var s = 0; s < t.groups.length; ++s) {
          var d = new pe();
          d.configure(t.groups[s]), this.addGroup(d);
        }
      return this.updateExecutionOrder(), this.extra = t.extra || {}, this.onConfigure && this.onConfigure(t), this._version++, this.setDirtyCanvas(!0, !0), l;
    }
  }
  load(t, e) {
    var i = this;
    if (t.constructor === File || t.constructor === Blob) {
      var n = new FileReader();
      n.addEventListener("load", function(r) {
        var a = JSON.parse(n.result);
        i.configure(a), e && e(a);
      }), n.readAsText(t);
      return;
    }
    var s = new XMLHttpRequest();
    s.open("GET", t, !0), s.send(null), s.onload = function(r) {
      if (s.status !== 200) {
        console.error("Error loading graph:", s.status, s.response);
        return;
      }
      var a = JSON.parse(s.response);
      i.configure(a), e && e(a);
    }, s.onerror = function(r) {
      console.error("Error loading graph:", r);
    };
  }
};
let Ce = Ee;
Ce.DEFAULT_SUPPORTED_TYPES = ["number", "string", "boolean"];
class Oe extends te {
  constructor(e) {
    super(e), this.properties = {
      name: "",
      type: "number"
    }, this.nameInGraph = "", this.size = [180, 60], this.nameWidget = this.addWidget("text", "Name", this.properties.name, "name"), this.typeWidget = this.addWidget("text", "Type", "" + this.properties.type, "type"), this.widgets_up = !0;
  }
  onConfigure() {
    this.updateType();
  }
  updateType() {
    var e = this.properties.type;
    this.typeWidget && (this.typeWidget.value = "" + e), this.inputs[0].type != e && ((e == "action" || e == "event") && (e = A.EVENT), u.isValidConnection(this.inputs[0].type, e) || this.disconnectInput(0), this.inputs[0].type = e), this.graph && this.nameInGraph && typeof e == "string" ? this.graph.changeOutputType(this.nameInGraph, e) : console.error("Can't change GraphOutput to type", e, this.graph, this.nameInGraph);
  }
  /** this is executed AFTER the property has changed */
  onPropertyChanged(e, i) {
    if (e == "name") {
      if (i == "" || i == this.nameInGraph || i == "enabled")
        return !1;
      this.graph && (this.nameInGraph ? this.graph.renameOutput(this.nameInGraph, i) : this.graph.addOutput(i, "" + this.properties.type, null)), this.nameWidget.value = i, this.nameInGraph = i;
    } else
      e == "type" && this.updateType();
  }
  getTitle() {
    return this.flags.collapsed ? this.properties.name : this.title;
  }
  onAction(e, i) {
    this.properties.type == A.ACTION && this.graph.trigger(this.properties.name, i);
  }
  onExecute() {
    const e = this.getInputData(0);
    this.graph.setOutputData(this.properties.name, e);
  }
  onRemoved() {
    this.nameInGraph && this.graph.removeOutput(this.nameInGraph);
  }
}
Oe.slotLayout = {
  inputs: [
    { name: "", type: "" }
  ],
  outputs: []
};
u.registerNodeType({
  class: Oe,
  title: "Output",
  desc: "Output of the graph",
  type: "graph/output"
});
class ce extends te {
  constructor(e) {
    super(e), this.properties = {
      enabled: !0
    }, this.size = [140, 80], this.enabled = !0, this.subgraph = new Ce(), this.subgraph._subgraph_node = this, this.subgraph._is_subgraph = !0, this.subgraph.onTrigger = this.onSubgraphTrigger.bind(this), this.subgraph.onInputAdded = this.onSubgraphNewInput.bind(this), this.subgraph.onInputRenamed = this.onSubgraphRenamedInput.bind(this), this.subgraph.onInputTypeChanged = this.onSubgraphTypeChangeInput.bind(this), this.subgraph.onInputRemoved = this.onSubgraphRemovedInput.bind(this), this.subgraph.onOutputAdded = this.onSubgraphNewOutput.bind(this), this.subgraph.onOutputRenamed = this.onSubgraphRenamedOutput.bind(this), this.subgraph.onOutputTypeChanged = this.onSubgraphTypeChangeOutput.bind(this), this.subgraph.onOutputRemoved = this.onSubgraphRemovedOutput.bind(this);
  }
  onDblClick(e, i, n) {
    var s = this;
    setTimeout(function() {
      n.openSubgraph(s.subgraph);
    }, 10);
  }
  onAction(e, i) {
    this.subgraph.onAction(e, i);
  }
  onExecute() {
    if (this.enabled = this.getInputOrProperty("enabled"), !!this.enabled) {
      if (this.inputs)
        for (var e = 0; e < this.inputs.length; e++) {
          var i = this.inputs[e], n = this.getInputData(e);
          this.subgraph.setInputData(i.name, n);
        }
      if (this.subgraph.runStep(), this.outputs)
        for (var e = 0; e < this.outputs.length; e++) {
          var s = this.outputs[e], n = this.subgraph.getOutputData(s.name);
          this.setOutputData(e, n);
        }
    }
  }
  sendEventToAllNodes(e, i, n) {
    this.enabled && this.subgraph.sendEventToAllNodes(e, i, n);
  }
  onDrawBackground(e, i, n, s) {
    if (this.flags.collapsed)
      return;
    var r = this.size[1] - u.NODE_TITLE_HEIGHT + 0.5, a = u.isInsideRectangle(s[0], s[1], this.pos[0], this.pos[1] + r, this.size[0], u.NODE_TITLE_HEIGHT);
    let l = u.isInsideRectangle(s[0], s[1], this.pos[0], this.pos[1] + r, this.size[0] / 2, u.NODE_TITLE_HEIGHT);
    e.fillStyle = a ? "#555" : "#222", e.beginPath(), this.shape == S.BOX_SHAPE ? l ? e.rect(0, r, this.size[0] / 2 + 1, u.NODE_TITLE_HEIGHT) : e.rect(this.size[0] / 2, r, this.size[0] / 2 + 1, u.NODE_TITLE_HEIGHT) : l ? e.roundRect(0, r, this.size[0] / 2 + 1, u.NODE_TITLE_HEIGHT, [0, 0, 8, 8]) : e.roundRect(this.size[0] / 2, r, this.size[0] / 2 + 1, u.NODE_TITLE_HEIGHT, [0, 0, 8, 8]), a ? e.fill() : e.fillRect(0, r, this.size[0] + 1, u.NODE_TITLE_HEIGHT), e.textAlign = "center", e.font = "24px Arial", e.fillStyle = a ? "#DDD" : "#999", e.fillText("+", this.size[0] * 0.25, r + 24), e.fillText("+", this.size[0] * 0.75, r + 24);
  }
  // override onMouseDown(e, localpos, graphcanvas)
  // {
  // 	var y = this.size[1] - LiteGraph.NODE_TITLE_HEIGHT + 0.5;
  // 	if(localpos[1] > y)
  // 	{
  // 		graphcanvas.showSubgraphPropertiesDialog(this);
  // 	}
  // }
  onMouseDown(e, i, n) {
    var s = this.size[1] - u.NODE_TITLE_HEIGHT + 0.5;
    return console.log(0), i[1] > s && (i[0] < this.size[0] / 2 ? (console.log(1), n.showSubgraphPropertiesDialog(this)) : (console.log(2), n.showSubgraphPropertiesDialogRight(this))), !1;
  }
  computeSize() {
    var e = this.inputs ? this.inputs.length : 0, i = this.outputs ? this.outputs.length : 0;
    return [200, Math.max(e, i) * u.NODE_SLOT_HEIGHT + u.NODE_TITLE_HEIGHT];
  }
  //**** INPUTS ***********************************
  onSubgraphTrigger(e, i) {
    var n = this.findOutputSlotIndexByName(e);
    n != -1 && this.triggerSlot(n);
  }
  onSubgraphNewInput(e, i) {
    var n = this.findInputSlotIndexByName(e);
    n == -1 && this.addInput(e, i);
  }
  onSubgraphRenamedInput(e, i) {
    var n = this.findInputSlotIndexByName(e);
    if (n != -1) {
      var s = this.getInputInfo(n);
      s.name = i;
    }
  }
  onSubgraphTypeChangeInput(e, i) {
    var n = this.findInputSlotIndexByName(e);
    if (n != -1) {
      var s = this.getInputInfo(n);
      s.type = i;
    }
  }
  onSubgraphRemovedInput(e) {
    var i = this.findInputSlotIndexByName(e);
    i != -1 && this.removeInput(i);
  }
  //**** OUTPUTS ***********************************
  onSubgraphNewOutput(e, i) {
    var n = this.findOutputSlotIndexByName(e);
    n == -1 && this.addOutput(e, i);
  }
  onSubgraphRenamedOutput(e, i) {
    var n = this.findOutputSlotIndexByName(e);
    if (n != -1) {
      var s = this.getOutputInfo(n);
      s.name = i;
    }
  }
  onSubgraphTypeChangeOutput(e, i) {
    var n = this.findOutputSlotIndexByName(e);
    if (n != -1) {
      var s = this.getOutputInfo(n);
      s.type = i;
    }
  }
  onSubgraphRemovedOutput(e) {
    var i = this.findInputSlotIndexByName(e);
    i != -1 && this.removeOutput(i);
  }
  // *****************************************************
  getExtraMenuOptions(e, i) {
    var n = this;
    return [
      {
        content: "Open",
        callback: function() {
          e.openSubgraph(n.subgraph);
        }
      }
    ];
  }
  onResize(e) {
    console.error("TEST subgraph resize"), e[1] += 20;
  }
  serialize() {
    var e = te.prototype.serialize.call(this);
    return e.subgraph = this.subgraph.serialize(), e;
  }
  //no need to define node.configure, the default method detects node.subgraph and passes the object to node.subgraph.configure()
  clone() {
    var e = u.createNode(this.type), i = this.serialize();
    return delete i.id, delete i.inputs, delete i.outputs, e.configure(i), e;
  }
  buildFromNodes(e) {
    for (var i = {}, n = 0, s = 0; s < e.length; ++s) {
      var r = e[s];
      i[r.id] = r, n = Math.min(r.pos[0], n), Math.max(r.pos[0], n);
    }
    for (var s = 0; s < e.length; ++s) {
      var r = e[s];
      if (r.inputs)
        for (var a = 0; a < r.inputs.length; ++a) {
          var l = r.inputs[a];
          if (!(!l || !l.link)) {
            var o = r.graph.links[l.link];
            o && (i[o.origin_id] || this.subgraph.addInput(l.name, o.type));
          }
        }
      if (r.outputs)
        for (var a = 0; a < r.outputs.length; ++a) {
          var h = r.outputs[a];
          if (!(!h || !h.links || !h.links.length))
            for (var p = !1, d = 0; d < h.links.length; ++d) {
              var o = r.graph.links[h.links[d]];
              if (o && !i[o.target_id]) {
                p = !0;
                break;
              }
            }
        }
    }
  }
}
ce.slotLayout = {
  inputs: [],
  outputs: []
};
ce.propertyLayout = [
  { name: "enabled", defaultValue: !0 }
];
ce.optionalSlots = {
  outputs: [
    { name: "enabled", type: "boolean" }
  ]
};
u.registerNodeType({
  class: ce,
  title: "Subgraph",
  desc: "Graph inside a node",
  title_color: "#334",
  type: "basic/subgraph"
});
export {
  S as BuiltInSlotShape,
  A as BuiltInSlotType,
  X as ContextMenu,
  x as ContextMenuSpecialItem,
  k as Dir,
  Ae as DragAndScale,
  _e as GraphInput,
  Oe as GraphOutput,
  W as LConnectionKind,
  Ce as LGraph,
  T as LGraphCanvas,
  he as LGraphCanvas_Events,
  H as LGraphCanvas_Rendering,
  N as LGraphCanvas_UI,
  pe as LGraphGroup,
  te as LGraphNode,
  Le as LGraphStatus,
  ne as LLink,
  se as LayoutDirection,
  le as LinkRenderMode,
  we as LinkRenderModeNames,
  u as LiteGraph,
  ye as NODE_MODE_COLORS,
  ie as NODE_MODE_NAMES,
  j as NodeMode,
  be as SLOT_SHAPE_NAMES,
  ce as Subgraph,
  ee as TitleMode,
  Se as clamp,
  Te as getStaticProperty,
  de as getStaticPropertyOnInstance
};

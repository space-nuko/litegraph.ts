import LGraph from "./LGraph"
import LGraphCanvas from "./LGraphCanvas"
import LGraphNode from "./LGraphNode"
import LiteGraph from "./LiteGraph"
import { Vector2, Vector4 } from "./types"

export type SerializedLGraphGroup = {
    title: LGraphGroup["title"];
    bounding: Vector4;
    color: LGraphGroup["color"];
    font: LGraphGroup["font"];
};

export default class LGraphGroup {
    title: string;
    color: string;
    font: string;
    fontSize: number = 24;
    private _nodes: LGraphNode[] = [];
    graph?: LGraph = null
    private _bounding: Float32Array = new Float32Array([10, 10, 140, 80]);

    private _pos: Float32Array;

    get pos(): Vector2 {
        return [this._pos[0], this._pos[1]];
    }

    set pos(v: Vector2) {
        if (!v || v.length < 2) {
            return;
        }
        this._pos[0] = v[0];
        this._pos[1] = v[1];
    }

    private _size: Float32Array;

    get size(): Vector2 {
        return [this._size[0], this._size[1]];
    }

    set size(v: Vector2) {
        if (!v || v.length < 2) {
            return;
        }
        this._size[0] = Math.max(140, v[0]);
        this._size[1] = Math.max(80, v[1]);
    }

    constructor(title: string = "Group") {
        this.title = title;
        this.color = LGraphCanvas.node_colors.pale_blue
            ? LGraphCanvas.node_colors.pale_blue.groupcolor
            : "#AAA";
    }

    configure(o: SerializedLGraphGroup): void {
        const b = o.bounding;
        this.title = o.title;
        this._bounding.set(o.bounding);
        this.color = o.color;
        this.font = o.font;
    }

    serialize(): SerializedLGraphGroup {
        const b = this._bounding;
        return {
            title: this.title,
            bounding: [
                Math.round(b[0]),
                Math.round(b[1]),
                Math.round(b[2]),
                Math.round(b[3])
            ],
            color: this.color,
            font: this.font
        };
    }

    move(deltaX: number, deltaY: number, ignoreNodes?: boolean): void {
        this._pos[0] += deltaX;
        this._pos[1] += deltaY;
        if (ignoreNodes) {
            return;
        }
        for (var i = 0; i < this._nodes.length; ++i) {
            var node = this._nodes[i];
            node.pos[0] += deltaX;
            node.pos[1] += deltaY;
        }
    }

    recomputeInsideNodes(): void {
        this._nodes.length = 0;
        var nodes = (this.graph as any)._nodes;
        var node_bounding = new Float32Array(4);

        for (var i = 0; i < nodes.length; ++i) {
            var node = nodes[i];
            node.getBounding(node_bounding);
            if (!LiteGraph.overlapBounding(this._bounding, node_bounding)) {
                continue;
            } //out of the visible area
            this._nodes.push(node);
        }
    }

    isPointInside: LGraphNode["isPointInside"];
    setDirtyCanvas: LGraphNode["setDirtyCanvas"];
}

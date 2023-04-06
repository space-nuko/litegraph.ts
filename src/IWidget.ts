import LGraphCanvas from "./LGraphCanvas"
import LGraphNode from "./LGraphNode"
import type { Vector2, WidgetTypes } from "./types"

export type WidgetCallback<T extends IWidget = IWidget> = (
    this: T,
    value: T["value"],
    graphCanvas: LGraphCanvas,
    node: LGraphNode,
    pos: Vector2,
    event?: MouseEvent
) => void;

export default interface IWidget<TValue = any, TOptions = any> {
    name: string | null;
    value: TValue;
    options?: TOptions;
    type?: WidgetTypes;
    y?: number;
    property?: string;
    last_y?: number;
    width?: number;
    clicked?: boolean;
    marker?: boolean;
    disabled?: boolean;
    callback?: WidgetCallback<this>;
    /** Called by `LGraphCanvas.drawNodeWidgets` */
    draw?(
        ctx: CanvasRenderingContext2D,
        node: LGraphNode,
        width: number,
        posY: number,
        height: number
    ): void;
    /**
     * Called by `LGraphCanvas.processNodeWidgets`
     * https://github.com/jagenjo/litegraph.js/issues/76
     */
    mouse?(
        event: MouseEvent,
        pos: Vector2,
        node: LGraphNode
    ): boolean;
    /** Called by `LGraphNode.computeSize` */
    computeSize?(width: number): [number, number];
}
export interface IButtonWidget extends IWidget<null, {}> {
    type: "button";
}
export interface IToggleWidget
extends IWidget<boolean, { on?: string; off?: string }> {
    type: "toggle";
}
export interface ISliderWidget
extends IWidget<number, { max: number; min: number }> {
    type: "slider";
}
export interface INumberWidget extends IWidget<number, { precision: number }> {
    type: "number";
}
export interface IComboWidget
extends IWidget<
    string[],
{
        values:
            | string[]
            | ((widget: IComboWidget, node: LGraphNode) => string[]);
    }
    > {
        type: "combo";
    }

export interface ITextWidget extends IWidget<string, {}> {
    type: "text";
}

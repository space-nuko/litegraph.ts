import type { ContextMenuEventListener } from "./ContextMenu";
import LGraphCanvas from "./LGraphCanvas"
import LGraphNode, { SerializedLGraphNode } from "./LGraphNode"
import type { Vector2, WidgetTypes } from "./types"

export type WidgetCallback<T extends IWidget> = (
    this: T,
    value: T["value"],
    graphCanvas: LGraphCanvas,
    node: LGraphNode,
    pos: Vector2,
    event?: MouseEvent
) => void;

export type WidgetPanelCallback = (name: string, value: any, options: any & WidgetPanelOptions) => void;

export interface WidgetPanelOptions {
    type?: string;
    label?: string;
    callback?: WidgetPanelCallback;
    property?: string;
}

export default interface IWidget<TOptions = any, TValue = any> {
    name: string | null;
    value: TValue;
    options?: TOptions;
    type?: WidgetTypes | string;
    y?: number;
    property?: string;
    last_y?: number;
    width?: number;
    clicked?: boolean;
    marker?: boolean;
    disabled?: boolean;
    hidden?: boolean;
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
    serializeValue?(serialized: SerializedLGraphNode<LGraphNode>, slot: number): Promise<any>;
}
export interface IButtonWidget extends IWidget<{}, null> {
    type: "button";
}
export interface IToggleWidgetOptions extends WidgetPanelOptions {
    on?: string; off?: string
}
export interface IToggleWidget
    extends IWidget<IToggleWidgetOptions, boolean> {
    type: "toggle";
}
export interface ISliderWidgetOptions extends WidgetPanelOptions {
    max: number; min: number
}
export interface ISliderWidget
    extends IWidget<ISliderWidgetOptions, number> {
    type: "slider";
}
export interface INumberWidgetOptions extends WidgetPanelOptions {
    min?: number;
    max?: number;
    step?: number;
    precision: number
}
export interface INumberWidget extends IWidget<INumberWidgetOptions, number> {
    type: "number";
}
export interface IComboWidgetOptions extends WidgetPanelOptions {
    values:
    | string[]
    | ((widget: IComboWidget, node: LGraphNode) => string[]);
}
export interface IComboWidget
    extends IWidget<IComboWidgetOptions, string> {
    type: "combo";
}
export interface ITextWidgetOptions extends WidgetPanelOptions {
    multiline: boolean;
    inputStyle?: Partial<CSSStyleDeclaration>;
    max_length?: number
}
export interface ITextWidget extends IWidget<{}, string> {
    type: "text";
}
export interface IEnumWidgetOptions extends WidgetPanelOptions {
    values: string[]
}
export interface IEnumWidget
    extends IWidget<IEnumWidgetOptions, string[]> {
    type: "enum";
}

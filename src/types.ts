export enum Dir {
    UP = 1,
    DOWN,
    LEFT,
    RIGHT,
    CENTER
}

export enum NodeMode {
    ALWAYS = 0,
    ON_EVENT,
    NEVER,
    ON_TRIGGER
}
export const NodeModeNames = ["Always", "On Event", "Never", "On Trigger"] // helper, will add "On Request" and more in the future
export const NodeModeColors = ["#666","#422","#333","#224","#626"] // use with node_box_coloured_by_mode

export type Vector2 = [number, number];
export type Vector4 = [number, number, number, number];
export type WidgetTypes =
    | "number"
    | "slider"
    | "combo"
    | "text"
    | "toggle"
    | "button";

//shapes are used for nodes but also for slots
export enum BuiltInSlotShape {
    DEFAULT = 0,
    BOX_SHAPE,
    ROUND_SHAPE,
    CIRCLE_SHAPE,
    CARD_SHAPE,
    ARROW_SHAPE,
    SQUARE_SHAPE,
}
export type SlotShape =
    BuiltInSlotShape
    | number; // For custom shapes

export const SlotShapeNames = ["default", "box", "round", "circle", "card", "arrow", "square"];


export enum LConnectionKind {
    INPUT,
    OUTPUT
}

export enum LinkRenderMode {
    STRAIGHT_LINK = 0,
    LINEAR_LINK,
    SPLINE_LINK,
}
export const LinkRenderModeNames = ["Straight", "Linear", "Spline"]

export enum TitleType {
    NORMAL_TITLE = 0,
    NO_TITLE,
    TRANSPARENT_TITLE,
    AUTOHIDE_TITLE
}

export enum SlotType {
    EVENT = -1, //for outputs
    ACTION = -1 //for inputs
}

export type Version = number;

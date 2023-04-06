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
    ON_TRIGGER,
    ON_REQUEST
}
export const NODE_MODE_NAMES = ["Always", "On Event", "Never", "On Trigger"] // helper, will add "On Request" and more in the future
export const NODE_MODE_COLORS = ["#666","#422","#333","#224","#626"] // use with node_box_coloured_by_mode

export type Vector2 = [number, number];
export type Vector4 = [number, number, number, number];
export type WidgetTypes =
    | "number"
    | "slider"
    | "combo"
    | "string"
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
    GRID_SHAPE,
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

export enum BuiltInSlotType {
    EVENT = -2, //for outputs
    ACTION = -1, //for inputs
    DEFAULT = 0
}

export type SlotType =
    BuiltInSlotType
    | string;

export type Version = number;

export type PointerEventsMethod = "mouse" | "pointer" | "touch";

export enum LayoutDirection {
    VERTICAL_LAYOUT = "vertical",
    HORIZONTAL_LAYOUT = "horizontal",
}

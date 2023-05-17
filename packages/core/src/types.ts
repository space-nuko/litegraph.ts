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
export const NODE_MODE_COLORS = ["#666", "#422", "#333", "#224", "#626"] // use with node_box_coloured_by_mode

export type UUID = string;
export type NodeID = number | UUID;
export type LinkID = number | UUID;

export type Vector2 = [number, number];
export type Vector4 = [number, number, number, number];
export type WidgetTypes =
    | "number"
    | "slider"
    | "combo"
    | "string"
    | "text"
    | "toggle"
    | "enum"
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

export const SLOT_SHAPE_NAMES = ["default", "box", "round", "circle", "card", "arrow", "square"];


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

export enum TitleMode {
    NORMAL_TITLE = 0,
    NO_TITLE,
    TRANSPARENT_TITLE,
    AUTOHIDE_TITLE
}

export enum BuiltInSlotType {
    // The string names of the two event types are "_event_" for filtering purposes.
    EVENT = -2, //for outputs
    ACTION = -1, //for inputs

    DEFAULT = 0
}

export type SlotType =
    BuiltInSlotType
    | "" | "*" | "array" | "object" | "number" | "string" | "enum" | "boolean" | "table"
    | string;

export const BASE_SLOT_TYPES = ["*", "array", "object", "number", "string", "enum", "boolean", "table"];

export type Version = number;

export type PointerEventsMethod = "mouse" | "pointer" | "touch";

export enum LayoutDirection {
    VERTICAL_LAYOUT = "vertical",
    HORIZONTAL_LAYOUT = "horizontal",
}

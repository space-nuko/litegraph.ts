import type { Dir, SlotShape, SlotType, Vector2 } from "./types"
import LLink from "./LLink"

/** https://github.com/jagenjo/litegraph.js/tree/master/guides#node-slots */
export default interface INodeSlot {
    name: string;
    type: SlotType;
    label?: string;
    dir?: Dir;
    color_on?: string;
    color_off?: string;
    shape?: SlotShape;
    locked?: boolean;
    nameLocked?: boolean;
    optional?: boolean;
    _data?: any;
    pos?: Vector2
    slot_index?: number;
    removable?: boolean;
    properties: Record<string, any>;
}

export interface INodeInputSlot extends INodeSlot {
    link: LLink["id"] | null;
    not_subgraph_input?: boolean;
}
export interface INodeOutputSlot extends INodeSlot {
    links: LLink["id"][] | null;
    not_subgraph_output?: boolean;
}

export type SlotInPosition = {
    input?: INodeInputSlot;
    output?: INodeOutputSlot;
    slot: number;
    link_pos: Vector2;
}

export type SlotIndex = number;
export type SlotNameOrIndex = string | SlotIndex;

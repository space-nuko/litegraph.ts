import { Dir, SlotShape } from "./types"
import LLink from "./LLink"

/** https://github.com/jagenjo/litegraph.js/tree/master/guides#node-slots */
export default interface INodeSlot {
    name: string;
    type: string | -1;
    label?: string;
    dir?: Dir;
    color_on?: string;
    color_off?: string;
    shape?: SlotShape;
    locked?: boolean;
    nameLocked?: boolean;
}

export interface INodeInputSlot extends INodeSlot {
    link: LLink["id"] | null;
}
export interface INodeOutputSlot extends INodeSlot {
    links: LLink["id"][] | null;
}

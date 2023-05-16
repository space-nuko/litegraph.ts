import type { SlotType, Vector2 } from "./types";
import { LinkID, NodeID } from "./types";

export type SerializedLLink = [LinkID, NodeID, number, NodeID, number, SlotType];

export default class LLink {
    id: LinkID;
    type: SlotType;
    origin_id: NodeID;
    origin_slot: number;
    target_id: NodeID;
    target_slot: number;
    data?: any = null;
    _pos?: Vector2 = [0, 0]; // center
    color?: string;

    _last_time: number = 0;

    constructor(
        id: LinkID,
        type: SlotType,
        origin_id: NodeID,
        origin_slot: number,
        target_id: NodeID,
        target_slot: number
    ) {
        this.id = id;
        this.type = type;
        this.origin_id = origin_id;
        this.origin_slot = origin_slot;
        this.target_id = target_id;
        this.target_slot = target_slot;
    }

    static configure(o: LLink | SerializedLLink): LLink {
        if (o instanceof Array) {
            return new LLink(o[0], o[5], o[1], o[2], o[3], o[4])
        }
        else {
            return new LLink(o.id, o.type, o.origin_id, o.origin_slot, o.target_id, o.target_slot)
        }
    }

    serialize(): SerializedLLink {
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

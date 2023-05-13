import type { SlotType, Vector2 } from "./types";
import { UUID } from "./utils";

export type SerializedLLink = [number | UUID, number | UUID, number, number | UUID, number, SlotType];

export default class LLink {
    id: number | UUID;
    type: SlotType;
    origin_id: number | UUID;
    origin_slot: number;
    target_id: number | UUID;
    target_slot: number;
    data?: any = null;
    _pos?: Vector2 = [0, 0]; // center
    color?: string;

    _last_time: number = 0;

    constructor(
        id: number | UUID,
        type: SlotType,
        origin_id: number | UUID,
        origin_slot: number,
        target_id: number | UUID,
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

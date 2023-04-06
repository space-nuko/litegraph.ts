import { SlotType, Vector2 } from "./types";

export type SerializedLLink = [number, string, number, number, number, number];

export default class LLink {
    id: number;
    type: SlotType;
    origin_id: number;
    origin_slot: number;
    target_id: number;
    target_slot: number;
    data?: any;
    _pos?: Vector2;
    color?: string;

    _last_time: number = 0;

    constructor(
        id: number,
        type: SlotType,
        origin_id: number,
        origin_slot: number,
        target_id: number,
        target_slot: number
    );
    configure(o: LLink | SerializedLLink): void;
    serialize(): SerializedLLink;
}

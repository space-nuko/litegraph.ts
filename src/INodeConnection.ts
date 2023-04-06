import type { Vector2 } from "./types";

export default interface INodeConnection {
    name: string;
    type: string;
    pos: Vector2;
    direction: string;
    links: null;
}

interface CanvasRenderingContext2D {
    /** like rect but rounded corners */
    roundRect(
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        radiusLow: number
    ): void;
}

export const clamp = function(v, a, b) {
    return a > v ? a : b < v ? b : v;
};

export function getStaticProperty<T>(type: new (...args: any[]) => any, name: string): T {
    if (name in type) {
        return type[name] as T;
    }
    return null;
}

export function getStaticPropertyOnInstance<T>(type: any, name: string): T {
    if (name in type.constructor) {
        return type.constructor[name] as T;
    }
    return null;
}

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

declare global {
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

    interface Math {
        clamp(v: number, min: number, max: number): number;
    }
}

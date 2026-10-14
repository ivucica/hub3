declare module 'bwip-js' {
  export interface ToCanvasOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    textxalign?: string;
    columns?: number;
    rows?: number;
    security?: number;
    eclevel?: string;
    [key: string]: any;
  }

  export function toCanvas(
    canvas: HTMLCanvasElement | string,
    opts: ToCanvasOptions,
    callback?: (err?: Error, cvs?: HTMLCanvasElement) => void
  ): HTMLCanvasElement;

  export function toSVG(opts: ToCanvasOptions): string;

  const bwipjs: {
    toCanvas: typeof toCanvas;
    toSVG: typeof toSVG;
  };

  export default bwipjs;
}

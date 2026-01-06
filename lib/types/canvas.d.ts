declare module 'canvas' {
  export function createCanvas(width: number, height: number): any;
  export function loadImage(src: string): Promise<any>;
}

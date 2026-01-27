import { TextStyle, type TextStyleOptions } from "pixi.js";

export function makeFontStyle(styles: TextStyleOptions){
  return new TextStyle({
    fontFamily: `Oswald, sans-serif`,
    fill: "0xf0f0f0",
    ...styles
  });
}
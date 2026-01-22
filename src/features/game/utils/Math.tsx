import { useApplication } from "@pixi/react";
import { Sprite } from "pixi.js";
import { useCallback } from "react";

export function useAppWithScaleConstat(props:{width?: number, height?: number} = {
  width: 1920,
  height:1080,
}) {
  const {app} = useApplication();
  const baseWidth = props.width || 1920;
  const baseHeight = props.height || 1080;
  return [
    app,
    app.renderer.width/ baseWidth ,
    app.renderer.height / baseHeight
  ] as const;
}

export function useMakeRectCalculator(scaleConstant: number){
  return useCallback(({rectWidth, rectHeight}:{rectWidth: number, rectHeight: number})=>{
    return function offsetOfRect({x, y}: {x: number, y: number}){
      return {
        x: ((1920 * scaleConstant) - rectWidth) / 2 + x,
        y: ((1080 * scaleConstant) - rectHeight) / 2 - y,
      }
    }
  }, [scaleConstant]);
}

export function makeCoordinatesCenter(data:{scaleConstant:number, rectWidth:number, rectHeight:number, x:number, y:number}){
  const {scaleConstant, rectWidth, rectHeight, x, y} = data;
  return {
    x: ((1920 * scaleConstant) - rectWidth) / 2 + x,
    y: ((1080 * scaleConstant) - rectHeight) / 2 - y,
  }
}

export const curvatureAnimation = {
  easeInQuad: "cubic-bezier(0.550, 0.085, 0.680, 0.530)",
	easeOutQuad: "cubic-bezier(0.250, 0.460, 0.450, 0.940)",
	easeInCubic: "cubic-bezier(0.550, 0.055, 0.675, 0.190)",
	easeOutCubic: "cubic-bezier(0.215, 0.610, 0.355, 1.000)",
	easeInQuart: "cubic-bezier(0.895, 0.030, 0.685, 0.220)",
	easeOutQuart: "cubic-bezier(0.165, 0.840, 0.440, 1.000)",
	easeInQuint: "cubic-bezier(0.755, 0.050, 0.855, 0.060)",
	easeOutQuint: "cubic-bezier(0.230, 1.000, 0.320, 1.000)",
	easeInSine: "cubic-bezier(0.470, 0.000, 0.745, 0.715)",
	easeOutSine: "cubic-bezier(0.390, 0.575, 0.565, 1.000)",
	easeInExpo: "cubic-bezier(0.950, 0.050, 0.795, 0.035)",
	easeOutExpo: "cubic-bezier(0.190, 1.000, 0.220, 1.000)",
	easeInCirc: "cubic-bezier(0.600, 0.040, 0.980, 0.335)",
	easeOutCirc: "cubic-bezier(0.075, 0.820, 0.165, 1.000)",
	easeInBack: "cubic-bezier(0.600, -0.280, 0.735, 0.045)",
	easeOutBack: "cubic-bezier(0.175, 0.885, 0.320, 1.275)",
} as const;
export type curvatureAnimationName = keyof typeof curvatureAnimation;

/**
 * @description Calculates the curvature value based on the specified curvature animation name and time parameters.
 * @returns The calculated curvature value. 
 * @param param0 
 * 
 */
export function curvatureCalculator({
  currentTime, 
  baseTargetValue,
  finalTargetValue,
  initialTime = 0, 
  finalTime, 
  curvatureName= "easeInBack"
}:
{
  currentTime:number,
  baseTargetValue:number, 
  finalTargetValue:number,
  initialTime?:number, 
  finalTime:number, 
  curvatureName?: curvatureAnimationName
}
):number{
  const t = (currentTime - initialTime) / (finalTime - initialTime);
  
  // Clamp t between 0 and 1
  if(t <= 0) return baseTargetValue;
  if(t >= 1) return finalTargetValue;
  
  // Use the data from curvatureAnimation to calculate the curvature value
  const curveValue = curvatureAnimation[curvatureName].match(/cubic-bezier\(([^,]+), ([^,]+), ([^,]+), ([^,]+)\)/);
  if(!curveValue) return baseTargetValue + (finalTargetValue - baseTargetValue) * t; // Linear interpolation as fallback
  const [ , p0, p1, p2, p3] = curveValue.map(Number);

  // Cubic Bezier formula: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  // Calculate the bezier curve value (we only need Y axis for easing)
  // Start point is 0, end point is 1, control points are p1 and p3 (Y values)
  const easingProgress = uuu * 0 + 3 * uu * t * p1 + 3 * u * tt * p3 + ttt * 1;
  
  // Interpolate between baseTargetValue and finalTargetValue using the easing curve
  return baseTargetValue + (finalTargetValue - baseTargetValue) * easingProgress;
}

/**
 * @constructor
 * @description Animator class to handle animations over time.
 * @param finalTargetTime The total duration of the animation in milliseconds.
 * @param fps The frames per second for the animation (default is 60).
 */
export class Animator{

  public readonly secondsRatio: number;
  public readonly totalFramesToRender: number;
  public framesRendered: number;
  public timerBreakpoint: number[] = [];

  constructor(
    public finalTargetTime: number, // in milliseconds
    public fps: number = 60,
  ){
    this.secondsRatio = this.finalTargetTime /1000; //Get ratio of seconds per millisecond
    this.totalFramesToRender = this.fps*this.secondsRatio;
    this.framesRendered = 0;
  }

  addFrames(frames = 1){
    this.framesRendered = (this.framesRendered + frames) % this.totalFramesToRender;
    return this;
  }

  getTimeToFrameBreakpoints(index:number){
    if(this.timerBreakpoint.length === 0){
      throw new Error("Timer breakpoints not set. Please set timer breakpoints before getting frame breakpoints.");
    }
    const breakpointTime = this.timerBreakpoint[index];
    if(breakpointTime === undefined){
      throw new Error(`Timer breakpoint at index ${index} is undefined.`);
    }
    const frameBreakpoint = Math.floor((breakpointTime / this.finalTargetTime) * this.totalFramesToRender);
    return frameBreakpoint;
  }

  setTimerBreakpoints(breakpoints: number[]){
    this.timerBreakpoint = breakpoints;
    return this;
  }
}

/**
 * 
 * @description Locate cards along the X axis from the center based on the number of cards and gap.
 * @param scaleConstant scale of the content
 * @param howMany how many cards to locate
 * @param gap The gap between cards in pixels
 * @param cardWidth The width of each card in pixels
 * @param useCenter Whether to center the cards around the center point
 * @param midCoordinates Optional starting X coordinate for the middleground of the card (totalWidthOfAllCards / 2). If not then the starting card will start at 0 to 1920*scaleConstant. 
 * @returns An array of X coordinates for each card.
 * 
 */
export function locateCardXFromCenter({
  canvasSize = 1920,
  scaleConstant, 
  howMany, 
  gap, 
  cardWidth, 
  useCenter = false,
  midCoordinates,
}:{
  canvasSize?: number,
  scaleConstant:number, 
  howMany: number, 
  gap?: number, 
  cardWidth?: number, 
  useCenter?: boolean,
  midCoordinates?: number,
}){
  // Calculate the Total Size of the canvas
  const baseWidth = canvasSize * scaleConstant;

  // We need to get the width of the card to calculate the definite size for positioning coordinates
  cardWidth = cardWidth ?? 1920 * scaleConstant * 0.08;
  // Once we get the width we can now get the center by  dividing by 2
  const cardCenter = (cardWidth / 2);

  // The netGap is the gap between each card adjusted by the scaleConstant also it should not be more than the baseWidth divided by howMany
  // An undefined gap meaning fill the available space equally
  let netGap = gap === undefined 
    ? (baseWidth - (howMany * cardWidth)) / (howMany - 1) 
    : (gap * scaleConstant) > ((baseWidth - (howMany * cardWidth)) / (howMany - 1)) 
      ? ((baseWidth - (howMany * cardWidth)) / (howMany - 1)) 
      : (gap * scaleConstant);


  const totalWidth = (howMany * cardWidth) + ((howMany - 1) * netGap);
  const initialOffset = useCenter ? ((baseWidth - totalWidth)/2) : 0;
  const midOffset = midCoordinates !== undefined ? -((baseWidth/2) - midCoordinates) : 0;
  const array = [...Array(howMany)].map((_,index)=>{
    const grossLocation =  initialOffset + cardCenter+ index*( cardWidth +netGap);
    const netLocation = grossLocation + midOffset;
    return netLocation;
  });
  // console.log(`Basewidth: ${baseWidth}, CardWidth: ${cardWidth}, CardCenter: ${cardCenter}, Gap: ${netGap}, TotalWidth: ${totalWidth}, InitialOffset: ${initialOffset}, MidOffset: ${midOffset}`);
  // console.log(array);
  return array;
}
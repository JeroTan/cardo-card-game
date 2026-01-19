import { useApplication } from "@pixi/react";
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
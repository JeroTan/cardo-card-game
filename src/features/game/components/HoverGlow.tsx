import {GlowFilter} from "pixi-filters";
import { useFocusContext } from "../context/FocusContext";
import { useId, useRef, type PropsWithChildren } from "react";
import { Container, Ticker } from "pixi.js";
import { useUpdateEffect } from "react-use";
import { curvatureCalculator } from "../utils/Math";
import { round } from "lodash";

export default function HoverGlow({
  children, 
  active = false
}:PropsWithChildren<{
  active?: boolean,
}>) {
  const {currentFocus, setFocus, clearFocus} = useFocusContext();
  const id = useId();
  const element = useRef<Container | null>(null);
  const ticker = useRef(new Ticker());

  useUpdateEffect(()=>{
    if(element.current == null) return;
    ticker.current.start();
    const container = element.current;

    if(currentFocus === id){
      container.filters = [new GlowFilter({
        distance: 1,
        innerStrength: 0,
        color: 0xf0f0f0,
        quality: 0.2,
      })];
      const targetTimer = 50 // in ms
      const secondsRatio = targetTimer/1000; //Get ratio of seconds per millisecond
      const totalFramesToRender = 60*secondsRatio;
      let framesRendered = 0;
      let animationDone = false;
      
      ticker.current.add((t)=>{
        if(framesRendered >= totalFramesToRender && animationDone){
          ticker.current.stop();
          framesRendered = 0;
          return;
        }
        framesRendered += t.deltaTime;
        if(framesRendered >= totalFramesToRender){
          animationDone = true;
        }
        let newDistanceValue =  round(curvatureCalculator({
          currentTime: framesRendered,
          baseTargetValue: 1,
          finalTargetValue: 20,
          initialTime: 0,
          finalTime: totalFramesToRender,
          curvatureName: "easeOutQuad"
        }), 0);
        newDistanceValue = newDistanceValue < 1 ? 1 : newDistanceValue;
        if(container == null){
          ticker.current.stop();
          return;
        }
        container.filters = [new GlowFilter({
          distance: newDistanceValue,
          innerStrength: 0,
          color: 0xf0f0f0,
          quality: 0.2,
        })];
      })
    }else{
      ticker.current.stop();
      container.filters = [];
    }

    return ()=>{
      ticker.current.stop();
    }
  }, [currentFocus]);

  return active ? <pixiContainer
    eventMode="dynamic"
    onPointerOver={()=>{
      if(element.current){
        element.current.cursor = "pointer";
      }
      setFocus(id);
    }}
    onClick={()=>{
      setFocus(id);
    }}
    onPointerLeave={()=>{
      if(element.current){
        element.current.cursor = "default";
      }
      clearFocus();
    }}
    ref={element}
  >
    {children}
  </pixiContainer> : children;
}
import { useEffect, useRef } from "react";
import { Animator, curvatureCalculator, useAppWithScaleConstant } from "../../utils/Math";
import { makeFontStyle } from "../font/FontStyles";
import { AttackIcon } from "../icon/AttackIcon";
import { Ticker, type Container } from "pixi.js";
import { round } from "lodash";
import { GlowFilter } from "pixi-filters";


export function AttackingStat({
  x=0,
  y=0,
  value=0,
  effects="DEFAULT",
}:{
  x?: number,
  y?: number,
  value?: number|null,
  effects?: "DEFAULT"|"GLOWING_GREEN"
}){
  const [, scaleConstant] = useAppWithScaleConstant();
  const containerRef = useRef<Container|null>(null);
  const ticker = useRef(new Ticker());

  useEffect(()=>{
    if(containerRef.current == null) return;
    const container = containerRef.current;
    container.position.x = (1920 * 0.5 * scaleConstant) + (x * scaleConstant) - (container.width * 0.5);
    container.position.y = (1080 * 0.5 * scaleConstant) + (y * scaleConstant) - (container.height * 0.5);
  }, [x, y, scaleConstant]);

   useEffect(()=>{
      if(containerRef.current == null || ticker.current == null) return;
      const container = containerRef.current;
      const tkr = ticker.current;
      const animator = new Animator(1000).setTimerBreakpoints([
        0, 500, 1000
      ]);
      
      if(effects === "GLOWING_GREEN"){
        tkr.start();
        tkr.add((d)=>{
  
          if(animator.framesRendered <= animator.getTimeToFrameBreakpoints(1)){
            const newStrengthValue =  round(curvatureCalculator({
              currentTime: animator.framesRendered,
              baseTargetValue: 1,
              finalTargetValue: 5,
              initialTime: 0,
              finalTime: animator.totalFramesToRender*.5,
              curvatureName: "easeInQuad"
            }), 0);
            container.filters = [new GlowFilter({
              distance: 10,
              innerStrength: 0,
              outerStrength: newStrengthValue,
              color: 0x00ff00,
              quality: 0.2,
              alpha: 0.25
            })];
          }else if(animator.framesRendered <= animator.getTimeToFrameBreakpoints(2)){
            const reverseStrengthValue = 5 - round(curvatureCalculator({
              currentTime: animator.framesRendered,
              baseTargetValue: 5,
              finalTargetValue: 1,
              initialTime: animator.getTimeToFrameBreakpoints(1),
              finalTime: animator.getTimeToFrameBreakpoints(2),
              curvatureName: "easeOutQuad"
            }), 0);
            container.filters = [new GlowFilter({
              distance: 10,
              innerStrength: 0,
              outerStrength: reverseStrengthValue,
              color: 0x00ff00,
              quality: 0.2,
              alpha: 0.25
            })];
          }
  
          animator.addFrames(d.deltaTime);
        })
  
      }else if(effects === "DEFAULT"){
        ticker.current.stop();
        container.filters = [];
      }else{
        ticker.current.stop();
        container.filters = [];
      }
  
      return ()=>{
        ticker.current.stop();
        container.filters = [];
      }
    }, [effects]);
  

  return <pixiContainer
    x={x*scaleConstant}
    y={y*scaleConstant}
    ref={containerRef}
  >
    <pixiText 
      text={`Attack Power`}
      style={makeFontStyle({
        fontSize: 18*scaleConstant,
        fill: 0x909090,
      })}
      x={10*scaleConstant}
    />
    <AttackIcon
      y={18}
    />
    <pixiText 
      text={`${(value && typeof value === "number") ? (value == Infinity ? "∞" : value) : "--"}`}
      style={makeFontStyle({
        fontSize: 36*scaleConstant,
        fill: 0xD9D9D9,
      })}
      y={23*scaleConstant}
      x={55*scaleConstant}
    />
    
  </pixiContainer>
}
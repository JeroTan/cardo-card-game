import { Ticker, type Container } from "pixi.js";
import { useCallback, useRef } from "react";
import { useEffectOnce } from "react-use";
import { Animator, curvatureCalculator } from "../utils/Math";

export type AttackAnimationProps = {
  from: {x: number, y:number},
  children?: React.ReactNode,
  scaleConstant?: number,
  animationDone?: ()=>void,
};

export function AttackToSentinelAnimation({
  from,
  children,
  scaleConstant = 1,
  animationDone,
}: AttackAnimationProps){

  const element = useRef<Container | null>(null);
  const ticker = useRef(new Ticker());

  useEffectOnce(()=>{
    startAnimation();
  });

  const startAnimation = useCallback(()=>{
    if(element.current == null || ticker.current == null) return;
    const container = element.current;
    // ticker.current.start();
    
    // The Animation is simple, go to 0, 0 of the canvas
    const animator = new Animator(700).setTimerBreakpoints([
      0, 400, 500, 700
    ]);

    // From center to the x of from, calculate the angle of rotation
    const finalRotationPoint =  Math.atan2(-from.y, -from.x); // Negative because we want to face the center (0,0)
    // Set the pivot of container to the center
    console.log(`Final rotation point: ${finalRotationPoint}`);
    console.log(`Height and Width: ${container.height}, ${container.width}`);
    console.log(`Pivot before: ${container.pivot.x}, ${container.pivot.y}`);
    console.log(`Location of container before: ${container.x}, ${container.y} vs from: ${from.x}, ${from.y}`);
    container.rotation = 0.05;
    console.log(container.children)

    // ticker.current.start();
    // ticker.current.add(({deltaTime})=>{
    //   container.rotation+= 0.1 * deltaTime;
    // });

    // ticker.current.add(()=>{

    //   if(animator.framesRendered == animator.getTimeToFrameBreakpoints(0)){
    //     container.rotation = 0;
    //   }
    //   if(animator.framesRendered <= animator.getTimeToFrameBreakpoints(1)){
    //     const rotateAnimation = curvatureCalculator({
    //       currentTime: animator.framesRendered,
    //       baseTargetValue: 0,
    //       finalTargetValue: finalRotationPoint,
    //       initialTime: animator.getTimeToFrameBreakpoints(0),
    //       finalTime: animator.getTimeToFrameBreakpoints(1),
    //       curvatureName: "easeOutBack",
    //     });
    //     container.rotation = rotateAnimation;
    //   }else if(animator.getTimeToFrameBreakpoints(2) < animator.framesRendered  && animator.framesRendered <= animator.getTimeToFrameBreakpoints(3)){
    //     const poxitionXAnimation = curvatureCalculator({
    //       currentTime: animator.framesRendered,
    //       baseTargetValue: from.x * scaleConstant,
    //       finalTargetValue: 0,
    //       initialTime: animator.getTimeToFrameBreakpoints(2),
    //       finalTime: animator.getTimeToFrameBreakpoints(3),
    //       curvatureName: "easeInBack",
    //     });
    //     const poxitionYAnimation = curvatureCalculator({
    //       currentTime: animator.framesRendered,
    //       baseTargetValue: from.y * scaleConstant,
    //       finalTargetValue: 0,
    //       initialTime: animator.getTimeToFrameBreakpoints(2),
    //       finalTime: animator.getTimeToFrameBreakpoints(3),
    //       curvatureName: "easeInBack",
    //     });
    //     container.position.set(poxitionXAnimation, poxitionYAnimation);
    //   }

    //   animator.addFrames(1);
    //   console.log(`From ${from.x}, ${from.y}`, animator.framesRendered);
    //   if(animator.framesRendered == animator.getTimeToFrameBreakpoints(3)){
    //     ticker.current.stop();
    //     animationDone?.();
    //     return;
    //   }
    // });

    return ()=>{
      ticker.current.stop();
    }
  }, []);
  
  return <>
    <pixiContainer
      ref={element}
    >
      {children}
    </pixiContainer>
  </>
}
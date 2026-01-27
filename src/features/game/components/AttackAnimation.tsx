import { Ticker, type Container } from "pixi.js";
import { useCallback, useId, useRef } from "react";
import { useEffectOnce } from "react-use";
import { Animator, curvatureCalculator, makeCoordinatesCenter } from "../utils/Math";
import { findLabelCardInPixi } from "../utils/Card";

export type AttackAnimationProps = {
  children?: React.ReactNode,
  scaleConstant?: number,
  animationDone?: ()=>void,
};

export function AttackToSentinelAnimation({
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
    ticker.current.start();
    const cardData = findLabelCardInPixi(container);
    if(cardData == null) return;
    
    // The Animation is simple, go to 0, 0 of the canvas
    const animationLength = 600; // in ms
    const animator = new Animator(animationLength).setTimerBreakpoints([
      animationLength*0, 
      animationLength*0.57, 
      animationLength*0.71, 
      animationLength*1
    ]);

    // Calculate the location of cards from center
    const currentCardLocationFromCenter = {
      x: ( cardData.position.x - (1920 * scaleConstant * .5) ) / (scaleConstant ? scaleConstant : 1),
      y: (1080 * .5) - (cardData.position.y / (scaleConstant ? scaleConstant : 1)),
    }

    // From center to the x of from, calculate the angle of rotation
    const baseAngle = Math.atan2(currentCardLocationFromCenter.y, currentCardLocationFromCenter.x) + Math.PI / 2;
    const finalRotationPoint = currentCardLocationFromCenter.y < 0 
      ? -baseAngle              // Below center: flip rotation
      : -(baseAngle - Math.PI);    // Above center: subtract 180 degrees

    const targetCenter = makeCoordinatesCenter({scaleConstant, rectHeight: 0, rectWidth: 0, x:0, y:0});
  

    ticker.current.add((t)=>{

      if(animator.framesRendered == animator.getTimeToFrameBreakpoints(0)){
        cardData.rotation = 0;
      }
      if(animator.framesRendered <= animator.getTimeToFrameBreakpoints(1)){
        const rotateAnimation = curvatureCalculator({
          currentTime: animator.framesRendered,
          baseTargetValue: 0,
          finalTargetValue: finalRotationPoint,
          initialTime: animator.getTimeToFrameBreakpoints(0),
          finalTime: animator.getTimeToFrameBreakpoints(1),
          curvatureName: "easeInCirc",
        });
        cardData.rotation = rotateAnimation;
      }else if(animator.getTimeToFrameBreakpoints(2) < animator.framesRendered  && animator.framesRendered <= animator.getTimeToFrameBreakpoints(3)){
        const poxitionXAnimation = curvatureCalculator({
          currentTime: animator.framesRendered,
          baseTargetValue: cardData.position.x,
          finalTargetValue: targetCenter.x,
          initialTime: animator.getTimeToFrameBreakpoints(2),
          finalTime: animator.getTimeToFrameBreakpoints(3),
          curvatureName: "easeInCirc",
        });
        const poxitionYAnimation = curvatureCalculator({
          currentTime: animator.framesRendered,
          baseTargetValue: cardData.position.y,
          finalTargetValue: targetCenter.y,
          initialTime: animator.getTimeToFrameBreakpoints(2),
          finalTime: animator.getTimeToFrameBreakpoints(3),
          curvatureName: "easeInQuad",
        });
        // console.log(id, "poxitionXAnimation", poxitionXAnimation, "poxitionYAnimation", poxitionYAnimation, " Old Position:", {x: cardData.position.x, y: cardData.position.y}, " Target Center:", targetCenter);
        cardData.position.set(poxitionXAnimation, poxitionYAnimation);
      }
      animator.addFrames(t.deltaTime, true);
      if(animator.framesRendered > (animator.getTimeToFrameBreakpoints(3)-1)){
        ticker.current.stop();
        animationDone?.();
        return;
      }
    });

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
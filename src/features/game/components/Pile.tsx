import { useEffect, useRef, type Ref } from "react";
import { Animator, makeCoordinatesCenter, useAppWithScaleConstat } from "../utils/Math";
import Card from "./Card";
import { Container, Ticker } from "pixi.js";

export type PileType = {
  topCard?: string | null;
  pileSize?: number; // Deck Size
  animateShuffling?: boolean;
  horizontalOffset?: number;
  verticalOffset?: number;
}

export function Pile({
  topCard = null,
  pileSize = 10,
  animateShuffling = false,
  horizontalOffset = 0,
  verticalOffset = 0
}: PileType){
  const [app, scaleConstant] = useAppWithScaleConstat();
  const {current: tickerTime} = useRef(new Ticker);
  const cardRef = useRef<Container|null>(null);
  const pileRef = useRef<Container|null>(null);

  useEffect(()=>{
    if(cardRef.current == null || pileRef.current == null) return;
    const cardContainer = cardRef.current;

    if(animateShuffling){
      tickerTime.start();

      const animator = new Animator(300).setTimerBreakpoints([
        150, 300 // in ms
      ]);
      const moveScale = 20.5;
      const initX = cardContainer.x;
      const initY = cardContainer.y;

      tickerTime.add(()=>{
        if(animator.framesRendered <= animator.getTimeToFrameBreakpoints(0)){
          // cardContainer.x 
          // = (cardContainer.x + (animator.framesRendered * (moveScale * scaleConstant))) 
          // % (initX +(animator.getTimeToFrameBreakpoints(0) * (moveScale * scaleConstant))); 
          cardContainer.x = initX + ((animator.framesRendered * scaleConstant*moveScale) % (animator.getTimeToFrameBreakpoints(0) * scaleConstant*moveScale));
        }
        animator.addFrames();
      });
    }else{
      tickerTime.stop();
    }
    return ()=>{
      tickerTime.destroy();
    }
  }, [animateShuffling]);

  return <>
    {pileSize > 0 && <>
      <BasePile
        scaleConstant={scaleConstant}
        horizontalOffset={horizontalOffset}
        verticalOffset={verticalOffset}
        pileSize={pileSize}
        ref={pileRef}
      />
      {topCard && ((()=>{
        return <Card 
          horizontalOffset={(horizontalOffset)-(pileSize* 0.5)}
          verticalOffset={(verticalOffset)+(pileSize* 0.5)} 
          src={topCard}
        />
      })())}
      {animateShuffling && <>
        <Card 
          ref={cardRef}
          horizontalOffset={(horizontalOffset)-(pileSize* 0.5) + (Math.random() * 4 -2)}
          verticalOffset={(verticalOffset)+(pileSize* 0.5) + (Math.random() *4 -2)} 
          src={topCard!}
        />
      </>}
    </>}
    
  </>
}

export function BasePile({ref=null,scaleConstant, horizontalOffset=0, verticalOffset=0, pileSize=10}:{ref?:Ref<Container|null>,scaleConstant: number, horizontalOffset?: number, verticalOffset?: number, pileSize?: number}) {
  return <>
    <pixiContainer
      x={((1920)*scaleConstant / 2) + (horizontalOffset*scaleConstant)}
      y={((1080)*scaleConstant / 2) - (verticalOffset*scaleConstant)}
      ref={ref}
    >
      <pixiGraphics draw={(graphics)=>{
        graphics.clear();
        // Create Card Container with 2:3 aspect ratio
        const cardScale = 0.080; // Single parameter to adjust size (relative to canvas width)
        const rectWidth = (1920 * scaleConstant) * cardScale;
        const rectHeight = rectWidth * (3/2); // Height is 1.5x width for 2:3 ratio (width:height)

        const rectX = -rectWidth * .5;
        const rectY = -rectHeight * .5;
        
        const cornerRadius = 5; // Rounded corner radius
        const strokeWidth = scaleConstant * 0.5;
        const depth = scaleConstant * pileSize * 0.5; // Total depth of the pile
        
        // Top card position - offset by depth (going up and left from the base position)
        const topCardX = rectX - depth;
        const topCardY = rectY - depth;
        
        // Draw the top card
        graphics.roundRect(
          topCardX + strokeWidth/2, 
          topCardY + strokeWidth/2, 
          rectWidth - strokeWidth, 
          rectHeight - strokeWidth, 
          scaleConstant * cornerRadius
        );
        graphics.stroke({ width: strokeWidth, color: 0x767778, alignment: 0 });
        graphics.fill({ color: 0x111219 });
        
        // Draw the depth edges (right and bottom sides)
        const edgeColor = 0x767778; // Color of sides
        const r = scaleConstant * cornerRadius; // Shorthand for corner radius
        
        // Right edge depth with curved corners
        // Start where top card's top-right corner ends
        graphics.moveTo(topCardX + rectWidth - strokeWidth/2, topCardY + r + strokeWidth/2 -2);
        graphics.lineTo(rectX + rectWidth - strokeWidth/2, rectY + r + strokeWidth/2);
        graphics.lineTo(rectX + rectWidth - strokeWidth/2, rectY + rectHeight - r - strokeWidth/2);
        // Bottom-right curve at back of depth
        graphics.quadraticCurveTo(
          rectX + rectWidth - strokeWidth/2, rectY + rectHeight - strokeWidth/2,
          rectX + rectWidth - r - strokeWidth/2, rectY + rectHeight - strokeWidth/2
        );
        graphics.lineTo(topCardX + rectWidth - r - strokeWidth/2, topCardY + rectHeight - strokeWidth/2);
        // Back to start - close along bottom-right curve of top card
        graphics.quadraticCurveTo(
          topCardX + rectWidth - strokeWidth/2, topCardY + rectHeight - strokeWidth/2,
          topCardX + rectWidth - strokeWidth/2, topCardY + rectHeight - r - strokeWidth/2
        );
        graphics.closePath();
        graphics.fill({ color: edgeColor });
        
        // Bottom edge depth with curved corners
        // Start where top card's bottom-left corner ends
        graphics.moveTo(topCardX + r + strokeWidth/2-2, topCardY + rectHeight - strokeWidth/2);
        graphics.lineTo(rectX + r + strokeWidth/2, rectY + rectHeight - strokeWidth/2);
        graphics.lineTo(rectX + rectWidth - r - strokeWidth/2, rectY + rectHeight - strokeWidth/2);
        // Bottom-right curve at back of depth
        graphics.quadraticCurveTo(
          rectX + rectWidth - strokeWidth/2, rectY + rectHeight - strokeWidth/2,
          rectX + rectWidth - strokeWidth/2, rectY + rectHeight - r - strokeWidth/2
        );
        graphics.lineTo(topCardX + rectWidth - strokeWidth/2, topCardY + rectHeight - r - strokeWidth/2);
        // Back to start - close along bottom-right curve of top card
        graphics.quadraticCurveTo(
          topCardX + rectWidth - strokeWidth/2, topCardY + rectHeight - strokeWidth/2,
          topCardX + rectWidth - r - strokeWidth/2, topCardY + rectHeight - strokeWidth/2
        );
        graphics.closePath();
        graphics.fill({ color: edgeColor });
        
      }} />

    </pixiContainer>
    
  </>
}
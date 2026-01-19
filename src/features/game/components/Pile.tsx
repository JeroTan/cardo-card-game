import { useAppWithScaleConstat, useMakeRectCalculator } from "../utils/Math";
import Card from "./Card";

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
  return <>
    <BasePile
      scaleConstant={scaleConstant}
      horizontalOffset={horizontalOffset}
      verticalOffset={verticalOffset}
      pileSize={pileSize}
    />
    {topCard && <>
      <Card 
        horizontalOffset={horizontalOffset-(scaleConstant * pileSize)}
        verticalOffset={verticalOffset+(scaleConstant * pileSize)} 
        src={topCard}
      />
    </>}
  </>
}

export function BasePile({scaleConstant, horizontalOffset=0, verticalOffset=0, pileSize=10}:{scaleConstant: number, horizontalOffset?: number, verticalOffset?: number, pileSize?: number}) {
  const makeRectCalculator = useMakeRectCalculator(scaleConstant);
  return <>
    <pixiGraphics draw={(graphics)=>{
      graphics.clear();
      // Create Card Container with 2:3 aspect ratio
      const cardScale = 0.080; // Single parameter to adjust size (relative to canvas width)
      const rectWidth = (1920 * scaleConstant) * cardScale;
      const rectHeight = rectWidth * (3/2); // Height is 1.5x width for 2:3 ratio (width:height)

      const positionCalc = makeRectCalculator({rectWidth, rectHeight});
      const {x: rectX, y: rectY} =  positionCalc({x: horizontalOffset * scaleConstant, y: verticalOffset * scaleConstant});
      
      const cornerRadius = 5; // Rounded corner radius
      const strokeWidth = scaleConstant * 0.5;
      const depth = scaleConstant * pileSize; // Total depth of the pile
      
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
  </>
}
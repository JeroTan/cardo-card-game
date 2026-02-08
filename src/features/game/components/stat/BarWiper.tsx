import { useMemo } from "react";
import { useAppWithScaleConstant } from "../../utils/Math";


export function BarWiper({
  x:RawX = 0,
  y:RawY = 0,
  width: RawWidth = 1920,
  height: RawHeight = 5,
  wipeBorder,
}:{
  x?: number,
  y?: number,
  width?: number,
  height?: number,
  highlight?: boolean,
  bgColor?: number,
  wipeBorder?: number, //from 0 to 1, how much of the border should be wiped (for animation) this is in circle clockwise wipe. 0 means no more border
}){
  const [, scaleConstant] = useAppWithScaleConstant();

  const {width, height} = useMemo(()=>{
    return {
      width: RawWidth * scaleConstant,
      height: RawHeight * scaleConstant,
    }
  }, [scaleConstant, RawWidth, RawHeight]);

  const {x, y} = useMemo(()=>{
    return {
      x: RawX * scaleConstant,
      y: RawY * scaleConstant,
    }
  }, [scaleConstant, RawX, RawY]);

  return <pixiContainer
    x={x}
    y={y}
  >
    <pixiGraphics
      draw={(graphics)=>{
        graphics.clear();
        if(wipeBorder === undefined) return;
        
        const green = 0x3DEA77;
        const red = 0xFF2222;
        
        // Apply inverse exponential curve - stays green until close to 0, then rapid transition
        const easedWipeBorder = 1 - Math.pow(1 - wipeBorder, 2);
        
        // Extract RGB components
        const greenR = (green >> 16) & 0xFF;
        const greenG = (green >> 8) & 0xFF;
        const greenB = green & 0xFF;
        
        const redR = (red >> 16) & 0xFF;
        const redG = (red >> 8) & 0xFF;
        const redB = red & 0xFF;
        
        // Interpolate each channel separately using eased value
        const r = Math.floor(easedWipeBorder * greenR + (1 - easedWipeBorder) * redR);
        const g = Math.floor(easedWipeBorder * greenG + (1 - easedWipeBorder) * redG);
        const b = Math.floor(easedWipeBorder * greenB + (1 - easedWipeBorder) * redB);
        
        // Combine back to hex
        const finalColor = (r << 16) | (g << 8) | b;

        // Calculate line width - starts from left (full width) and shrinks leftward (dissolves from right)
        const lineWidth = width * wipeBorder;
        
        // Draw horizontal line from left to right
        const startX = 0; // Left edge
        const endX = lineWidth; // How far to the right
        const centerY = height / 2; // Center vertically
        
        graphics.moveTo(startX, centerY);
        graphics.lineTo(endX, centerY);
        graphics.stroke({ width: height, color: finalColor, cap: 'butt' });
      }}
    />
  </pixiContainer>
}
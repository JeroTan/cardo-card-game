import { useEffect, useMemo, useRef } from "react";
import { useAppWithScaleConstant } from "../../utils/Math";
import type { Graphics } from "pixi.js";


export function BarContainer({
  x:RawX = 0,
  y:RawY = 0,
  width: RawWidth = 1920,
  height: RawHeight = 80,
  highlight= false,
  bgColor = 0x3F3F41,
}:{
  x?: number,
  y?: number,
  width?: number,
  height?: number,
  highlight?: boolean,
  bgColor?: number,
}){
  const [, scaleConstant] = useAppWithScaleConstant();

  const refAnimateBorder = useRef<Graphics|null>(null);
  const refMaskForAnimateBorder = useRef<Graphics|null>(null);

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

  useEffect(()=>{
    if(!refAnimateBorder.current || !refMaskForAnimateBorder.current) return;
    const animateBorder = refAnimateBorder.current;
    const maskForAnimateBorder = refMaskForAnimateBorder.current;

    animateBorder.mask = maskForAnimateBorder;
  }, []);

  return <pixiContainer
    x={x}
    y={y}
  >
    <pixiGraphics 
      draw={(graphics)=>{
        graphics.clear();
   
        graphics.rect(0, 0, width, height);
        graphics.fill({ color: highlight ? bgColor : 0x1F1F21 });  
      }}
    />
    <pixiGraphics
      draw={(graphics)=>{
        graphics.clear();

        graphics.rect(0, 0, width, height);
        graphics.stroke({ width: scaleConstant * 3, color: 0x161718, alignment: 1 });
        
        graphics.rect(0, 0, width, height);
        graphics.stroke({ width: scaleConstant * 2, color: 0x565758, alignment: 1 });
      }}
    />
  </pixiContainer>
}
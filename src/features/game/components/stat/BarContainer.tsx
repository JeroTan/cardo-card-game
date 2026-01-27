import { useMemo } from "react";
import { useAppWithScaleConstant } from "../../utils/Math";


export function BarContainer({
  x:RawX = 0,
  y:RawY = 0,
  width: RawWidth = 1920,
  height: RawHeight = 80,
  highlight= false,
}:{
  x?: number,
  y?: number,
  width?: number,
  height?: number,
  highlight?: boolean,
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
   
        graphics.rect(0, 0, width, height);
        graphics.fill({ color: highlight ? 0x3F3F41 : 0x1F1F21 });  
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
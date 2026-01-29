import { useEffect, useRef } from "react";
import { useAppWithScaleConstant } from "../../utils/Math";
import { makeFontStyle } from "../font/FontStyles";
import { DefenseIcon } from "../icon/DefenseIcon";
import type { Container } from "pixi.js";


export function DefendingStat({
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

  useEffect(()=>{
    if(containerRef.current == null) return;
    const container = containerRef.current;
    container.position.x = (1920 * 0.5 * scaleConstant) + (x * scaleConstant) - (container.width * 0.5);
    container.position.y = (1080 * 0.5 * scaleConstant) + (y * scaleConstant) - (container.height * 0.5);
  }, [x, y, scaleConstant]);

  return <pixiContainer
    x={x*scaleConstant}
    y={y*scaleConstant}
    ref={containerRef}
  >
    <pixiText 
      text={`Defense Power`}
      style={makeFontStyle({
        fontSize: 18*scaleConstant,
        fill: 0x909090,
      })}
      x={10*scaleConstant}
    />
    <DefenseIcon
      y={18}
    />
    <pixiText 
      text={`${value ? value : "--"}`}
      style={makeFontStyle({
        fontSize: 36*scaleConstant,
        fill: 0xD9D9D9,
      })}
      y={23*scaleConstant}
      x={55*scaleConstant}
    />
    
  </pixiContainer>
}
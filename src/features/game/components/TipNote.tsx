import { useAppWithScaleConstant } from "../utils/Math";
import { makeFontStyle } from "./font/FontStyles";

export function TipNote({
  x = 0,
  y = 0,
  tip = "",
}:{
  x?: number,
  y?: number,
  tip?: string,
}){
  const [, scaleConstant] = useAppWithScaleConstant();
  return <pixiContainer
    x={x * scaleConstant}
    y={y * scaleConstant}
  >
    {tip !== "" && <pixiGraphics 
      draw={(graphics)=>{
        graphics.clear();

        graphics.circle(0, 15*scaleConstant, 7 * scaleConstant);
        graphics.fill({ color: 0x22FFFF });
      }}
    />}
    <pixiText 
      text={tip}
      style={makeFontStyle({
        fontSize: 24 * scaleConstant,
        fill: 0x22FFFF,
      })}
      x={18 * scaleConstant}
    />
  </pixiContainer>
}
import { Assets, type Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { useAppWithScaleConstant } from "../../utils/Math";
import { useEffectOnce } from "react-use";

export function AttackIcon({
  x = 0,
  y = 0,
}:{
  x?: number,
  y?: number,
}){
  const [, scaleConstant] = useAppWithScaleConstant();
  const [texture, setTexture] = useState<Texture | null>(null);

  const iconSize = 0.030;

  useEffectOnce(() => {
    Assets.load({
      src: "/images/attack_icon.svg", 
      parser: "svg",
      format:"svg",
      data: {
        width: 400,
        height: 400,
      }
    }).then((svgTexture) => {
      setTexture(svgTexture);
    }).catch((error) => {
      console.error("Failed to load card texture:", error);
    });
  });

  return <pixiContainer
    x={x*scaleConstant}
    y={y*scaleConstant}
  >
    {texture ? (
      <pixiSprite 
        texture={texture}
        width={((1920 * scaleConstant) * iconSize)}
        height={((1920 * scaleConstant) * iconSize)}
      />
    ) : (
      <pixiGraphics
        draw={(graphics)=>{
        graphics.clear();
        // Create Card Container with 2:3 aspect ratio
        const rectWidth = (1920 * scaleConstant) * iconSize;
        const rectHeight = rectWidth; // Height is 1.5x width for 2:3 ratio (width:height)

        const cornerRadius = 5; // Rounded corner radius
        graphics.roundRect(-rectWidth*.5, -rectHeight*.5, rectWidth, rectHeight, scaleConstant*cornerRadius);
        graphics.stroke({ width: scaleConstant * 3, color: 0x767778 });
        graphics.fill({ color: 0x28282B});
      }} />
    )}
  </pixiContainer>
}
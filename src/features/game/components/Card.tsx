import { Assets, FillGradient, Texture } from "pixi.js";
import { makeCoordinatesCenter, useAppWithScaleConstat } from "../utils/Math";
import { useEffect, useState } from "react";

export default function Card({horizontalOffset= 0, verticalOffset= 0, src}: {horizontalOffset?: number, verticalOffset?: number, src?: string})  {
  const [, scaleConstant] = useAppWithScaleConstat();
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    if(!src) return;
    Assets.load({
      src: src, 
      parser: "svg",
      format:"svg",
      data: {
        width: 400,
        height: 600,
      }
    }).then((svgTexture) => {
      setTexture(svgTexture);
    }).catch((error) => {
      console.error("Failed to load card texture:", error);
    });
  }, [src]);

  return <>
    {texture ? (
      <pixiSprite 
        anchor={{x:0.5, y:0.5}}
        texture={texture}
        width={((1920 * scaleConstant) * 0.080)}
        height={((1920 * scaleConstant) * 0.080) * (3/2)}
        x={((1920)*scaleConstant / 2) + (horizontalOffset*scaleConstant)}
        y={((1080)*scaleConstant/ 2) - (verticalOffset*scaleConstant)}
      />
    ) : (
      <pixiGraphics draw={(graphics)=>{
        graphics.clear();
        // Create Card Container with 2:3 aspect ratio
        const cardScale = 0.080; // Single parameter to adjust size (relative to canvas width)
        const rectWidth = (1920 * scaleConstant) * cardScale;
        const rectHeight = rectWidth * (3/2); // Height is 1.5x width for 2:3 ratio (width:height)

        const {x: rectX, y: rectY} = makeCoordinatesCenter({
          scaleContaant: scaleConstant,
          rectWidth,
          rectHeight,
          x: horizontalOffset * scaleConstant,
          y: verticalOffset * scaleConstant
        });
        
        const cornerRadius = 5; // Rounded corner radius
        graphics.roundRect(rectX, rectY, rectWidth, rectHeight, scaleConstant*cornerRadius);
        graphics.stroke({ width: scaleConstant * 3, color: 0x767778 });
        graphics.fill({ color: 0x28282B});
      }} />
    )}

  </>
}
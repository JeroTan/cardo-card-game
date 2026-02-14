import { Assets, Container, Texture } from "pixi.js";
import { useAppWithScaleConstant } from "../utils/Math";
import { useEffect, useMemo, useState, type Ref } from "react";

export default function Card({
  horizontalOffset= 0, 
  verticalOffset= 0, 
  src,
  ref = null,
  size = 10,
}: {
  horizontalOffset?: number, 
  verticalOffset?: number, 
  src?: string
  ref?: Ref<Container|null>|null,
  size?: number,
})  {
  const [, scaleConstant] = useAppWithScaleConstant();
  const [texture, setTexture] = useState<Texture | null>(null);

  const cumulativeScale = useMemo(()=>{
    return (0.080 * (size / 10)) ? (0.080 * (size / 10)) : 0.080;
  }, [size]) // Ensure size is applied to the scale 

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
    <pixiContainer
      x={((1920)*scaleConstant / 2) + (horizontalOffset*scaleConstant)}
      y={((1080)*scaleConstant / 2) - (verticalOffset*scaleConstant)}
      ref={ref}
      label="card"
    >
      {texture ? (
        <pixiSprite 
          anchor={{x:0.5, y:0.5}}
          texture={texture}
          width={((1920 * scaleConstant) * cumulativeScale)}
          height={((1920 * scaleConstant) * cumulativeScale) * (3/2)}
        />
      ) : (
        <pixiGraphics
         draw={(graphics)=>{
          graphics.clear();
          // Create Card Container with 2:3 aspect ratio
          const rectWidth = (1920 * scaleConstant) * cumulativeScale; // Base width scaled by cumulative scale
          const rectHeight = rectWidth * (3/2); // Height is 1.5x width for 2:3 ratio (width:height)

          const cornerRadius = 5; // Rounded corner radius
          graphics.roundRect(-rectWidth*.5, -rectHeight*.5, rectWidth, rectHeight, scaleConstant*cornerRadius);
          graphics.stroke({ width: scaleConstant * 3, color: 0x767778 });
          graphics.fill({ color: 0x28282B});
        }} />
      )}
    </pixiContainer>
  </>
}
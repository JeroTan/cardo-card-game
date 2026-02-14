import { GlowFilter } from "pixi-filters";
import type { PropsWithChildren } from "react";

export default function StaticGlow({
  children,
  color = 0x4DCAFF,
}:PropsWithChildren<{
  color?: number,
}>){
  return <>
    <pixiContainer
      filters={[new GlowFilter({
        distance: 5,
        innerStrength: 0,
        color: color,
        quality: 0.2,
      })]}
    >
      {children}
    </pixiContainer>
  </>
}
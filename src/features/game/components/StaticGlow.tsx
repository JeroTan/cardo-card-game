import { GlowFilter } from "pixi-filters";
import type { PropsWithChildren } from "react";

export default function StaticGlow({children}:PropsWithChildren<{}>){
  return <>
    <pixiContainer
      filters={[new GlowFilter({
        distance: 5,
        innerStrength: 0,
        color: 0x4DCAFF,
        quality: 0.2,
      })]}
    >
      {children}
    </pixiContainer>
  </>
}
import { useEffect, useRef, useCallback, useState } from "react";
import { useAppWithScaleConstant } from "../utils/Math";
import { Container, type Graphics, type Sprite } from "pixi.js";
import { DropShadowFilter } from "pixi-filters";

export default function FloatingMenu({
  children,
  graphicRef = null!,
  fill = 0x1a1a1a,
  padding = 12,
}:{
  children?: React.ReactNode,
  graphicRef: Container|Sprite|null|Graphics,
  fill?: number,
  padding?: number,
}){
  const [, scaleConstant] = useAppWithScaleConstant();
  const thisRef = useRef<Container|null>(null);
  const contentRef = useRef<Container|null>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });

  const drawBackground = useCallback((g: Graphics) => {
    g.clear();
    g.roundRect(
      -padding,
      -padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2,
      8 * scaleConstant
    );
    g.fill({ color: fill, alpha: 0.95 });
    g.stroke({ color: 0x333333, width: 1, alpha: 0.5 });

    // Apply drop shadow filter
    const dropShadow = new DropShadowFilter({
      offset: { x: 0, y: 4 * scaleConstant },
      blur: 8 * scaleConstant,
      color: 0x000000,
      alpha: 0.4,
    });
    g.filters = [dropShadow];
  }, [bounds, fill, padding, scaleConstant]);

  useEffect(()=>{
    if(!contentRef.current) return;
    const content = contentRef.current;
    
    // Get bounds of children and update state to trigger redraw
    const contentBounds = content.getBounds();
    setBounds({ width: contentBounds.width, height: contentBounds.height });

  }, [children]);

  useEffect(()=>{
    // Check if graphicRef is a RefObject (has 'current' property)
    if(!graphicRef || !thisRef.current) return;

    // We need to get both x and y of the graphicRef to make relative position with the floating menu
    const refPosition = {x: graphicRef.x, y: graphicRef.y};
    const refSize = {width: graphicRef.width, height: graphicRef.height};

    // Position the floating menu relative and must be in center of the graphicRef
    thisRef.current.position.x = refPosition.x + (refSize.width * 0.5) - (thisRef.current.width * .75);
    thisRef.current.position.y = refPosition.y + (refSize.height * 0.5) - (thisRef.current.height * 1.25);

  }, [graphicRef, scaleConstant]);

  return <pixiContainer
    ref={thisRef}
  >
    <pixiGraphics draw={drawBackground} />
    <pixiContainer ref={contentRef}>
      {children}
    </pixiContainer>
  </pixiContainer>
} 
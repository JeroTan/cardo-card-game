import type { PropsWithChildren } from "react";
import { useRef, useEffect, Children } from "react";
import { Container } from "pixi.js";
import { ScrollBox } from "@pixi/ui";
import { useAppWithScaleConstant } from "../utils/Math";

export function ScrollerWindow({
  children,
  height = 500,
  width = 400,
}: PropsWithChildren<{
  height?: number;
  width?: number;
}>) {
  const [, scaleConstant] = useAppWithScaleConstant();
  const containerRef = useRef<Container|null>(null);
  
  useEffect(()=>{
    if(!containerRef.current) return;
    const container = containerRef.current;
    const pixiChildren = container.children;

    const scrollBox = new ScrollBox({
      width: width * scaleConstant,
      height: height * scaleConstant,
      vertPadding: 10 * scaleConstant,
      horPadding: 10 * scaleConstant,
      elementsMargin: 5 * scaleConstant,
      items: [...pixiChildren],
    });
    pixiChildren.forEach(child => {
      container.removeChild(child);
    });
    containerRef.current.addChild(scrollBox);
  }, []);

  return <>
    <pixiContainer
      ref={containerRef}
    >
      {children}
    </pixiContainer>
  </>;
}
import { useRef, useEffect, useState } from "react";
import { useAppWithScaleConstant } from "../utils/Math";
import { Container } from "pixi.js";

export default function Modal({
  children,
  closeButtonCallback,
  backgroundCallback,
  padding = 40,
}:{
  children?: React.ReactNode,
  closeButtonCallback?: ()=>void,
  backgroundCallback?: ()=>void,
  padding?: number,
}){
  const [app, scaleConstant] = useAppWithScaleConstant();
  const childrenContainerRef = useRef<Container | null>(null);
  const [modalSize, setModalSize] = useState({ width: 0, height: 0 });
  const [isCloseHovered, setIsCloseHovered] = useState(false);

  useEffect(() => {
    if (childrenContainerRef.current) {
      const bounds = childrenContainerRef.current.getLocalBounds();
      setModalSize({
        width: bounds.width + padding * 2,
        height: bounds.height + padding * 2
      });
    }
  }, [children, padding]);

  const modalX = app ? (app.screen.width - modalSize.width) / 2 : 0;
  const modalY = app ? (app.screen.height - modalSize.height) / 2 : 0;

  return <pixiContainer>
    {/** Backdrop */}
    <pixiGraphics 
      eventMode="static"
      onPointerDown={()=>{
        backgroundCallback?.();
      }}
      onClick={()=>{}}
      draw={(graphics)=>{
        graphics.clear();
        graphics.rect(0, 0, 1920 * scaleConstant, 1080 * scaleConstant);
        graphics.fill({ color: 0x000000, alpha: 0.5 });
      }}
    />

    {/** Modal Container Background */}
    <pixiGraphics
      x={modalX}
      y={modalY}
      draw={(graphics)=>{
        graphics.clear();
        if (modalSize.width > 0 && modalSize.height > 0) {
          graphics.roundRect(0, 0, modalSize.width, modalSize.height, 12);
          graphics.fill({ color: 0x1a1a1a, alpha: 1 });
        }
      }} 
    />

    {/** Close Button */}
    {closeButtonCallback && (
      <pixiContainer
        onClick={()=>{
          closeButtonCallback();
        }}
        x={modalX + modalSize.width - 40}
        y={modalY + 10}
        eventMode="static"
        cursor="pointer"
        onPointerEnter={() => setIsCloseHovered(true)}
        onPointerLeave={() => setIsCloseHovered(false)}
      >
        {/** Ghost Button Background */}
        <pixiGraphics 
          draw={(graphics)=>{
            graphics.clear();
            if (isCloseHovered) {
              graphics.circle(15, 15, 15);
              graphics.fill({ color: 0x2a2a2a, alpha: 1 });
            }
          }}
        />
        {/** Close Icon */}
        <pixiGraphics
          draw={(graphics)=>{
            graphics.clear();
            graphics.moveTo(8, 8);
            graphics.lineTo(22, 22);
            graphics.moveTo(22, 8);
            graphics.lineTo(8, 22);
            graphics.stroke({ color: 0xFFFFFF, width: 2 });
          }}
        />
      </pixiContainer>
    )}

    {/** Children Container */}
    <pixiContainer
      ref={childrenContainerRef}
      x={modalX + padding}
      y={modalY + padding}
    >
      {/** The rest of content */}
      { children }

    </pixiContainer>
  </pixiContainer>
}
import { useAppWithScaleConstant } from "../utils/Math";
import { useCallback, useMemo, useRef, useState } from "react";

export function Button({
  text = "Button",
  minWidth,
  fontSize = 24,
  onClick,
  disabled = false,
  useCenterCoordinate = false,
  x = 0,
  y = 0,
  color = 0x505050,
  textColor = 0xFFFFFF,
}:{
  text?: string,
  minWidth?: number,
  fontSize?: number,
  onClick?: ()=>void,
  disabled?: boolean,
  useCenterCoordinate?: boolean,
  x?: number,
  y?: number,
  color?: number,
  textColor?: number,
}){
  const [, scaleConstant] = useAppWithScaleConstant();
  const [isHovered, setIsHovered] = useState(false);
  const textRef = useRef<any>(null);

  // Padding in pixels (tailwind: y=2, x=4)
  const { scaledFontSize, buttonWidth, buttonHeight } = useMemo(() => {
    const paddingX = 12 * scaleConstant;
    const paddingY = 8 * scaleConstant;
    const scaledFontSize = fontSize * scaleConstant;
    const estimatedTextWidth = text.length * scaledFontSize * 0.6;
    const buttonWidth = minWidth 
      ? Math.max((minWidth * scaleConstant), estimatedTextWidth + (paddingX * 2))
      : estimatedTextWidth + (paddingX * 2);
    const buttonHeight = scaledFontSize + (paddingY * 2);
    
    return { scaledFontSize, buttonWidth, buttonHeight };
  }, [scaleConstant, fontSize, text, minWidth]);

  // Calculate position based on useCenterCoordinate
  const { posX, posY } = useMemo(() => {
    const posX = useCenterCoordinate 
      ? ((1920 * scaleConstant) / 2) + (x * scaleConstant)
      : x * scaleConstant;
    
    const posY = useCenterCoordinate 
      ? ((1080 * scaleConstant) / 2) - (y * scaleConstant)
      : y * scaleConstant;
    
    return { posX, posY };
  }, [useCenterCoordinate, scaleConstant, x, y]);

  const handleClick = useCallback(() => {
    if (!disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);

  const handlePointerOver = useCallback(() => {
    if (!disabled) {
      setIsHovered(true);
    }
  }, [disabled]);

  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Adjust colors if disabled (dimmer)
  const finalColor = disabled ? color & 0x7F7F7F : color;
  const finalTextColor = disabled ? textColor & 0x7F7F7F : textColor;
  
  // Brighten color on hover by extracting RGB and adding to each channel
  const hoverColor = useMemo(() => {
    const r = Math.min(255, ((finalColor >> 16) & 0xFF) + 0x20);
    const g = Math.min(255, ((finalColor >> 8) & 0xFF) + 0x20);
    const b = Math.min(255, (finalColor & 0xFF) + 0x20);
    return (r << 16) | (g << 8) | b;
  }, [finalColor]);

  // Calculate drawing offsets based on useCenterCoordinate
  const rectX = useCenterCoordinate ? -buttonWidth / 2 : 0;
  const rectY = useCenterCoordinate ? -buttonHeight / 2 : 0;
  const textX = useCenterCoordinate ? 0 : buttonWidth / 2;
  const textY = useCenterCoordinate ? 0 : buttonHeight / 2;

  return <>
    <pixiContainer
      x={posX}
      y={posY}
      eventMode={disabled ? "none" : "static"}
      cursor={disabled ? "default" : "pointer"}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <pixiGraphics 
        draw={(graphics)=>{
          graphics.clear();
          
          // Draw rounded rectangle button
          graphics.roundRect(rectX, rectY, buttonWidth, buttonHeight, 4 * scaleConstant);
          graphics.fill({ color: isHovered && !disabled ? hoverColor : finalColor });
          graphics.stroke({ width: scaleConstant, color: 0x767778, alignment: 0 });
        }}
      />
      <pixiText 
        ref={textRef}
        text={text}
        x={textX}
        y={textY}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{
          fontSize: scaledFontSize,
          fill: finalTextColor,
          fontWeight: "600",
        }}
      />
    </pixiContainer>
  </>
}
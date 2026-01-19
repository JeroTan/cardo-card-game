import { Circle } from "pixi.js";
import { useCallback } from "react";
import { useAppWithScaleConstat } from "../utils/Math";

export default function Board(){
  const [app, scaleConstant] = useAppWithScaleConstat();

  return <>
    <pixiGraphics
      draw={(graphics) => {
        graphics.clear();
        
        // Center a rectangle in the canvas
        const rectWidth = 1920 * scaleConstant * 0.8;
        const rectHeight = 1080 * scaleConstant * 0.6;
        const rectX = (1920 * scaleConstant - rectWidth) / 2;
        const rectY = (1080 * scaleConstant - rectHeight) / 2;
        const cornerRadius = scaleConstant * 20; // Rounded corner radius
            
        
        graphics.roundRect(rectX, rectY, rectWidth, rectHeight, cornerRadius);
        graphics.stroke({ width: scaleConstant* 8, color: 0x8C8C8C });
        
        // Inner highlight/glow effect
        graphics.roundRect(rectX + 4, rectY + 4, rectWidth - 8, rectHeight - 8, cornerRadius - 4);
        graphics.stroke({ width: scaleConstant * 2, color: 0x3A3C42, alpha: 0.5 });
        // Circle with gradient
        const circle = new Circle((1920 * scaleConstant) / 2, (1080 * scaleConstant) / 2, scaleConstant * 100);    
        graphics.circle(circle.x, circle.y, circle.radius);
        graphics.stroke({ width: scaleConstant*5, color: 0x4DCAFF });

        // Horizontal line extensions (only outside the circle)
        const lineExtension = circle.radius * 0.90; // 90% extension
        
        // Left side extension
        graphics.moveTo(circle.x - circle.radius - lineExtension, circle.y);
        graphics.lineTo(circle.x - circle.radius, circle.y);
        graphics.stroke({ width: scaleConstant * 5, color: 0x4DCAFF });
        
        // Right side extension
        graphics.moveTo(circle.x + circle.radius, circle.y);
        graphics.lineTo(circle.x + circle.radius + lineExtension, circle.y);
        graphics.stroke({ width: scaleConstant * 5, color: 0x4DCAFF });
        
      }}
    />

    {/** Bottom Jail */}
    <JailGraphics x={-522} y={-216} />

    {/** Top Jail */}
    <JailGraphics x={522} y={216} />

    {/** Bottom Drawer */}
    <DrawerGraphics x={522} y={-216} />

    {/** Top Drawer */}
    <DrawerGraphics x={-522} y={216} />
  </>
}

function JailGraphics({x:horizontalOffset, y: verticalOffset} : {x: number, y: number}) {
  const [app, scaleConstant] = useAppWithScaleConstat();

  const makeRectCalculator = useCallback(({rectWidth, rectHeight}:{rectWidth: number, rectHeight: number})=>{
    return function offsetOfRect({x, y}: {x: number, y: number}){
      return {
        x: ((1920 * scaleConstant) - rectWidth) / 2 + x,
        y: ((1080 * scaleConstant) - rectHeight) / 2 - y,
      }
    }
  }, [scaleConstant]);

  return <>
    <pixiGraphics draw={(graphics)=>{
      graphics.clear();
      // Create Card Container with 2:3 aspect ratio
      const cardScale = 0.085; // Single parameter to adjust size (relative to canvas width)
      const rectWidth = (1920 * scaleConstant) * cardScale;
      const rectHeight = rectWidth * (3/2); // Height is 1.5x width for 2:3 ratio (width:height)

      const positionCalc = makeRectCalculator({rectWidth, rectHeight});
      const {x: rectX, y: rectY} =  positionCalc({x: horizontalOffset, y: verticalOffset});
      
      const cornerRadius = 5; // Rounded corner radius
      graphics.roundRect(rectX, rectY, rectWidth, rectHeight, scaleConstant*cornerRadius);
      graphics.stroke({ width: scaleConstant * 3, color: 0xFF2222 });
      graphics.fill({ color: 0x28282B});
    }} />
  </>
}

function DrawerGraphics({x:horizontalOffset, y: verticalOffset} : {x: number, y: number}) {
  const [app, scaleConstant] = useAppWithScaleConstat();

  const makeRectCalculator = useCallback(({rectWidth, rectHeight}:{rectWidth: number, rectHeight: number})=>{
    return function offsetOfRect({x, y}: {x: number, y: number}){
      return {
        x: ((1920 * scaleConstant) - rectWidth) / 2 + x,
        y: ((1080 * scaleConstant) - rectHeight) / 2 - y,
      }
    }
  }, [scaleConstant]);
  return <>
    <pixiGraphics draw={(graphics)=>{
      graphics.clear();
      // Create Card Container with 2:3 aspect ratio
      const cardScale = 0.085; // Single parameter to adjust size (relative to canvas width)
      const rectWidth = (1920 * scaleConstant) * cardScale;
      const rectHeight = rectWidth * (3/2); // Height is 1.5x width for 2:3 ratio (width:height)

      const positionCalc = makeRectCalculator({rectWidth, rectHeight});
      const {x: rectX, y: rectY} =  positionCalc({x: horizontalOffset, y: verticalOffset});
      
      const cornerRadius = 5; // Rounded corner radius
      graphics.roundRect(rectX, rectY, rectWidth, rectHeight, scaleConstant* cornerRadius);
      graphics.stroke({ width: scaleConstant * 3, color: 0xFFE522 });
      graphics.fill({ color: 0x28282B});
    }} />
  </>
}

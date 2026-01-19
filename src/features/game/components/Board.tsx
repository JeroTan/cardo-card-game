import { useApplication } from "@pixi/react"
import { Circle, FillGradient } from "pixi.js";
import { useCallback } from "react";

export default function Board(){
  const {app} = useApplication();

  return <>
    <pixiGraphics
      draw={(graphics) => {
        graphics.clear();
        
        // Center a rectangle in the canvas
        const rectWidth = app.renderer.width * 0.8;
        const rectHeight = app.renderer.height * 0.6;
        const rectX = (app.renderer.width - rectWidth) / 2;
        const rectY = (app.renderer.height - rectHeight) / 2;
        const cornerRadius = 20; // Rounded corner radius
            
        
        graphics.roundRect(rectX, rectY, rectWidth, rectHeight, cornerRadius);
        graphics.stroke({ width: 8, color: 0x8C8C8C });
        
        // Inner highlight/glow effect
        graphics.roundRect(rectX + 4, rectY + 4, rectWidth - 8, rectHeight - 8, cornerRadius - 4);
        graphics.stroke({ width: 2, color: 0x3A3C42, alpha: 0.5 });

        // Circle with gradient
        const circle = new Circle(app.renderer.width / 2, app.renderer.height / 2, 100);    
        graphics.circle(circle.x, circle.y, circle.radius);
        graphics.stroke({ width: 5, color: 0x4DCAFF });

        // Horizontal line extensions (only outside the circle)
        const lineExtension = circle.radius * 0.90; // 90% extension
        
        // Left side extension
        graphics.moveTo(circle.x - circle.radius - lineExtension, circle.y);
        graphics.lineTo(circle.x - circle.radius, circle.y);
        graphics.stroke({ width: 5, color: 0x4DCAFF });
        
        // Right side extension
        graphics.moveTo(circle.x + circle.radius, circle.y);
        graphics.lineTo(circle.x + circle.radius + lineExtension, circle.y);
        graphics.stroke({ width: 5, color: 0x4DCAFF });
        
      }}
    />

    {/** Bottom Jail */}
    <JailGraphics x={-615} y={-250} />

    {/** Top Jail */}
    <JailGraphics x={615} y={250} />

    {/** Bottom Drawer */}
    <DrawerGraphics x={615} y={-250} />

    {/** Top Drawer */}
    <DrawerGraphics x={-615} y={250} />
  </>
}

function JailGraphics({x:horizontalOffset, y: verticalOffset} : {x: number, y: number}) {
  const {app} = useApplication();

  const makeRectCalculator = useCallback(({rectWidth, rectHeight}:{rectWidth: number, rectHeight: number})=>{
    return function offsetOfRect({x, y}: {x: number, y: number}){
      return {
        x: (app.renderer.width - rectWidth) / 2 + x,
        y: (app.renderer.height - rectHeight) / 2 - y,
      }
    }
  }, [app]);

  return <>
    <pixiGraphics draw={(graphics)=>{
      graphics.clear();
      // Create Card Container with 2:3 aspect ratio
      const cardScale = 0.085; // Single parameter to adjust size (relative to canvas width)
      const rectWidth = app.renderer.width * cardScale;
      const rectHeight = rectWidth * (3/2); // Height is 1.5x width for 2:3 ratio (width:height)

      const positionCalc = makeRectCalculator({rectWidth, rectHeight});
      const {x: rectX, y: rectY} =  positionCalc({x: horizontalOffset, y: verticalOffset});
      
      const cornerRadius = 5; // Rounded corner radius
      graphics.roundRect(rectX, rectY, rectWidth, rectHeight, cornerRadius);
      graphics.stroke({ width: 3, color: 0xFF2222 });
      graphics.fill({ color: 0x28282B});
    }} />
  </>
}

function DrawerGraphics({x:horizontalOffset, y: verticalOffset} : {x: number, y: number}) {
  const {app} = useApplication();

  const makeRectCalculator = useCallback(({rectWidth, rectHeight}:{rectWidth: number, rectHeight: number})=>{
    return function offsetOfRect({x, y}: {x: number, y: number}){
      return {
        x: (app.renderer.width - rectWidth) / 2 + x,
        y: (app.renderer.height - rectHeight) / 2 - y,
      }
    }
  }, [app]);

  return <>
    <pixiGraphics draw={(graphics)=>{
      graphics.clear();
      // Create Card Container with 2:3 aspect ratio
      const cardScale = 0.085; // Single parameter to adjust size (relative to canvas width)
      const rectWidth = app.renderer.width * cardScale;
      const rectHeight = rectWidth * (3/2); // Height is 1.5x width for 2:3 ratio (width:height)

      const positionCalc = makeRectCalculator({rectWidth, rectHeight});
      const {x: rectX, y: rectY} =  positionCalc({x: horizontalOffset, y: verticalOffset});
      
      const cornerRadius = 5; // Rounded corner radius
      graphics.roundRect(rectX, rectY, rectWidth, rectHeight, cornerRadius);
      graphics.stroke({ width: 3, color: 0xFFE522 });
      graphics.fill({ color: 0x28282B});
    }} />
  </>
}

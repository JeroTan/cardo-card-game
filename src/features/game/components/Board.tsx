import { useApplication } from "@pixi/react"
import { Circle } from "pixi.js";

export default function Board(){
  const {app} = useApplication();
  return <>
    <pixiGraphics
      draw={(graphics) => {
        const circle= new Circle(app.renderer.width / 2, app.renderer.height / 2, 100);
        graphics.clear();
        graphics.circle(circle.x, circle.y, circle.radius);
        graphics.stroke({width: 3,color:0x37393F});
      }}
    />
  </>
}
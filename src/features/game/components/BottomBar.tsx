import { useAppWithScaleConstant } from "../utils/Math";


export default function BottomBar({highlight = false}:{
  highlight?: boolean,
}){
  const [app, scaleConstant] = useAppWithScaleConstant();
  return <>
    <pixiGraphics
      draw={(graphics)=>{
        graphics.clear();
        // Bottom Bar
        const width = 1920 * scaleConstant;
        const height = 80 * scaleConstant;
        graphics.rect(0, (1080 * scaleConstant) - height, width, height);
        graphics.fill({ color: highlight ? 0x3F3F41 : 0x1F1F21 });  
      }}
    />
    {/* <pixiGraphics 
      draw={(graphics)=>{
        graphics.clear();

        const width = 1920 * scaleConstant;
        const height = 80 * scaleConstant;
        graphics.rect(0, (1080 * scaleConstant) - height, width, height);
        graphics.stroke({ width: scaleConstant * 3, color: 0x161718, alignment: 1 });
        
        graphics.rect(0, (1080 * scaleConstant) - height, width, height);
        graphics.stroke({ width: scaleConstant * 2, color: 0x565758, alignment: 1 });
      }}
    /> */}
  </>
}
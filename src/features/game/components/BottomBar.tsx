import { useAppWithScaleConstant } from "../utils/Math";


export default function BottomBar(){
  const [app, scaleConstant] = useAppWithScaleConstant();
  return <>
    <pixiGraphics
      draw={(graphics)=>{
        graphics.clear();
        // Bottom Bar
        const width = 1920 * scaleConstant;
        const height = 80 * scaleConstant;
        graphics.rect(0, (1080 * scaleConstant) - height, width, height);
        graphics.fill({ color: 0x1F1F21 });  
      }}
    />
  </>
}
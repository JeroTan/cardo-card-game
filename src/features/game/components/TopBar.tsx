import { useAppWithScaleConstant } from "../utils/Math";

export default function NavBar(){
  const [app, scaleConstant] = useAppWithScaleConstant();

  return <>
    <pixiGraphics
      draw={(graphics)=>{
        graphics.clear();

        // Top Nav Bar
        const width = 1920 * scaleConstant;
        const height = 80 * scaleConstant;

        graphics.rect(0, 0, width, height);
        graphics.fill({ color: 0x1F1F21 });
      }}
    />
  </>
}
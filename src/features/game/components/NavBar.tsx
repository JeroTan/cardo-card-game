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

        graphics.fill({ color: 0x2F1F21 });
        graphics.rect(0, 0, width, height);
      }}
    />
  </>
}
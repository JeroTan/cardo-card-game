import { useApplication } from "@pixi/react";

export function useAppWithScaleConstat(props:{width?: number, height?: number} = {
  width: 1920,
  height:1080,
}) {
  const {app} = useApplication();
  const baseWidth = props.width || 1920;
  const baseHeight = props.height || 1080;
  console.log(`
    basewith: ${baseWidth}, baseHeight: ${baseHeight}
    renderer width: ${app.renderer.width}, renderer height: ${app.renderer.height}
    `)
  return [
    app,
    app.renderer.width/ baseWidth ,
    app.renderer.height / baseHeight
  ] as const;
}
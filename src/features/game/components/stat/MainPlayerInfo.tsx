import { TextStyle } from "pixi.js";
import { useAppWithScaleConstant } from "../../utils/Math";
import { makeFontStyle } from "../font/FontStyles";
import { TurnInfo } from "./TurnInfo";


export default function MainPlayerInfo({
  playerName = "Player 1",
}:{
  playerName?: string,
}){
  const [, scaleConstant] = useAppWithScaleConstant();
  return <>
    <pixiContainer
      x={0}
      y={1080 * scaleConstant - (50 * scaleConstant)}
    >
      <pixiText
        text={`${playerName}`}
        style={makeFontStyle({
          fontStyle: "italic",
          fontSize: 36 * scaleConstant,
        })}
        x={120 * scaleConstant}
        y={-5 * scaleConstant}
      /> 
      <TurnInfo 
        x={10 * scaleConstant}
        y={-10 * scaleConstant}
      />

    </pixiContainer>
  </>
}
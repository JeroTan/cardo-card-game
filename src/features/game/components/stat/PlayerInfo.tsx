import { useAppWithScaleConstant } from "../../utils/Math";
import { makeFontStyle } from "../font/FontStyles";


export default function PlayerInfo({
  playerName = "Player 1",
  x = 0,
  y = 0,
}:{
  playerName?: string,
  x?: number,
  y?: number,
}){
  const [, scaleConstant] = useAppWithScaleConstant();
  return <>
    <pixiContainer
      x={x * scaleConstant}
      y={y * scaleConstant}
    >
      <pixiText
        text={`${playerName}`}
        style={makeFontStyle({
          fontStyle: "italic",
          fontSize: 36 * scaleConstant,
        })}
      /> 
    </pixiContainer>
  </>
}
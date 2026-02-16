import { useAppWithScaleConstant } from "../../utils/Math";
import { makeFontStyle } from "../font/FontStyles";


export default function PlayerInfo({
  playerName = "Player 1",
  x = 0,
  y = 0,
  status = "NONE",
}:{
  playerName?: string,
  x?: number,
  y?: number,
  status?: "LOSE" | "NONE",
}){
  const [, scaleConstant] = useAppWithScaleConstant();
  return <>
    <pixiContainer
      x={x * scaleConstant}
      y={y * scaleConstant}
    >
      <pixiText 
        text={status === "LOSE" ? "Lose" : ""}
        y={-30 * scaleConstant}
        style={makeFontStyle({
          fontSize: 20 * scaleConstant,
          fill: status === "LOSE" ? 0xFF3333 : 0xFFFFFF,
        })}
      />
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
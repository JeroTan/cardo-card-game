import { useAppWithScaleConstant } from "../../utils/Math";
import { makeFontStyle } from "../font/FontStyles";
import { TurnInfo } from "./TurnInfo";

export function OpponentInfo(){

}


export function OpponentStat({
  x = 0,
  y = 0, 
  playerName,
  cardLeft,
  turnPassed,
}:{
  x?:number,
  y?:number,
  playerName?:string,
  cardLeft?: number,
  turnPassed?: number,

}){
  const [, scaleConstant] = useAppWithScaleConstant();

  return <pixiContainer
    x={x*scaleConstant}
    y={y*scaleConstant}
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
      cardLeft={cardLeft}
      turnPassed={turnPassed}
    />

  </pixiContainer>
}
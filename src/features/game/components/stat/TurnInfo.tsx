import { makeFontStyle } from "../font/FontStyles";
import { useAppWithScaleConstant } from "../../utils/Math";

export function TurnInfo({
  x = 0,
  y = 0,
  turnPassed = 0,
  cardLeft = 0,
}:{
  x?:number,
  y?:number,
  turnPassed?: number,
  cardLeft?: number,
}){
  const [, scaleConstant] = useAppWithScaleConstant();

  return <>
    <pixiContainer
      x={x*scaleConstant}
      y={y*scaleConstant}
    >
      <pixiText
        text={`Turn`}
        style={makeFontStyle({
          fontWeight: "100",
          fontSize: (17+5) * scaleConstant,
          fill: 0x909090,
          align: "right",
        })}
      />
      <pixiText
        text={`${turnPassed}`}
        style={makeFontStyle({
          fontWeight: "100",
          fontSize: (17+5) * scaleConstant,
        })}
        y={24*scaleConstant}
      />

      <pixiText
        text={`Deck`}
        style={makeFontStyle({
          fontWeight: "100",
          fontSize: (17+5) * scaleConstant,
          fill: 0x909090
        })}
        x={45*scaleConstant}
      />
      <pixiText
        text={`${cardLeft}`}
        style={makeFontStyle({
          fontWeight: "100",
          fontSize: (17+5) * scaleConstant,
        })}
        x={45*scaleConstant}
        y={24*scaleConstant}
      />
      

    </pixiContainer>
  </>
}
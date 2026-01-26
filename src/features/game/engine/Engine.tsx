import { Fragment } from "react/jsx-runtime";
import Board from "../components/Board";
import Card from "../components/Card";
import HoverGlow from "../components/HoverGlow";
import NavBar from "../components/NavBar";
import { Pile } from "../components/Pile";
import { FocusContextProvider } from "../context/FocusContext";
import { locateCardXFromCenter, useAppWithScaleConstant } from "../utils/Math";
import Interface from "./Interface";
import { useApplication } from '@pixi/react';
import { AttackToSentinelAnimation } from "../components/AttackAnimation";

export default function Engine(){
  return <>
    <FocusContextProvider>
      <Interface>
        <Composer />
      </Interface>
    </FocusContextProvider>
  </>
}

function Composer(){
  const [app, scaleConstant] = useAppWithScaleConstant();
  return <>
    <Board />
    <NavBar />
    <HoverGlow>
      <Pile
        topCard={"/images/card_back.svg"}
        horizontalOffset={-771}
        verticalOffset={281}
        pileSize={25}
      />
    </HoverGlow>
    <HoverGlow>
      <Pile
        topCard={"/images/card_back.svg"}
        horizontalOffset={771}
        verticalOffset={-281}
        pileSize={50}
      />
    </HoverGlow>
    {locateCardXFromCenter({
      howMany: 7,
      gap: 50,
      canvasSize: 1490,
      scaleConstant: scaleConstant,
      midCoordinates: 0,
      useCenter: true,
    }).map((horizontalOffset, index) => {
      return <Fragment key={index}>
        <HoverGlow>
          <AttackToSentinelAnimation
            scaleConstant={scaleConstant}
          >
            <Card
              horizontalOffset={horizontalOffset}
              verticalOffset={-281}
              src={`/images/card_${"back"}.svg`}
            />
          </AttackToSentinelAnimation>
          {/* <Card
              horizontalOffset={horizontalOffset}
              verticalOffset={-281}
              src={`/images/card_${"back"}.svg`}
            /> */}
        </HoverGlow>
      </Fragment>
    })}
  </>
}
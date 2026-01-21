import { Fragment } from "react/jsx-runtime";
import Board from "../components/Board";
import Card from "../components/Card";
import HoverGlow from "../components/HoverGlow";
import NavBar from "../components/NavBar";
import { Pile } from "../components/Pile";
import { FocusContextProvider } from "../Context/FocusContext";
import { locateCardXFromCenter, useAppWithScaleConstat } from "../utils/Math";
import Interface from "./Interface";
import { useApplication } from '@pixi/react';

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
  const [app, scaleConstant] = useAppWithScaleConstat();
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
      howMany: 5,
      scaleConstant: scaleConstant,
    }).map((horizontalOffset, index) => {
      return <Fragment key={index}>
        <Card
          horizontalOffset={horizontalOffset}
          verticalOffset={0}
          src={`/images/card_${"back"}.svg`}
        />
      </Fragment>
    })}
  </>
}
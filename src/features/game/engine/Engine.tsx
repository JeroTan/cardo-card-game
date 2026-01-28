import { Fragment } from "react/jsx-runtime";
import Board from "../components/Board";
import Card from "../components/Card";
import HoverGlow from "../components/HoverGlow";
import TopBar from "../components/TopBar";
import { Pile } from "../components/Pile";
import { FocusContextProvider } from "../context/FocusContext";
import { coordinateDivider, locateCardXFromCenter, useAppWithScaleConstant } from "../utils/Math";
import Interface from "./Interface";
import { AttackToSentinelAnimation } from "../components/AttackAnimation";
import BottomBar from "../components/BottomBar";
import PlayerInfo from "../components/stat/PlayerInfo";
import { TurnInfo } from "../components/stat/TurnInfo";
import { BarContainer } from "../components/stat/BarContainer";
import { TipNote } from "../components/TipNote";
import { AttackingStat } from "../components/stat/AttackingStat";
import { DefendingStat } from "../components/stat/DefendingStat";

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
    <AttackingStat 
      x={ 350 }
      y={80}
      value={10}
    />

    <DefendingStat 
      x={ -350 }
      y={-80}
      value={8}
    />

    <TopBar />
    {coordinateDivider({
      total: 3
    }).map((data, index)=>{
      return <Fragment key={index}>
        <BarContainer
          width={data.size}
          x={data.x}
          highlight={true}
        />
        <TurnInfo 
          x={data.x+10}
          y={20}
        />
        <PlayerInfo
          playerName="Player 1"
          x={data.x+120}
          y={21}
        />
      </Fragment>
    })}
    <BottomBar />
    <BarContainer
      y={1080 - 80}
      highlight={true}
    />

    <TurnInfo 
      x={10}
      y={1080 - 60}
      cardLeft={1}
      turnPassed={5}
    />
    <PlayerInfo
      playerName="Player 1"
      x={120}
      y={1080 - 60}
    />
    <TipNote 
      tip={"This is a sample tip note to help the player understand the game mechanics better."}
      x={1920 - 960}
      y={1080 - 70}
    />

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
              verticalOffset={281}
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
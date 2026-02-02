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
import { Button } from "../components/Button";
import Modal from "../components/Modal";
import FloatingMenu from "../components/FloatingMenu";
import { useRef } from "react";
import type { Container } from "pixi.js";
import FloatingMenuContextProvider, { useFloatingMenuContext } from "../context/FloatingMenuContext";
import { findLabelCardInPixi, UtilityContainer } from "../utils/Card";
import StaticGlow from "../components/StaticGlow";

export default function Engine(){
  return <>
  <FocusContextProvider>
    <Interface>
      <FloatingMenuContextProvider>
        <Composer />
      </FloatingMenuContextProvider>
    </Interface>
  </FocusContextProvider>
   
  </>
}

function Composer(){
  const [app, scaleConstant] = useAppWithScaleConstant();
  const {openFloatingMenu} = useFloatingMenuContext();
  return <>
    <Board />
    <AttackingStat 
      x={ 350 }
      y={80}
      value={10}
      effects={"GLOWING_GREEN"}
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

    <UtilityContainer
      onClick={(graphic)=>{
        const card = findLabelCardInPixi(graphic!);
        openFloatingMenu(card, <>
           <pixiGraphics
              draw={(graphics)=>{
                graphics.clear();
                graphics.roundRect(0, 0, 200 * scaleConstant, 100 * scaleConstant, 12);
                graphics.fill({ color: 0x404346, alpha: 1 });
              }}
            />
        </>);
      }}
    >
      <HoverGlow>
        <Pile
          topCard={"/images/card_back.svg"}
          horizontalOffset={-771}
          verticalOffset={281}
          pileSize={25}
        />
      </HoverGlow>
    </UtilityContainer>
   
    <UtilityContainer
      onClick={(graphic)=>{
        const card = findLabelCardInPixi(graphic!);
        openFloatingMenu(card, <>
           <pixiGraphics
              draw={(graphics)=>{
                graphics.clear();
                graphics.roundRect(0, 0, 200 * scaleConstant, 100 * scaleConstant, 12);
                graphics.fill({ color: 0x404346, alpha: 1 });
              }}
            />
        </>);
      }}
    >
      <HoverGlow>
        <Pile
          topCard={"/images/card_back.svg"}
          horizontalOffset={771}
          verticalOffset={-281}
          pileSize={50}
        />
      </HoverGlow>
    </UtilityContainer>
   
     {locateCardXFromCenter({
      howMany: 7,
      gap: 50,
      canvasSize: 1290,
      midCoordinates: 0,
      useCenter: true,
    }).map((horizontalOffset, index) => {
      return <Fragment key={index}>
        <UtilityContainer
          onClick={(graphic)=>{
            const card = findLabelCardInPixi(graphic!);
            openFloatingMenu(card, <>
              <pixiGraphics
                draw={(graphics)=>{
                  graphics.clear();
                  graphics.roundRect(0, 0, 200 * scaleConstant, 100 * scaleConstant, 12);
                  graphics.fill({ color: 0x404346, alpha: 1 });
                }}
              />
            </>)

          }}
        >
          <HoverGlow>
            <Card
              horizontalOffset={horizontalOffset}
              verticalOffset={281}
              src={`/images/card_${"back"}.svg`}
            />
            {/* <AttackToSentinelAnimation
              scaleConstant={scaleConstant}
            >
              <Card
                horizontalOffset={horizontalOffset}
                verticalOffset={281}
                src={`/images/card_${"back"}.svg`}
              />
            </AttackToSentinelAnimation> */}
            {/* <Card
                horizontalOffset={horizontalOffset}
                verticalOffset={-281}
                src={`/images/card_${"back"}.svg`}
              /> */}
          </HoverGlow>
        </UtilityContainer>
      </Fragment>
    })}
    {locateCardXFromCenter({
      howMany: 7,
      gap: 50,
      canvasSize: 1290,
      midCoordinates: 0,
      useCenter: true,
    }).map((horizontalOffset, index) => {
      return <Fragment key={index}>
        <UtilityContainer
          onClick={(graphic)=>{
            const card = findLabelCardInPixi(graphic!);
            openFloatingMenu(card, <>
              <pixiGraphics
                draw={(graphics)=>{
                  graphics.clear();
                  graphics.roundRect(0, 0, 200 * scaleConstant, 100 * scaleConstant, 12);
                  graphics.fill({ color: 0x404346, alpha: 1 });
                }}
              />
            </>)
          }}
        >
          <HoverGlow>
            <StaticGlow>
              <Card
                horizontalOffset={horizontalOffset}
                verticalOffset={-281}
                src={`/images/card_${"back"}.svg`}
              />
            </StaticGlow>
            {/* <Card
              horizontalOffset={horizontalOffset}
              verticalOffset={-281}
              src={`/images/card_${"back"}.svg`}
            /> */}
            {/* <AttackToSentinelAnimation
              scaleConstant={scaleConstant}
            >
              <Card
                horizontalOffset={horizontalOffset}
                verticalOffset={-281}
                src={`/images/card_${"back"}.svg`}
              />
            </AttackToSentinelAnimation> */}
            {/* <Card
                horizontalOffset={horizontalOffset}
                verticalOffset={-281}
                src={`/images/card_${"back"}.svg`}
              /> */}
          </HoverGlow>
        </UtilityContainer>
       
      </Fragment>
    })}

    <Button 
      useCenterCoordinate
      x={600}
      y={30}
      text="Draw Card"
      disabled
      color={0x3D5779}
      minWidth={200}
    />

    <Button 
      useCenterCoordinate
      x={600}
      y={-30}
      text="End Turn"
      color={0xFF2222}
      minWidth={200}
      onClick={()=>{
        alert("end turn clicked")
      }}
    />

    {/* <Modal>
      <pixiGraphics 
        draw={(graphics)=>{
          graphics.clear();
          graphics.roundRect(0, 0, 400 * scaleConstant, 200 * scaleConstant, 12);
          graphics.fill({ color: 0x404346, alpha: 1 });
        }}
      />
    </Modal> */}
  </>
}
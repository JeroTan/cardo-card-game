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
import { useEffect, useMemo, useRef, useState } from "react";
import { Ticker, type Container } from "pixi.js";
import FloatingMenuContextProvider, { useFloatingMenuContext } from "../context/FloatingMenuContext";
import { findLabelCardInPixi, UtilityContainer } from "../utils/Card";
import StaticGlow from "../components/StaticGlow";
import { TipNoteContext, TipNoteContextProvider, useTipNoteContext } from "../context/TipNoteContext";
import { ModalContextProvider, useModal } from "../context/ModalContext";
import { BarWiper } from "../components/stat/BarWiper";
import type { GameCard, PlayerGameInfoClient } from "@/types/game/events";
import { useUpdateEffect } from "react-use";


export type GameEngineProps = {
  mainPlayerId: string|number, //player id
  mainPlayerHandCards: Array<GameCard>,
  drawCards: (total:number)=> void,
  cardAttack: (cardIds: Array<string|number>)=> void,
  playerEndTurn: ()=> void,
  players: Array<{
    playerId: string|number,
    username: string,
    active: boolean,
    totalCardsInDeck: number,
    cardsInJail: GameCard[],
    totalHandCards: number,
    totalTurnsPassed: number,
  }>;
  sentinelCards: Array<GameCard>,
  turnRemainingTime: number, // in seconds
}

export default function Engine(props: GameEngineProps){
  return <>
  <FocusContextProvider>
    <Interface>
      <ModalContextProvider>
        <TipNoteContextProvider>
          <FloatingMenuContextProvider>
            <Composer
              {...props}
            />
          </FloatingMenuContextProvider>
        </TipNoteContextProvider>
      </ModalContextProvider>
    </Interface>
  </FocusContextProvider>
  </>
}

function Composer({
  mainPlayerId,
  mainPlayerHandCards,
  drawCards,
  cardAttack,
  playerEndTurn,
  players,
  turnRemainingTime,
  sentinelCards,
}: GameEngineProps){
  const mainPlayer = useMemo(()=>{
    return players.find((p)=>p.playerId === mainPlayerId)!;
  }, [players, mainPlayerId]);

  const getOtherPlayers = useMemo(()=>{
    return players.filter((p)=>p.playerId !== mainPlayerId);
  }, [players, mainPlayerId]);

  const currentActivePlayer = useMemo(()=>{
    return players.find((p)=>p.active) as GameEngineProps["players"][number];
  }, [players]);

  const [otherPlayerToShowInScreen, setOtherPlayerToShowInScreen] = useState(getOtherPlayers[0].playerId); // id of the opponent to show in screen, if empty, show the one with most cards in hand
  const currentOpponentToShow = useMemo(()=>{
    return getOtherPlayers.find((p)=>p.playerId === otherPlayerToShowInScreen) as GameEngineProps["players"][number];
  }, [otherPlayerToShowInScreen, players]);

  const [activeTimerCounter, setActiveTimerCounter] = useState<number>(turnRemainingTime);

  // Use effect
  useUpdateEffect(()=>{
    if(!currentActivePlayer) return;
    // Check if current active player belongs to getOtherPlayers
    if(getOtherPlayers.some((p)=>p.playerId === currentActivePlayer.playerId)){
      setOtherPlayerToShowInScreen(currentActivePlayer.playerId);
    }
    // If not do nothing and keep the current other player to show in screen, which is either the one with most cards in hand or the one manually selected by player
  }, [currentActivePlayer, getOtherPlayers]);


  const ticker =  useRef<Ticker>(new Ticker());
  useEffect(()=>{
    if(turnRemainingTime <= 1){
      setActiveTimerCounter(0);
      return;
    }

    const endTime = Date.now() + (turnRemainingTime * 1000); // Convert seconds to milliseconds
    
    const tickerCallback = () => {
      const remaining = (endTime - Date.now()) / 1000; // Convert back to seconds

      if(remaining <= 0){
        setActiveTimerCounter(0);
        ticker.current.stop();
        return;
      }

      setActiveTimerCounter(remaining);
    };

    ticker.current.add(tickerCallback);
    ticker.current.start();

    return ()=>{
      ticker.current.remove(tickerCallback); // Remove this specific callback
      ticker.current.stop();
    }
  }, [turnRemainingTime]);


  
  const [app, scaleConstant] = useAppWithScaleConstant();
  const {openFloatingMenu} = useFloatingMenuContext();
  const {changeNote, tipNote} = useTipNoteContext();
  const {makeModal, openModal, closeModal} = useModal();
  return <>
    <Board />
    <DefendingStat 
      x={ -350 }
      y={-80}
      value={sentinelCards.length > 0 ? sentinelCards.reduce((acc, card) => acc + card.def, 0) : null}
    />
    <AttackingStat 
      x={ 350 }
      y={80}
      value={null}
      // effects={"GLOWING_GREEN"}
    />
    <TopBar />

    {coordinateDivider({
      total: getOtherPlayers.length
    }).map((data, index)=>{
      return <Fragment key={index}>
        <BarContainer
          width={data.size}
          x={data.x}
          highlight={true}
        />
        {getOtherPlayers[index].active &&
          <BarWiper 
            width={data.size}
            y={75}
            x={data.x}
            wipeBorder={activeTimerCounter / turnRemainingTime} // add Timer later
          />
        }
        <TurnInfo 
          x={data.x+10}
          y={20}
          cardLeft={getOtherPlayers[index].totalCardsInDeck}
          turnPassed={getOtherPlayers[index].totalTurnsPassed}
        />
        <PlayerInfo
          playerName={`${getOtherPlayers[index].username}`}
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
    {mainPlayer.active && <>
      <BarWiper 
        y={1080 - 80 + 75}
        width={960 - 30}
        wipeBorder={activeTimerCounter / turnRemainingTime}
      />
    </>}
    <TurnInfo 
      x={10}
      y={1080 - 60}
      cardLeft={mainPlayer.totalCardsInDeck}
      turnPassed={mainPlayer.totalTurnsPassed}
    />
    <PlayerInfo
      playerName={`${mainPlayer.username}`}
      x={120}
      y={1080 - 60}
    />
    <BarContainer
      width={960 + 30}
      height={55}
      x={1920 - 960 -30}
      y={1080 -80}
      highlight={true}
      bgColor={0x353535}
    />
    <TipNote 
      tip={tipNote ? tipNote : ""}
      x={1920 - 960}
      y={1080 - 70}
    />

    {/** Opponent's Deck */}
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
          pileSize={currentOpponentToShow.totalCardsInDeck}
        />
      </HoverGlow>
    </UtilityContainer>
    {/** Opponent's Jail */}
    { currentOpponentToShow.cardsInJail.length > 0 && <>
      <UtilityContainer>
        <HoverGlow>
          <Pile 
            topCard={currentOpponentToShow.cardsInJail.reverse()[0].card_art}
            horizontalOffset={771}
            verticalOffset={281}
          />
        </HoverGlow>
      </UtilityContainer>
    </>}
    
    {/** Main Player's Deck */}
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
          pileSize={mainPlayer.totalCardsInDeck}
        />
      </HoverGlow>
    </UtilityContainer>
    {/** Main Player's Jail */}
    {mainPlayer.cardsInJail.length > 0 && <>
      <UtilityContainer>
        <HoverGlow>
          <Pile 
            topCard={mainPlayer.cardsInJail.reverse()[0].card_art}
            horizontalOffset={-771}
            verticalOffset={-281}
          />
        </HoverGlow>
      </UtilityContainer>
    </>}

    {/** Sentinel Center */}
    {locateCardXFromCenter({
      howMany: sentinelCards.length,
      gap: 50,
      midCoordinates: 0,
      useCenter: true,
    }).map((horizontalOffset, index)=>{
      return <Fragment key={index}>
        <UtilityContainer
          onClick={(graphic)=>{
            const card = findLabelCardInPixi(graphic!);
            openFloatingMenu(card, <>
              <pixiContainer>
                <Button 
                  text="View Card"
                  minWidth={200}
                  onClick={()=>{
                    openModal();
                    makeModal({
                      children: <pixiContainer>
                        <Card 
                          src={sentinelCards[index].card_art}
                          size={30}
                          horizontalOffset={-1920/2 + 233}
                          verticalOffset={1080/2 - 356}

                        />
                      </pixiContainer>,
                      closeButtonCallback: closeModal,
                      backgroundCallback: closeModal,
                    })
                  }}
                />
              </pixiContainer>
            </>);
          }}
        >
          <HoverGlow>
            <Card
              horizontalOffset={horizontalOffset}
              verticalOffset={0}
              src={sentinelCards[index].card_art}
            />
          </HoverGlow>
        </UtilityContainer>
      </Fragment>
    })}
   
    {/** Opponent's Card */}
    {locateCardXFromCenter({
      howMany: currentOpponentToShow.totalHandCards,
      gap: 50,
      canvasSize: 1290,
      midCoordinates: 0,
      useCenter: true,
    }).map((horizontalOffset, index) => {
      return <Fragment key={index}>
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
      </Fragment>
    })}

    {/** Main Player's Card */}
    {locateCardXFromCenter({
      howMany: mainPlayerHandCards.length,
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
              <pixiContainer>
                <Button 
                  text="Solo Attack"
                  minWidth={200}
                />
                <Button 
                  y={50}
                  text="Combo Attack"
                  minWidth={200}
                />
                <Button 
                  y={100}
                  text="View Card"
                  minWidth={200}
                  onClick={()=>{
                    openModal();
                    makeModal({
                      children: <pixiContainer>
                        <Card 
                          src={mainPlayerHandCards[index].card_art}
                          size={30}
                          horizontalOffset={-1920/2 + 233}
                          verticalOffset={1080/2 - 356}
                        />
                      </pixiContainer>,
                      closeButtonCallback: closeModal,
                      backgroundCallback: closeModal,
                    })
                  }}
                />
              </pixiContainer>
            </>)
          }}
        >
          <HoverGlow>
            <StaticGlow>
              <Card
                horizontalOffset={horizontalOffset}
                verticalOffset={-281}
                src={mainPlayerHandCards[index].card_art}
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
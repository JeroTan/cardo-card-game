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
import { useEffect, useMemo, useRef, useState } from "react";
import { Ticker } from "pixi.js";
import FloatingMenuContextProvider, { useFloatingMenuContext } from "../context/FloatingMenuContext";
import { findLabelCardInPixi, UtilityContainer } from "../utils/Card";
import StaticGlow from "../components/StaticGlow";
import { TipNoteContextProvider, useTipNoteContext } from "../context/TipNoteContext";
import { ModalContextProvider, useModal } from "../context/ModalContext";
import { BarWiper } from "../components/stat/BarWiper";
import type { GameCard } from "@/types/game/events";
import { useUpdateEffect } from "react-use";
import { makeFontStyle } from "../components/font/FontStyles";
import { ScrollerWindow } from "../components/ScrollerWindow";


export type GameEngineProps = {
  mainPlayerId: string|number, //player id
  mainPlayerHandCards: Array<GameCard>,
  drawCards: (total:number)=> void,
  cardAttack: (cardIds: Array<string|number>, hasAnimation:boolean)=> void,
  playerEndTurn: ()=> void,
  cardDiscarder: (cardIds: Array<string|number>)=> void,
  surrender: ()=> void,
  players: Array<{
    playerId: string|number,
    username: string,
    active: boolean,
    totalCardsInDeck: number,
    cardsInJail: GameCard[],
    totalHandCards: number,
    totalTurnsPassed: number,
  }>;
  losePlayers: Array<string>,// id of losing players
  sentinelCards: Array<GameCard>,
  sentinelOwner: string|null,
  turnRemainingTime: number, // in seconds
  shortModalMessage?: string,
  tipNote?: string,
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
  cardDiscarder,
  surrender,
  players,
  losePlayers,
  turnRemainingTime,
  sentinelCards,
  sentinelOwner,
  shortModalMessage,  
  tipNote,
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

  const mainPlayerJailTopCard = useMemo(()=>{
    return mainPlayer.cardsInJail.length > 0 ? mainPlayer.cardsInJail[mainPlayer.cardsInJail.length - 1].card_art : null;
  }, [mainPlayer]);

  const opponentJailTopCard = useMemo(()=>{
    return currentOpponentToShow.cardsInJail.length > 0 ? currentOpponentToShow.cardsInJail[currentOpponentToShow.cardsInJail.length - 1].card_art : null;
  }, [currentOpponentToShow]);

  // Use effect for showing current player automatically when next turn trigger.
  useUpdateEffect(()=>{
    if(!currentActivePlayer) return;
    // Check if current active player belongs to getOtherPlayers
    if(getOtherPlayers.some((p)=>p.playerId === currentActivePlayer.playerId)){
      setOtherPlayerToShowInScreen(currentActivePlayer.playerId);
    }
    // If not do nothing and keep the current other player to show in screen, which is either the one with most cards in hand or the one manually selected by player
  }, [currentActivePlayer, getOtherPlayers]);

  // Timer for active player turn
  const [activeTimerCounter, setActiveTimerCounter] = useState<number>(turnRemainingTime);
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

  const centerStatus = useMemo(()=>{
    if(sentinelOwner === null) return "NEUTRAL";
    if(sentinelOwner === mainPlayerId) return "MAIN_PLAYER";
    return "OPPONENT";
  }, [sentinelOwner, mainPlayerId]);

  const isMainPlayerSentinel = useMemo(()=>{
    return sentinelOwner === mainPlayerId;
  }, [sentinelOwner, mainPlayerId]);

  // --- Winning Check --- //
  useEffect(()=>{
    if(!(losePlayers.length >= (players.length - 1))) return;

    makeModal({
      children:  <pixiContainer>
        <pixiText
          text={`Player ${players.find((p)=>!losePlayers.some((losersId)=>losersId === p.playerId))?.username} wins!`}
          style={makeFontStyle({ })}
        />
      </pixiContainer>,
      closeButtonCallback: closeModal,
      backgroundCallback: closeModal,
    });
    openModal();
  }, [losePlayers]);

  const {openFloatingMenu, close: closeFloatingMenu} = useFloatingMenuContext();
  const {changeNote, tipNote: tipNoteLocal} = useTipNoteContext();
  const {makeModal, openModal, closeModal} = useModal();
  const [attackCalculation, attackCalculationSet] = useState<number|null>(null);
  const [comboAttackSelection, comboAttackSelectionSet] = useState<Array<string|number>|null>(null);
  const [triggerAttackAnimation, triggerAttackAnimationSet] = useState(false);
  const [ discardSelection, discardSelectionSet ] = useState<Array<string|number>|null>(null);
  const [alreadyDrawn, alreadyDrawnSet] = useState(false); // To prevent multiple draw in one turn due to click or other reasons. Reset every new turn in useEffect below.

  // --- Global Handlers --- //
  useEffect(()=>{
    changeNote(tipNote || ""); //In case the props is requesting a tip update.
  }, [tipNote]);
  useEffect(()=>{ // Trigger every new turn, to reset internal states in engine
    discardSelectionSet(null);
    attackCalculationSet(null);
    comboAttackSelectionSet(null);
    triggerAttackAnimationSet(false);
    alreadyDrawnSet(false); 
    closeFloatingMenu();
  }, [currentActivePlayer.playerId]);

  return <>
    <Board
      centerStatus={centerStatus}
      onClick={()=>{
        closeFloatingMenu();
      }}
    />
    <DefendingStat 
      x={ -350 }
      y={-80}
      value={sentinelCards.length > 0 ? (sentinelCards.reduce((acc, card) => acc + card.def, 0) == 0 ? Infinity : sentinelCards.reduce((acc, card) => acc + card.def, 0)) : null}
    />
    <AttackingStat 
      x={ 350 }
      y={80}
      value={attackCalculation}
      effects={
        (attackCalculation != null 
          && (attackCalculation == Infinity 
            || (attackCalculation > sentinelCards.reduce((acc, card) => acc + card.def, 0))
          )
          && !(sentinelCards.reduce((acc, card) => acc + card.def, 0) == 0 && attackCalculation == Infinity)
        ) ? "GLOWING_GREEN" : "DEFAULT"}
    />
    <TopBar />

    {coordinateDivider({
      total: getOtherPlayers.length
    }).map((data, index)=>{
      return <Fragment key={index}>
        <UtilityContainer
          onClick={()=>{
            setOtherPlayerToShowInScreen(getOtherPlayers[index].playerId);
          }}
        >
          <BarContainer
            width={data.size}
            x={data.x}
            highlight={getOtherPlayers[index].active}
          />  
        </UtilityContainer>
        
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
          status={losePlayers.some((losersId)=>losersId === getOtherPlayers[index].playerId) ? "LOSE" : "NONE"}
        />
      </Fragment>
    })}
    <BottomBar />
    <BarContainer
      y={1080 - 80}
      highlight={mainPlayer.active}
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
      status={losePlayers.some((losersId)=>losersId === mainPlayer.playerId) ? "LOSE" : "NONE"}
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
      tip={tipNoteLocal || ""}
      x={1920 - 960}
      y={1080 - 70}
    />

    {/** Opponent's Deck */}
    <UtilityContainer>
      <HoverGlow
        active={mainPlayer.active}
      >
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
      <UtilityContainer
         onClick={()=>{
          function openJailCards(){
            makeModal({
              children: <pixiContainer>
                <ScrollerWindow width={1000} height={900}>
                  {currentOpponentToShow.cardsInJail.map((card, index)=>{
                  return <pixiContainer key={card.id}>
                      <UtilityContainer
                        onClick={()=>{
                          closeModal();
                          makeModal({
                            children: <pixiContainer>
                              <Card 
                                src={currentOpponentToShow.cardsInJail[index].card_art}
                                size={30}
                                notCenter
                              />
                            </pixiContainer>,
                            closeButtonCallback: openJailCards,
                            backgroundCallback: openJailCards,
                          });
                          openModal();
                        }}
                      >
                        <HoverGlow
                          active={true}
                        >
                          <Card 
                            src={card.card_art}
                            notCenter
                          />
                        </HoverGlow>
                      </UtilityContainer>
                    </pixiContainer>
                  })}
                </ScrollerWindow>
              </pixiContainer>,
              closeButtonCallback: closeModal,
              backgroundCallback: closeModal,
            });
            openModal();
          }
          openJailCards();
        }}
      >
        <HoverGlow
          active={true}
        >
          <Pile 
            topCard={opponentJailTopCard}
            pileSize={currentOpponentToShow.cardsInJail.length}
            horizontalOffset={771}
            verticalOffset={281}
          />
        </HoverGlow>
      </UtilityContainer>
    </>}
    
    {/** Main Player's Deck */}
    <UtilityContainer>
      <HoverGlow
        active={mainPlayer.active}
      >
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
      <UtilityContainer
        onClick={()=>{
          function openJailCards(){
            makeModal({
              children: <pixiContainer>
                <ScrollerWindow width={1000} height={900}>
                  {mainPlayer.cardsInJail.map((card, index)=>{
                    return <pixiContainer key={card.id}>
                      <UtilityContainer
                        onClick={()=>{
                          closeModal();
                          makeModal({
                            children: <pixiContainer>
                              <Card 
                                src={sentinelCards[index].card_art}
                                size={30}
                                notCenter
                              />
                            </pixiContainer>,
                            closeButtonCallback: openJailCards,
                            backgroundCallback: openJailCards,
                          });
                          openModal();
                        }}
                      >
                        <HoverGlow
                          active={true}
                        >
                          <Card 
                            src={card.card_art}
                            notCenter
                          />
                        </HoverGlow>
                      </UtilityContainer>
                    </pixiContainer>
                  })}
                </ScrollerWindow>
              </pixiContainer>,
              closeButtonCallback: closeModal,
              backgroundCallback: closeModal,
            });
            openModal();
          }
          openJailCards();
        }}
      >
        <HoverGlow
          active={true}
        >
          <Pile 
            topCard={mainPlayerJailTopCard}
            pileSize={mainPlayer.cardsInJail.length}
            horizontalOffset={-771}
            verticalOffset={-281}
          />
        </HoverGlow>
      </UtilityContainer>
    </>}

    {/** Sentinel Center */}
    {sentinelOwner && locateCardXFromCenter({
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
          <HoverGlow active={true}>
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
          disable={
            !mainPlayer.active ||
            triggerAttackAnimation
          }
          onClick={(graphic)=>{
            // This is specific only to discard selection
            if(discardSelection != null){
              discardSelectionSet((prev)=>{
                if(prev == null) return prev;
                if(prev.includes(mainPlayerHandCards[index].id)){
                  return prev.filter((id)=>id !== mainPlayerHandCards[index].id);
                } 
                if(prev.length >= (mainPlayer.totalHandCards - 7)) return prev; // Prevent over-selecting below 7 cards in hand after discard
                return [...prev, mainPlayerHandCards[index].id];
              })
              return;
            }

            // This is specific only to combo attack selection
            if(comboAttackSelection != null){
              if(comboAttackSelection.includes(mainPlayerHandCards[index].id)){
                if(comboAttackSelection.length === 1)  return; // There must be at least 1 card selected for combo attack
                const newSelection = comboAttackSelection.filter((id)=>id !== mainPlayerHandCards[index].id);
                const playerTotalAttack = Number(newSelection.reduce((acc, id)=>{
                  const card = mainPlayerHandCards.find((c)=>c.id === id);
                  if(!card) return acc;
                  return Number(acc) + Number(card.atk);
                }, 0));
                attackCalculationSet(playerTotalAttack);
                comboAttackSelectionSet(newSelection);
                return;
              }
              if(comboAttackSelection.length >= 3) return; // Prevent selecting more than 3 cards for combo attack
              const newSelection = [...comboAttackSelection, mainPlayerHandCards[index].id];
              const playerTotalAttack = Number(newSelection.reduce((acc, id)=>{
                  const card = mainPlayerHandCards.find((c)=>c.id === id);
                  if(!card) return acc;
                  return Number(acc) + Number(card.atk);
                }, 0));
              attackCalculationSet(playerTotalAttack);
              comboAttackSelectionSet(newSelection);

              return;
            }

            //If click on card
            if(!isMainPlayerSentinel)
              attackCalculationSet(mainPlayerHandCards[index].atk == 0 ? Infinity : mainPlayerHandCards[index].atk);

            // Open floating menu for card actions
            const card = findLabelCardInPixi(graphic!);
            openFloatingMenu(card, <>
              <pixiContainer>
                {!isMainPlayerSentinel && <Button 
                  text={`${sentinelOwner != null ? "Solo Attack" : "Declare Sentinel"}`}
                  minWidth={sentinelOwner != null ? 200 : 300}
                  onClick={()=>{
                    setTimeout(()=>{
                      closeFloatingMenu();
                    }, 1);
                    if(!sentinelOwner){
                      cardAttack([mainPlayerHandCards[index].id], false);
                      changeNote("You have declared the card as sentinel! You may now end the turn.");
                      return;
                    }
                    cardAttack([mainPlayerHandCards[index].id], true);
                    comboAttackSelectionSet([mainPlayerHandCards[index].id]);
                    triggerAttackAnimationSet(true);
                    setTimeout(()=>{
                      triggerAttackAnimationSet(false);
                      comboAttackSelectionSet(null);
                      changeNote("You have made a solo attack! You may now end the turn.");
                    }, 600);
                  }}
                  disabled={
                    sentinelCards.length > 0 &&
                    ( 
                      (mainPlayerHandCards[index].atk <= sentinelCards.reduce((acc, card) => acc + card.def, 0) && mainPlayerHandCards[index].atk != 0) 
                      || (mainPlayerHandCards[index].atk == 0 && sentinelCards.reduce((acc, card) => acc + card.def, 0) == 0)
                    )
                  }
                />
                }
                {(!isMainPlayerSentinel && sentinelOwner != null) && <>
                  <Button 
                    y={50}
                    text="Combo Attack"
                    minWidth={200}
                    onClick={()=>{
                      changeNote("Select up to 3 cards for combo attack");
                      comboAttackSelectionSet([mainPlayerHandCards[index].id]);
                      attackCalculationSet(mainPlayerHandCards[index].atk);
                      closeFloatingMenu();
                      setTimeout(()=>{
                        closeFloatingMenu();
                      }, 1);
                    }}
                  />
                </>}
                <Button 
                  y={sentinelOwner != null ? (!isMainPlayerSentinel ? 100 : undefined) : (!isMainPlayerSentinel ? 50 : undefined)}
                  text="View Card"
                  minWidth={sentinelOwner != null ? 200 : 300}
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
            </>);
          }}
          onMouseEnter={()=>{
            if(comboAttackSelection != null || isMainPlayerSentinel) return; // if combo attack is being selected, hovering other cards should not trigger attack calculation preview
            attackCalculationSet( mainPlayerHandCards[index].atk == 0 ? Infinity : mainPlayerHandCards[index].atk );
          }}
        >
          <HoverGlow active={
            mainPlayer.active &&
            !triggerAttackAnimation &&
            ( !comboAttackSelection?.includes(mainPlayerHandCards[index].id)) &&
            ( !discardSelection?.includes(mainPlayerHandCards[index].id))
          }>
            {/* This one is for combo attack selection */}
            <StaticGlow
              active={comboAttackSelection?.includes(mainPlayerHandCards[index].id)}
            >
              {/* This one is for discard selection */}
              <StaticGlow
                active={discardSelection?.includes(mainPlayerHandCards[index].id)}  
              >
                <AttackToSentinelAnimation
                  active={triggerAttackAnimation && (comboAttackSelection?.includes(mainPlayerHandCards[index].id) ? true : false)  }
                >
                  <Card
                    horizontalOffset={horizontalOffset}
                    verticalOffset={-281}
                    src={mainPlayerHandCards[index].card_art}
                  />
                </AttackToSentinelAnimation>
                
              </StaticGlow>
              
            </StaticGlow>
          </HoverGlow>
        </UtilityContainer>
       
      </Fragment>
    })}

    { (comboAttackSelection == null && discardSelection == null && mainPlayer.active) && <>
      <Button 
        useCenterCoordinate
        x={600}
        y={30}
        text="Draw Card"
        disabled={mainPlayer.totalCardsInDeck <= 0 || alreadyDrawn}
        color={0x4DCAFF}
        minWidth={200}
        onClick={(graphic)=>{
          changeNote("Select how many cards to draw");
          openFloatingMenu(graphic!, <>
            <Button 
              text="Draw 1 Card"
              minWidth={200}
              onClick={()=>{
                drawCards(1);
                alreadyDrawnSet(true);
                setTimeout(()=>{
                  closeFloatingMenu();
                }, 1);
                if(mainPlayer.totalHandCards + 1 > 7 ){
                  changeNote("You have drawn more than 7 cards. Please discard down to 7 cards in hand at the end of your turn.");
                  discardSelectionSet([]);
                }
              }}
            />
            {mainPlayer.totalCardsInDeck >= 2 && <Button
              y={50}
              text="Draw 2 Cards"
              minWidth={200}
              onClick={()=>{
                drawCards(2);
                alreadyDrawnSet(true);
                setTimeout(()=>{
                  closeFloatingMenu();
                }, 1);
                if(mainPlayer.totalHandCards + 2 > 7 ){
                  changeNote("You have drawn more than 7 cards. Please discard down to 7 cards in hand at the end of your turn.");
                  discardSelectionSet([]);
                }
              }}
            />}
            {mainPlayer.totalCardsInDeck >= 3 && <Button
              y={100}
              text="Draw 3 Cards"
              minWidth={200}
              onClick={()=>{
                drawCards(3);
                alreadyDrawnSet(true);
                setTimeout(()=>{
                  closeFloatingMenu();
                }, 1);
                if(mainPlayer.totalHandCards + 3 > 7 ){
                  changeNote("You have drawn more than 7 cards. Please discard down to 7 cards in hand at the end of your turn.");
                  discardSelectionSet([]);
                }
              }}
            />}

          </>);
        }}
      />
      <Button 
        useCenterCoordinate
        x={600}
        y={-30}
        text="End Turn"
        color={0xFF2222}
        minWidth={200}
        disabled={mainPlayer.totalHandCards > 7 || triggerAttackAnimation}
        onClick={()=>{
          if( (sentinelOwner != mainPlayer.playerId) && !(alreadyDrawn || sentinelOwner == mainPlayer.playerId) ){
            changeNote("You cannot end turn yet! You must draw or declare an attack first.");
            return;
          }
          playerEndTurn();
        }}
      />
      {mainPlayer.totalCardsInDeck <= 0 && <Button 
        useCenterCoordinate
        x={600}
        y={-90}
        text="Surrender"
        color={0xFF2222}
        minWidth={200}
        onClick={()=>{
          surrender();
        }}
      />}
    </>}

    { (!triggerAttackAnimation && comboAttackSelection != null && discardSelection == null && mainPlayer.active) && <>
      <Button 
        useCenterCoordinate
        x={600}
        y={30}
        text="Combo Attack"
        color={0x3D5779}
        minWidth={200}
        disabled={
          comboAttackSelection.length === 0 ||
          attackCalculation == null ||
          attackCalculation <= sentinelCards.reduce((acc, card) => acc + card.def, 0) ||
          (attackCalculation == Infinity && sentinelCards.reduce((acc, card) => acc + card.def, 0) == 0)
        }
        onClick={()=>{
          const playerTotalAttack = Number(comboAttackSelection.reduce((acc, id)=>{
            const card = mainPlayerHandCards.find((c)=>c.id === id);
            if(!card) return acc;
            return Number(acc) + Number(card.atk);
          }, 0));
          if(comboAttackSelection.length >= 2 && playerTotalAttack <= 0){
            changeNote(`You cannot trigger "0" card burst if there are multiple cards with zero attack. Please use only one.`);
            return;
          }
          if(playerTotalAttack <= sentinelCards.reduce((acc, card) => acc + card.def, 0)){
            changeNote(`Your selected cards' total attack is not higher than the sentinel's total defense`);
            return;
          }
          cardAttack(comboAttackSelection, true);
          triggerAttackAnimationSet(true);
          setTimeout(()=>{
            triggerAttackAnimationSet(false);
            comboAttackSelectionSet(null);
            changeNote("You have made a combo attack! You may now end the turn.");
          }, 600);
        }}
      />

      <Button 
        useCenterCoordinate
        x={600}
        y={-30}
        text="Cancel Attack"
        color={0xFF2222}
        minWidth={200}
        onClick={()=>{
          comboAttackSelectionSet(null);
          changeNote(null);
        }}
      />
    </>}

    { (!triggerAttackAnimation && comboAttackSelection==null && discardSelection != null && mainPlayer.active) && <>
      <Button 
        useCenterCoordinate
        x={600}
        y={30}
        text={`Discard`}
        color={0x3D5779}
        minWidth={200}
        disabled={discardSelection.length === 0 || discardSelection.length >= mainPlayer.totalHandCards || mainPlayer.totalHandCards - discardSelection.length > 7}
        onClick={()=>{
          cardDiscarder(discardSelection);
        }}
      />
      
    </>}

    {/* <Button 
      x={100}
      y={1080 - 150}
      text="Debug Button"
      onClick={()=>{
        cardAttack(mainPlayerHandCards.map((card)=>card.id).slice(0, 2));
      }}
    /> */}

    {shortModalMessage && <>
      <Modal>
        <pixiContainer>
          <pixiText
            text={shortModalMessage}
            style={makeFontStyle({ })}
          />
        </pixiContainer>
      </Modal>
    </>}

    
  </>
}
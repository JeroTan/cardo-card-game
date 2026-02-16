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
import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
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
  cardAttack: (cardIds: Array<string|number>)=> void,
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
  turnMessage?: string,
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
  turnMessage,  
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

  const [, scaleConstant] = useAppWithScaleConstant();
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
  }, [currentActivePlayer]);

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
      value={sentinelCards.length > 0 ? sentinelCards.reduce((acc, card) => acc + card.def, 0) : null}
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
      tip={tipNoteLocal ? tipNoteLocal : ""}
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
                        <HoverGlow>
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
        <HoverGlow>
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
                        <HoverGlow>
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
        <HoverGlow>
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

      const IsAttackSelection = useCallback(({children}:PropsWithChildren<{}>)=>{
        return <>
          {(comboAttackSelection != null && comboAttackSelection.includes(mainPlayerHandCards[index].id)) ? <>
            <StaticGlow>
              {children}
            </StaticGlow>
          </> : <>
            {children}
          </> }
        </>
      }, [comboAttackSelection]);

      const IsDiscardSelection = useCallback(({children}:PropsWithChildren<{}>)=>{
        return <>
          { (discardSelection != null && discardSelection.includes(mainPlayerHandCards[index].id)) ? <>
            <StaticGlow color={0xFF3333}>
              {children}
            </StaticGlow>
          </> : <>
            {children}
          </> }
        </>;
      }, [discardSelection]);

      const IsAttackAnimating = useCallback(({children}:PropsWithChildren<{}>)=>{
        return <>
          {triggerAttackAnimation ? <>
            {comboAttackSelection && comboAttackSelection.includes(mainPlayerHandCards[index].id) ? <>
              <AttackToSentinelAnimation>
                {children}
              </AttackToSentinelAnimation>
            </> : <>
              {children}
            </>}
          </> : <>
            <HoverGlow>
              {children}
            </HoverGlow>
          </>}
        </>
      }, [triggerAttackAnimation]);

      const IsActive = useCallback(({children}:PropsWithChildren<{}>)=>{
        return <>
          {(mainPlayer.active && !triggerAttackAnimation) ? <>
            <UtilityContainer
              onClick={(graphic)=>{
                if(discardSelection != null){
                  discardSelectionSet((prev)=>{
                    if(prev == null) return prev;
                    if(prev.includes(mainPlayerHandCards[index].id)){
                      return prev.filter((id)=>id !== mainPlayerHandCards[index].id);
                    } 
                    if(prev.length >= (mainPlayer.totalHandCards - 7)) return prev; // Prevent overselecting below 7 cards in hand after discard
                    return [...prev, mainPlayerHandCards[index].id];
                  })
                  return; // if discard selection is being made, clicking other cards should not trigger attack calculation preview or open floating menu
                }
                if(comboAttackSelection != null){
                  comboAttackSelectionSet((prev)=>{
                    if(prev == null) return prev;
                    if(prev.includes(mainPlayerHandCards[index].id)){
                      const newSelection =  prev.filter((id)=>id !== mainPlayerHandCards[index].id);
                      attackCalculationSet(Number(newSelection.reduce((acc, id)=>{
                        const card = mainPlayerHandCards.find((c)=>c.id === id);
                        if(!card) return acc;
                        return Number(acc) + Number(card.atk);
                      }, 0)));
                      return newSelection;
                    }
                    if(prev.length >= 3) return prev;
                    const newSelection = [...prev, mainPlayerHandCards[index].id];
                    attackCalculationSet(Number(newSelection.reduce((acc, id)=>{
                      const card = mainPlayerHandCards.find((c)=>c.id === id);
                      if(!card) return acc;
                      return Number(acc) + Number(card.atk);
                    }, 0)));
                    return newSelection;
                  })
                  return; // if combo attack is being selected, clicking other cards should not trigger attack calculation preview or open floating menu
                }
                attackCalculationSet(mainPlayerHandCards[index].atk);
                const card = findLabelCardInPixi(graphic!);
                openFloatingMenu(card, <>
                  <pixiContainer>
                    <Button 
                      text="Solo Attack"
                      minWidth={200}
                      onClick={()=>{
                        cardAttack([mainPlayerHandCards[index].id]);
                        triggerAttackAnimationSet(true);
                        setTimeout(()=>{
                          triggerAttackAnimationSet(false);
                        }, 600);
                      }}
                    />
                    <Button 
                      y={50}
                      text="Combo Attack"
                      minWidth={200}
                      onClick={()=>{
                        changeNote("Select up to 3 cards for combo attack");
                        comboAttackSelectionSet([mainPlayerHandCards[index].id]);
                        attackCalculationSet(mainPlayerHandCards[index].atk);
                      }}
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
              onMouseEnter={()=>{
                if(comboAttackSelection != null) return; // if combo attack is being selected, hovering other cards should not trigger attack calculation preview
                attackCalculationSet(mainPlayerHandCards[index].atk);
              }}
            >
              {children}
            </UtilityContainer>
          </> : <>
            {children}
          </>}
        </>;
      }, [mainPlayer.active, triggerAttackAnimation]);

      return <Fragment key={index}>
        <IsActive>
          <IsAttackAnimating>
            <IsAttackSelection>
              <IsDiscardSelection>
                <Card
                  horizontalOffset={horizontalOffset}
                  verticalOffset={-281}
                  src={mainPlayerHandCards[index].card_art}
                />
              </IsDiscardSelection>
            </IsAttackSelection>
          </IsAttackAnimating>
        </IsActive>
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
          openFloatingMenu(graphic!, <>
            <Button 
              text="Draw 1 Card"
              minWidth={200}
              onClick={()=>{
                drawCards(1);
                if(mainPlayer.totalHandCards + 1 > 7 ){
                  changeNote("You have drawn more than 7 cards. Please discard down to 7 cards in hand at the end of your turn.");
                  alreadyDrawnSet(true);
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
                if(mainPlayer.totalHandCards + 2 > 7 ){
                  changeNote("You have drawn more than 7 cards. Please discard down to 7 cards in hand at the end of your turn.");
                  alreadyDrawnSet(true);
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
                if(mainPlayer.totalHandCards + 3 > 7 ){
                  changeNote("You have drawn more than 7 cards. Please discard down to 7 cards in hand at the end of your turn.");
                  alreadyDrawnSet(true);
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
          playerEndTurn();
        }}
      />
    </>}

    { (comboAttackSelection != null && discardSelection == null && mainPlayer.active) && <>
      <Button 
        useCenterCoordinate
        x={600}
        y={30}
        text="Use Combo Attack"
        color={0x3D5779}
        minWidth={200}
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
          cardAttack(comboAttackSelection);
          triggerAttackAnimationSet(true);
          setTimeout(()=>{
            triggerAttackAnimationSet(false);
          }, 600);
        }}
      />

      <Button 
        useCenterCoordinate
        x={600}
        y={-30}
        text="Cancel Combo Attack"
        color={0xFF2222}
        minWidth={200}
        onClick={()=>{
          comboAttackSelectionSet(null);
          changeNote(null);
        }}
      />
    </>}

    { (comboAttackSelection==null && discardSelection != null && mainPlayer.active) && <>
      <Button 
        useCenterCoordinate
        x={600}
        y={30}
        text="Attack Selected Cards"
        color={0x3D5779}
        minWidth={200}
        disabled={discardSelection.length === 0 || discardSelection.length >= mainPlayer.totalHandCards || mainPlayer.totalHandCards - discardSelection.length > 7}
        onClick={()=>{
          cardDiscarder(discardSelection);
        }}
      />
      
    </>}

    {turnMessage && <>
      <Modal>
        <pixiContainer>
          <pixiText
            text={turnMessage}
            style={makeFontStyle({ })}
          />
        </pixiContainer>
      </Modal>
    </>}

    
  </>
}
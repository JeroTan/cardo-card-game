import type { GameCard } from "@/types/game/events";
import { useGameEventContext } from "../context/GameEventContext";
import TurnBaseContextProvider from "../context/TurnBaseContext";
import { getMainPlayer } from "../utils/game";
import Engine from "./Engine";
import { useMemo } from "react";

export function EngineController(){
  const {gameEventData, gameIsReady} = useGameEventContext();
  return <>
    {(gameIsReady && gameEventData != null) && <Composer />}
  </>
}


function Composer(){
  const context = useGameEventContext();
  const gameEventData = context.gameEventData!;
  const mainPlayer = getMainPlayer(gameEventData);

  const currentActivePlayerId = useMemo(()=>{
    const activeEvent = [...gameEventData.events].reverse().find((event)=>{
      return event.type === "START_TURN";
    });
    if(!activeEvent) return null;
    return activeEvent.playerId as string;
  }, [gameEventData.events]);

  const turnRemainingTime = useMemo(()=>{
    const activeEvent = [...gameEventData.events].reverse().find((event)=>{
      return event.type === "START_TURN";
    });
    if(!activeEvent) return 0;
    const elapsed = (Date.now() - new Date(activeEvent.timestamp).getTime()) / 1000;  
    const totalTurnTime = 60; // Assume each turn has a total time of 60 seconds
    return Math.max(0, totalTurnTime - elapsed);
  }, [gameEventData.events, currentActivePlayerId]);


  return <>
    <TurnBaseContextProvider>
      <Engine
        mainPlayerId={mainPlayer.id}
        mainPlayerHandCards={mainPlayer.cardsInHand as GameCard[]} 
        drawCards={(total)=>{
          //
        }}
        cardAttack={(cardIds)=>{
          //
        }}
        playerEndTurn={()=>{
          //
        }}
        players={gameEventData.playerInfo.map((info)=>{
          return {
            playerId: info.id,
            username: info.username,
            active: info.id === currentActivePlayerId,
            totalCardsInDeck: info.totalCardsInDeck,
            cardsInJail: info.jailedCards,
            totalHandCards: Array.isArray(info.cardsInHand) ? info.cardsInHand.length : 0,
            totalTurnsPassed: info.turnCount,
          }
        })}
        turnRemainingTime={turnRemainingTime}
      />
    </TurnBaseContextProvider>
  </>
}
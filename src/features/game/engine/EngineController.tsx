import type { GameCard, TurnEvent } from "@/types/game/events";
import { useGameEventContext } from "../context/GameEventContext";
import TurnBaseContextProvider from "../context/TurnBaseContext";
import { getMainPlayer } from "../utils/game";
import Engine from "./Engine";
import { useEffect, useMemo } from "react";
import { useEffectOnce } from "react-use";
import { getWSObject } from "../utils/websocket";

export function EngineController(){
  const {gameStateData, gameIsReady} = useGameEventContext();
  return <>
    {(gameIsReady && gameStateData != null) && <Composer />}
  </>
}


function Composer(){
  const context = useGameEventContext();
  const gameStateData = context.gameStateData!;
  const mainPlayer = getMainPlayer(gameStateData);

  const currentActivePlayerId = useMemo(()=>{

    const activeEvent = [...gameStateData.events].reverse().find((event)=>{
      return event.type === "START_TURN";
    });
    if(!activeEvent) throw new Error("No active turn found in game events");
    return activeEvent.playerId as string;
  }, [gameStateData.events]);

  const turnRemainingTime = useMemo(()=>{
    const activeEvent = [...gameStateData.events].reverse().find((event)=>{
      return event.type === "START_TURN";
    });
    if(!activeEvent) return 0;
    const elapsed = (Date.now() - new Date(activeEvent.timestamp).getTime()) / 1000;  
    const totalTurnTime = 60; // Assume each turn has a total time of 60 seconds
    return Math.max(0, totalTurnTime - elapsed);
  }, [gameStateData.events, currentActivePlayerId]);


  useEffectOnce(()=>{
    const ws = context.ws!;
    ws.receiver((message)=>{
      const data = getWSObject(message);
      if(data.type === "NEXT_EVENT"){
        const reformData = data as unknown as {type: "NEXT_EVENT", event: TurnEvent};
        context.appendTurnEvent(reformData.event);
      }
    });
  });


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
        players={gameStateData.playerInfo.map((info)=>{
          return {
            playerId: info.id,
            username: info.username,
            active: info.id === currentActivePlayerId,
            totalCardsInDeck: info.totalCardsInDeck,
            cardsInJail: info.jailedCards,
            totalHandCards: Array.isArray(info.cardsInHand) ? info.cardsInHand.length : info.cardsInHand,
            totalTurnsPassed: info.turnCount,
          }
        })}
        turnRemainingTime={turnRemainingTime}
      />
    </TurnBaseContextProvider>
  </>
}
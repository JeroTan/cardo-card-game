import type { GameCard, TurnEvent } from "@/types/game/events";
import { useGameEventContext } from "../context/GameEventContext";
import TurnBaseContextProvider from "../context/TurnBaseContext";
import { getMainPlayer } from "../utils/game";
import Engine from "./Engine";
import { useCallback, useMemo, useState } from "react";
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
  const mainPlayer = useMemo(()=>{
    return getMainPlayer(gameStateData);
  }, [gameStateData.playerInfo]);

  const [turnMessage, setTurnMessage] = useState<string>("");
  

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
    if(!activeEvent) return 1;
    const elapsed = (Date.now() - new Date(activeEvent.timestamp).getTime()) / 1000;  
    const totalTurnTime = 60; // Assume each turn has a total time of 60 seconds
    const finalTime =  Math.max(0, totalTurnTime - elapsed);
    return finalTime ? finalTime : 1;
  }, [gameStateData.events, currentActivePlayerId]);

  const currentSentinelCard = useMemo(()=>{
    // Find the latest CHANGE_SENTINEL event in the current turn
    const currentTurnEvents = gameStateData.events.reverse().find((event)=>{
      return event.type === "CHANGE_SENTINEL";
    });
    if(!currentTurnEvents) return [];
    return currentTurnEvents.new_sentinel;
  }, [gameStateData.events]);

  const sentinelOwner = useMemo(()=>{
    const currentTurnEvents = gameStateData.events.reverse().find((event)=>{
      return event.type === "CHANGE_SENTINEL";
    });
    if(!currentTurnEvents) return null;
    return currentTurnEvents.playerId;
  }, [gameStateData.events]);

  const changeTurnMessage = useCallback((message: string)=>{
    setTurnMessage(message);
    setTimeout(()=>{
      setTurnMessage("");
    }, 2000);
  }, []);


  useEffectOnce(()=>{
    changeTurnMessage(`${
      currentActivePlayerId === mainPlayer.id ? "It's your" : `${gameStateData.playerInfo.find((p)=>p.id === currentActivePlayerId)?.username}'s`} turn!`
    );
    const ws = context.ws!;
    ws.receiver((message)=>{
      const data = getWSObject(message);
      if(data.type === "NEXT_EVENT"){
        const reformData = data as unknown as {type: "NEXT_EVENT", data: TurnEvent};
        const newEvent = reformData.data;
        context.appendTurnEvent(newEvent);

        if(newEvent.type === "START_TURN"){
          if(newEvent.playerId === mainPlayer.id){
            changeTurnMessage("It's your turn!");
          }else{
            changeTurnMessage(`It's ${gameStateData.playerInfo.find((p)=>p.id === newEvent.playerId)?.username}'s turn!`);
          }
        }

        // For removing cards in the hand of opponents
        if(newEvent.type == "REMOVE_FROM_HAND"){
          context.setGameStateData((prev)=>{
            if(!prev) return prev;
            const newData = {...prev!};
            const playerInfoIndex =newData.playerInfo.findIndex((info)=>info.id === newEvent.playerId);
            if(playerInfoIndex === -1) return prev;
            const player = newData.playerInfo[playerInfoIndex];
            
            if(player.id === mainPlayer.id){
              newData.playerInfo[playerInfoIndex] = {
                ...player,
                cardsInHand: (player.cardsInHand as GameCard[]).filter((card)=>!(newEvent.cards_removed as GameCard[]).some((usedCard)=>usedCard.id === card.id)), // For the main player, we know the specific cards in hand, so we can filter them out
              }
            }else{
              newData.playerInfo[playerInfoIndex] = {
                ...player,
                cardsInHand: (player.cardsInHand as number) - (newEvent.cards_removed as number), // For other players, we only know the number of cards in hand, not the specific cards
              }
            }
            newData.playerInfo = structuredClone(newData.playerInfo);
            return newData;
          });
        }

        if(newEvent.type === "JAIL_CARD"){
          context.setGameStateData((prev)=>{
            if(!prev) return prev;
            const newData = {...prev!};
            const playerInfoIndex =newData.playerInfo.findIndex((info)=>info.id === newEvent.playerId);
            if(playerInfoIndex === -1) return prev;

            const player = newData.playerInfo[playerInfoIndex];
            newData.playerInfo[playerInfoIndex] = {
              ...player,
              jailedCards: [...player.jailedCards, ...newEvent.jailed_cards],
            }
            newData.playerInfo = structuredClone(newData.playerInfo);
            return newData;
          })
        };

        if(newEvent.type === "DRAW_CARD"){
          context.setGameStateData((prev)=>{
            if(!prev) return prev;
            const newData = {...prev!};
            const playerInfoIndex =newData.playerInfo.findIndex((info)=>info.id === newEvent.playerId);
            if(playerInfoIndex === -1) return prev;

            const player = newData.playerInfo[playerInfoIndex];
            if(player.id === mainPlayer.id){
              newData.playerInfo[playerInfoIndex] = {
                ...player,
                cardsInHand: [...(player.cardsInHand as GameCard[]), ...(newEvent.drawn_cards as GameCard[])], // For the main player, we know the specific cards in hand
                totalCardsInDeck: player.totalCardsInDeck - (newEvent.drawn_cards as GameCard[]).length,
              }
            }else{
              newData.playerInfo[playerInfoIndex] = {
                ...player,
                cardsInHand: (player.cardsInHand as number) + (newEvent.drawn_cards as number), // For other players, we only know the number of cards in hand, not the specific cards
                totalCardsInDeck: player.totalCardsInDeck - (newEvent.drawn_cards as number),
              }
            }
            newData.playerInfo = structuredClone(newData.playerInfo);
            return newData; 
          });
        }

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
        sentinelCards={currentSentinelCard}
        sentinelOwner={sentinelOwner}
        turnMessage={turnMessage}
      />
    </TurnBaseContextProvider>
  </>
}
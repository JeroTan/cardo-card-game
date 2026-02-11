import type { GameStateClient } from "@/types/game/events";


export function getMainPlayer(gameEventData: GameStateClient){
  // Main player is the one with array types in hand
  const mainPlayer = gameEventData.playerInfo.find((player)=>{
    return Array.isArray(player.cardsInHand);
  });
  if(!mainPlayer){
    throw new Error("Main player not found in game event data");
  }
  return mainPlayer;
}
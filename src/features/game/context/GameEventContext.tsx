import type { GameStateClient, PlayerGameInfoClient, TurnEvent } from "@/types/game/events";
import { WebSocketNative } from "@jsarmyknife/native--http";
import { createContext, useCallback, useContext, useRef, useState, type PropsWithChildren } from "react";


export type GameEventContextType = {
  roomId: string,
  ws: WebSocketNative | null,
  setWS: (ws: WebSocketNative)=>void,
  gameStateData: GameStateClient | null,
  setGameStateData: (data: GameStateClient)=>void,
  appendTurnEvent: (event: TurnEvent)=>void,
  updatePlayerInfo?: (params:{
    playerId: string,
    newPlayerInfo: PlayerGameInfoClient,
  })=>void,
  gameIsReady: boolean,
  updateGameIsReady: (isReady: boolean)=>void,
}

export const GameEventContext = createContext<GameEventContextType>(null!);

export function GameEventContextProvider({children, roomId=""}:PropsWithChildren<{roomId?:string}>){
  const roomIdRef = useRef(roomId);
  const ws = useRef<WebSocketNative>(null);
  const [gameStateData, setGameStateData] = useState<GameStateClient | null>(null);
  const [gameIsReady, setGameIsReady] = useState(false);  
  const updateWS = useCallback((newWS: WebSocketNative)=>{
    ws.current = newWS;
  }, []);

  const updateGameStateData = useCallback((newData: GameStateClient)=>{
    setGameStateData(newData);
  }, []);

  const appendTurnEvent = useCallback((newEvent: TurnEvent)=>{
    setGameStateData((prev)=>{
      if(!prev) return prev;
      return {
        ...prev,
        events: [...prev.events, newEvent],
      }
    });
  }, []);

  const updatePlayerInfo = useCallback(({
    playerId,
    newPlayerInfo,
  }:{
    playerId: string,
    newPlayerInfo: PlayerGameInfoClient,
  } )=>{
    setGameStateData((prev)=>{
      if(!prev) return prev;
      return {
        ...prev,
        playerInfo: prev.playerInfo.map((info)=>{
          if(info.id === playerId){
            return newPlayerInfo;
          }
          return info;
        }),
      }
    });
  }, []);

  return <GameEventContext.Provider value={{
    roomId: roomIdRef.current,
    ws: ws.current,
    setWS: updateWS,
    gameStateData,
    setGameStateData: updateGameStateData,
    appendTurnEvent,
    updatePlayerInfo,
    gameIsReady,
    updateGameIsReady: setGameIsReady,
  }}>
    {children}
  </GameEventContext.Provider>
}

export function useGameEventContext(){
  return useContext(GameEventContext);
}
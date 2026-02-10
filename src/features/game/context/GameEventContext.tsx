import type { GameStateClient } from "@/types/game/events";
import { WebSocketNative } from "@jsarmyknife/native--http";
import { createContext, useCallback, useContext, useRef, useState, type PropsWithChildren } from "react";


export type GameEventContextType = {
  roomId: string,
  ws: WebSocketNative | null,
  setWS: (ws: WebSocketNative)=>void,
  gameEventData: GameStateClient | null,
}

export const GameEventContext = createContext<GameEventContextType>(null!);

export function GameEventContextProvider({children, roomId=""}:PropsWithChildren<{roomId?:string}>){
  const roomIdRef = useRef(roomId);
  const ws = useRef<WebSocketNative>(null);
  const [gameEventData, setGameEventData] = useState<GameStateClient | null>(null);

  const updateWS = useCallback((newWS: WebSocketNative)=>{
    ws.current = newWS;
  }, []);

  return <GameEventContext.Provider value={{
    roomId: roomIdRef.current,
    ws: ws.current,
    setWS: updateWS,
    gameEventData,
  }}>
    {children}
  </GameEventContext.Provider>
}

export function useGameEventContext(){
  return useContext(GameEventContext);
}
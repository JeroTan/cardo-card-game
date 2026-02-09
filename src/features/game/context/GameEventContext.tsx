import { createContext, useContext, useRef, type PropsWithChildren } from "react";


export type GameEventContextType = {
  roomId: string,
  
}

export const GameEventContext = createContext<GameEventContextType>(null!);

export function GameEventContextProvider({children}:PropsWithChildren<{}>){
  const roomIdRef = useRef(""); // This should be dynamic based on the actual room the player is in
  


  return <GameEventContext.Provider value={{
    roomId: roomIdRef.current,
  }}>
    {children}
  </GameEventContext.Provider>
}

export function useGameEventContext(){
  return useContext(GameEventContext);
}
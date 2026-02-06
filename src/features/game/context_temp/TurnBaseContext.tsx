import { createContext, useContext } from "react"


export type TurnBaseContextType = {

}
export const TurnBaseContext = createContext<TurnBaseContextType>(null!);

export default function TurnBaseContextProvider({children}: {children?: React.ReactNode}) {
  return <TurnBaseContext.Provider value={{

  }}>
    {children}
  </TurnBaseContext.Provider>
}

export function useTurnBaseContext(){
  return useContext(TurnBaseContext);
}
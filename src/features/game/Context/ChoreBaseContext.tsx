import { createContext, useContext } from "react"


export type ChoreBaseContextType = {

}
export const ChoreBaseContext = createContext<ChoreBaseContextType>(null!);

export default function ChoreBaseContextProvider({children}: {children?: React.ReactNode}) {
    return <ChoreBaseContext.Provider value={{
  
    }}>
      {children}
    </ChoreBaseContext.Provider>
}

export function useChoreBaseContext(){
  return useContext(ChoreBaseContext);
}
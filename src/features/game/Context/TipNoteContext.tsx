import { createContext, useContext, useState } from "react";


export type TipNoteContextType = {
  tipNote: string|null,
  changeNote: (note: string|null)=>void,
}

export const TipNoteContext = createContext<TipNoteContextType>(null!);

export function TipNoteContextProvider({children}: {children?: React.ReactNode}) {
  const [tipNote, tipNoteSet] = useState<string|null>(null);

  const changeNote = (note: string|null) => {
    tipNoteSet(note);
  };


  return <TipNoteContext.Provider value={{
    tipNote,
    changeNote,
  }}>
    {children}
    
  </TipNoteContext.Provider>
}

export function useTipNoteContext(){
  return useContext(TipNoteContext);
}

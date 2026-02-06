import type { ModelCardRaw } from "@/types/model/cards";
import { isEqual } from "lodash";
import countBy from "lodash/countBy";
import { createContext, useCallback, useContext, useState } from "react";

export type typePackPreviousFormContext = {
  previousName: string,
  previousCards: Array<ModelCardRaw>,
  isStillPrevious: (name: string, listCards: Array<ModelCardRaw>)=>{
    name: boolean,
    cards: boolean,
  },
  updateOldName: (name: string)=>void,
  updateOldCards: (cards: Array<ModelCardRaw>)=>void,
}

export const PackPreviousFormContext = createContext<typePackPreviousFormContext>(null!);

export function PackPreviousFormProvider({
  children,
}:{
  children?: React.ReactNode,
}){
  const [previousName, previousNameSet] = useState<string>("");
  const [previousCards, previousCardsSet] = useState<Array<ModelCardRaw>>([]);

  const isStillPrevious = useCallback((name: string, listCards: Array<ModelCardRaw>)=>{
    // Count occurrences of each card ID in both arrays
    const previousCardCounts = countBy(previousCards, 'id');
    const listCardCounts = countBy(listCards, 'id');
    
    const result = {
      name: name === previousName,
      cards: isEqual(previousCardCounts, listCardCounts),
    }

    return result;
  },[previousName, previousCards]);

  const updateOldName = useCallback((name: string)=>{
    previousNameSet(name);
  }, []);

  const updateOldCards = useCallback((cards: Array<ModelCardRaw>)=>{
    previousCardsSet(cards);
  }, []);

  return <PackPreviousFormContext.Provider value={{
    previousName,
    previousCards,
    isStillPrevious,
    updateOldName,
    updateOldCards,
  }}>
    {children}
  </PackPreviousFormContext.Provider>
}

export function usePackPreviousFormProvider(){
  return useContext(PackPreviousFormContext)
}
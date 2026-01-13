import type { ModelCardRaw } from "@/types/model/cards";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

const deckCopy = {
  "0/0": [] as ModelCardRaw[],
  "9/1": [] as ModelCardRaw[],
  "8/2": [] as ModelCardRaw[],
  "7/3": [] as ModelCardRaw[],
  "6/4": [] as ModelCardRaw[],
  "5/5": [] as ModelCardRaw[],
  "4/6": [] as ModelCardRaw[],
  "3/7": [] as ModelCardRaw[],
  "2/8": [] as ModelCardRaw[],
  "1/9": [] as ModelCardRaw[],
};

export type deckCopyKeyType = keyof typeof deckCopy;

type CardPackBuilderContextType = {
  deckData:  typeof deckCopy,
  listCards: ModelCardRaw[],
  deckCounter : Record<deckCopyKeyType, number>,
  totalCards: number,
  hasEachNoErrors: Record<deckCopyKeyType, boolean>,
  hasAllNoErrors: boolean,
  addToDeck: (key: deckCopyKeyType, card: ModelCardRaw) => void,
  removeFromDeck: (key: deckCopyKeyType, cardId: string) => void,
  removeAll: () => void,
  removeFromDeckByListIndex: (index: number) => void,
}

export const CardPackBuilderContext = createContext<CardPackBuilderContextType>(null!);

export default function CardPackBuilderProvider({ children }: { children?: React.ReactNode | number | string }) {
  const [deckContainer, deckContainerSet] =  useState(structuredClone(deckCopy)); // Should only allow maximum of 5 for a total cards of 50

  const listCards = useMemo(()=>{
    let list: ModelCardRaw[] = [];
    for(const key in deckContainer){
      list = list.concat(deckContainer[key as keyof typeof deckContainer]);
    }
    return list;
  }, [deckContainer]);

  const deckCounter = useMemo(()=>{
    const counter: Record<deckCopyKeyType, number> = {} as Record<deckCopyKeyType, number>;
    for(const key in deckContainer){
      counter[key as deckCopyKeyType] = deckContainer[key as keyof typeof deckContainer].length;
    }
    return counter;
  }, [deckContainer]);

  const totalCards = useMemo(()=>{
    return listCards.length;
  }, [listCards]);

  const hasEachNoErrors = useMemo(()=>{
    const errors: Record<deckCopyKeyType, boolean> = {
      "0/0": true,
      "9/1": true,
      "8/2": true,
      "7/3": true,
      "6/4": true,
      "5/5": true,
      "4/6": true,
      "3/7": true,
      "2/8": true,
      "1/9": true,
    };

    for(const key in deckContainer){
      const count = deckContainer[key as keyof typeof deckContainer].length;
      if(count > 5 || count < 5){
        errors[key as deckCopyKeyType] = false;
      }
    }
    return errors;
  }, [deckContainer]);

  const hasAllNoErrors = useMemo(()=>{
    for(const key in hasEachNoErrors){
      if(!hasEachNoErrors[key as deckCopyKeyType]){
        return false;
      }
    }
    return true;
  }, [hasEachNoErrors]);

  const addToDeck = useCallback((key: deckCopyKeyType, card: ModelCardRaw)=>{
    deckContainerSet(old=>{
      const newData = {...old};
      newData[key].push(card);
      return newData;
    });
  }, [deckContainerSet]);

  const removeFromDeck = useCallback((key: deckCopyKeyType, cardId: string)=>{
    deckContainerSet(old=>{
      const newData = {...old};
      newData[key] = newData[key].filter(c=>c.id !== cardId);
      return newData;
    });
  }, [deckContainerSet]);

  const removeFromDeckByListIndex = useCallback((index: number)=>{
    deckContainerSet(old=>{
      const newData = {...old};
      let currentPointerIndex = 0;
      outer: for(const deckKey in newData){
        for(const cardIndex in newData[deckKey as keyof typeof newData]){
          if(index === currentPointerIndex){
            newData[deckKey as keyof typeof newData].splice(Number(cardIndex), 1);
            break outer;
          }
          currentPointerIndex+=1;
        }
      }
      return newData;
    });
  }, [deckContainerSet]);

  const removeAll = useCallback(()=>{
    deckContainerSet(structuredClone(deckCopy));
  }, [deckContainerSet]);

  return <CardPackBuilderContext.Provider value={{
    deckData: deckContainer,
    listCards,
    deckCounter,
    totalCards,
    hasEachNoErrors,
    hasAllNoErrors,
    addToDeck,
    removeFromDeck,
    removeFromDeckByListIndex,
    removeAll,
  }}>
    {children}
  </CardPackBuilderContext.Provider>
}

export function useCardPackBuilderContext() {
  return useContext(CardPackBuilderContext);
}


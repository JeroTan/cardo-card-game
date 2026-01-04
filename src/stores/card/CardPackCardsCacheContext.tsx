import type { ModelCardRaw } from "@/types/model/cards";
import { createContext, useCallback, useContext, useState } from "react";

export type CardPackCardsCachedType = {
  id: string,
  cards: Omit<ModelCardRaw, "created_at" | "updated_at">[],
}

export type CardPackCardsCachedContextType = {
  cachedData: Array<CardPackCardsCachedType>,
  set: (cachedItem: CardPackCardsCachedType) => void,
  setMultiple: (cachedItems: CardPackCardsCachedType[]) => void,
  remove: (id: string) => void,
  get: (id: string) => CardPackCardsCachedType | undefined, 
};

export const CardPackCardsCachedContext = createContext<CardPackCardsCachedContextType>(null!);

export function CardPackCardsCachedProvider({children}: {children?: React.ReactNode}) {

  const [cachedData, cachedDataList] = useState<Array<CardPackCardsCachedType>>([]);

  const set = useCallback((cachedItem: CardPackCardsCachedType)=>{
    cachedDataList(old=>{
      const existingIndex = old.findIndex(d=>d.id === cachedItem.id);
      if(existingIndex !== -1) {
        const newData = [...old];
        newData[existingIndex] = cachedItem;
        return newData;
      } 
      return [...old, cachedItem];
    });
  }, []);

  const setMultiple = useCallback((cachedItems: CardPackCardsCachedType[])=>{
    cachedDataList(old=>{
      const newData = [...old];
      for(const item of cachedItems) {
        const existingIndex = newData.findIndex(d=>d.id === item.id);
        if(existingIndex !== -1) {
          newData[existingIndex] = item;
        } else {
          newData.push(item);
        }
      }
      return newData;
    });
  }, []);

  const remove = useCallback((id: string)=>{
    cachedDataList(old=> old.filter(d=>d.id !== id));
  }, []);

  const get = useCallback((id: string): CardPackCardsCachedType | undefined=>{
    return cachedData.find(d=>d.id === id);
  }, [cachedData]);
  
  return <CardPackCardsCachedContext.Provider value={{
    cachedData,
    set,
    setMultiple,
    remove,
    get,
  }}>
    {children}
  </CardPackCardsCachedContext.Provider>
}

export function useCardPackCardsCachedContext() {
  return useContext(CardPackCardsCachedContext);
} 
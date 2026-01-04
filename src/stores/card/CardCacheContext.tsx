import type { ModelCardRaw } from "@/types/model/cards";
import { createContext, useCallback, useContext, useState } from "react";


type CardCacheContextType = {
  cards: ModelCardRaw[],
  getCardById: (id: string) => ModelCardRaw | undefined,
  setCardData: (cards: ModelCardRaw[]) => void,
  removeCardsByIds: (ids: string[]) => void,
};

export const CardCacheContext = createContext<CardCacheContextType>(null!);

export function CardCacheProvider({children}: {children?: React.ReactNode}) {
  const [cards, setCards] = useState<ModelCardRaw[]>([]);

  const getCardById = useCallback((id: string): ModelCardRaw | undefined => {
    return cards.find(card => card.id === id);
  }, [cards]);

  const setCardData = useCallback((newCards: ModelCardRaw[]) => {
    setCards(oldCards => {
      const cardMap = new Map<string, ModelCardRaw>();  
      for (const card of oldCards) {
        cardMap.set(card.id, card);
      }
      for (const card of newCards) {
        cardMap.set(card.id, card);
      }
      return Array.from(cardMap.values());
    });
  }, []);

  const removeCardsByIds = useCallback((ids: string[]) => {
    setCards(oldCards => oldCards.filter(card => !ids.includes(card.id)));
  }, []);

  // Implement caching logic here
  return <CardCacheContext.Provider value={{
    // Provide caching methods and properties here
    cards,
    getCardById,
    setCardData,
    removeCardsByIds,
  }}>
    {children}
  </CardCacheContext.Provider>
}

export function useCardCacheContext() {
  return useContext(CardCacheContext);
}
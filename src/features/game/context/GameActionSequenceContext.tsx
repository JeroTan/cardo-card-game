import { createContext, useCallback, useContext, useRef, useState, type PropsWithChildren } from "react";

export type ActionCallback = (params: { actionEnd: () => void }) => void;

export type GameActionSequenceContextType = {
  isBlocked: boolean;
  setAction: (callback: ActionCallback) => void;
}

export const GameActionSequenceContext = createContext<GameActionSequenceContextType>(null!);

export function GameActionSequenceContextProvider({ children }: PropsWithChildren) {
  const [isBlocked, setIsBlocked] = useState(false);
  const queueRef = useRef<ActionCallback[]>([]);
  const isProcessingRef = useRef(false);

  const processQueue = useCallback(() => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const nextAction = queueRef.current.shift();

    if (nextAction) {
      setIsBlocked(true);

      const actionEnd = () => {
        setIsBlocked(false);
        isProcessingRef.current = false;
        processQueue();
      };

      nextAction({ actionEnd });
    } else {
      isProcessingRef.current = false;
    }
  }, []);

  const setAction = useCallback((callback: ActionCallback) => {
    queueRef.current.push(callback);
    processQueue();
  }, [processQueue]);

  return <GameActionSequenceContext.Provider value={{
    isBlocked,
    setAction,
  }}>
    {children}
  </GameActionSequenceContext.Provider>
}

export function useGameActionSequenceContext() {
  return useContext(GameActionSequenceContext);
}

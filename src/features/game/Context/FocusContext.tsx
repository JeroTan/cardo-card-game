import { createContext, useCallback, useContext, useState } from "react";

export type FocusContextType = {
  currentFocus: string|null;
  setFocus: (focusId: string)=>void;
  clearFocus: ()=>void;
}

export const FocusContext = createContext<FocusContextType>(null!);

export function FocusContextProvider({children}: {children?: React.ReactNode}) {

  const [currentFocus, currentFocusSet] = useState<string|null>(null);

  const clearFocus = useCallback(() => {
    currentFocusSet(null);
  }, []);

  return <FocusContext.Provider value={{
    currentFocus,
    setFocus: currentFocusSet,
    clearFocus,
  }}>
    {children}
  </FocusContext.Provider>
}

export function useFocusContext(){
  return useContext(FocusContext);
}
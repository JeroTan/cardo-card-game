import ModalBase, { useModalReducer } from "@/components/overlay/ModalBase";
import { createContext, useContext } from "react";

export const ModalContext = createContext<ReturnType<typeof useModalReducer>>(null!);
export function useModalContext(){
  return useContext(ModalContext);
}

export function ModalProvider({ children }: { children?: React.ReactNode | number | string }) {
  const modalReducer = useModalReducer();
  return (
    <ModalContext.Provider value={modalReducer}>
      {children}
      <ModalBase reducer={modalReducer} />
    </ModalContext.Provider>
  );
}

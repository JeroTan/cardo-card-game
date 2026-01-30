import type { Container, Graphics, Sprite } from "pixi.js";
import { createContext, useCallback, useContext, useState } from "react";
import FloatingMenu from "../components/FloatingMenu";

export interface FloatingMenuContextType {
  graphicRef: Container|Sprite|Graphics|null;
  isOpen: boolean;
  openFloatingMenu: (graphicRef: Container|Sprite|Graphics|null, content: React.ReactNode) => void;
  close(): void;
  open(): void;
}

export const FloatingMenuContext = createContext<FloatingMenuContextType>(null!);

export default function FloatingMenuContextProvider({children}: {children?: React.ReactNode}) {
  const [graphicRef, graphicRefSet] = useState<Container|Sprite|Graphics|null>(null);
  const [isOpen, isOpenSet] = useState<boolean>(false);
  const [floatMenuNode, floatMenuNodeSet] = useState<React.ReactNode>(null);

  const openFloatingMenu = useCallback((graphicRefParam: Container|Sprite|Graphics|null, content: React.ReactNode)=>{
    graphicRefSet(graphicRefParam);
    floatMenuNodeSet(content);
    isOpenSet(true);
  }, [graphicRef, isOpen, floatMenuNode]);


  return <FloatingMenuContext.Provider value={{
    graphicRef,
    isOpen,
    openFloatingMenu: openFloatingMenu,
    close: ()=>{ isOpenSet(false); },
    open: ()=>{ isOpenSet(true); },
  }}>
    {children}
    {isOpen && <FloatingMenu 
      graphicRef={graphicRef}
    >
      {floatMenuNode}
    </FloatingMenu>}
  </FloatingMenuContext.Provider>
}


export const useFloatingMenuContext = ()=>{
  return useContext(FloatingMenuContext);
}
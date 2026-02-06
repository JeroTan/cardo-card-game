import { createContext, useState } from "react";
import type { ModalProps } from "../components/Modal";
import Modal from "../components/Modal";

export type ModalContextType = {
  isModalOpen: boolean,
  openModal: ()=>void,
  closeModal: ()=>void,
  makeModal: (data:ModalProps)=>void,
}

export const ModalContext = createContext<ModalContextType>(null!);

export function ModalContextProvider({children}: {children?: React.ReactNode}) {
  const [isModalOpen, isModalOpenSet] = useState<boolean>(false);
  const [modalProps, setModalProps] = useState<ModalProps>({
    children: undefined,
    closeButtonCallback: undefined,
    backgroundCallback: undefined,
    padding: 40,
  });

  return <ModalContext.Provider value={{
    isModalOpen: isModalOpen,
    openModal: ()=>{isModalOpenSet(true)},
    closeModal: ()=>{isModalOpenSet(false)},
    makeModal: (data:ModalProps)=>{setModalProps(data)},
  }}>
    {children}
    {isModalOpen && <Modal
      {...modalProps}
      closeButtonCallback={modalProps.closeButtonCallback}
      backgroundCallback={modalProps.backgroundCallback}
      padding={modalProps.padding}
    >
      {modalProps.children}
    </Modal>}
  </ModalContext.Provider>
}
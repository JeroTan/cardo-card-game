import { ModalProvider, useModalContext } from "@/stores/components/ModalContext"
import StartButton from "./StartButton"
import { makeDefaultModal, makeInfoModal } from "@/components/overlay/ModalBase";
import GameMenu from "./GameMenu";

export default function GameStart(){
  return <>
    <ModalProvider>
      <Composer />
    </ModalProvider>
  </>
}


function Composer(){
  const [,modalDispatch] = useModalContext();
  return <>
    <StartButton 
      onClick={()=>{
        modalDispatch(makeInfoModal({
          title: "Choose Game Mode",
          width: "700px",
          message: undefined,
          acceptButton: false,
          rejectButton: false,
          additionalBody: <>
            <GameMenu />
          </>
        }))
      }}
    />
  </>
}
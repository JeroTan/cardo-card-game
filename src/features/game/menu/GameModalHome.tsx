import { ModalProvider, useModalContext } from "@/stores/components/ModalContext"
import StartButton from "./StartButton"
import { makeInfoModal } from "@/components/overlay/ModalBase";
import GameMenu from "./GameMenu";

export default function GameModalHome(){
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
            <div>
              <GameMenu />
            </div>
            <div className="flex justify-center">
              <p>Don't know how to play? Check out the <a href="/how-to-play" className="underline text-blue-500">How to Play</a> page for more information and guides!</p>
            </div>
          </>
        }))
      }}
    />
  </>
}
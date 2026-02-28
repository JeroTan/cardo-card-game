import { WSCreateRoom } from "@/api/client/game";
import { makeInfoModal, makeLoadingModal } from "@/components/overlay/ModalBase";
import { Button } from "@/components/ui/button"
import { useModalContext } from "@/stores/components/ModalContext"
import { Box, Computer, Sword } from "lucide-react"
import type { PropsWithChildren } from "react"

export default function GameMenu (){
  const [,modalDispatch] = useModalContext();
  return <>
    <div className="w-full max-w-900 p-2 flex flex-wrap justify-center gap-5">
      <GameMenuOption
        onClick={()=>{
          modalDispatch(makeLoadingModal({
            title: "Finding a match. . .",
            message: "Please wait while we find an opponent for you.",
          }));
          const ws = WSCreateRoom();
          ws.open();
          ws.receiver((message)=>{
            const data = JSON.parse(message.data);
            if(data.type === "MATCH_FOUND"){
              modalDispatch(makeInfoModal({
                title: "Match Found!",
                message: "Redirecting you to the game room...",
                acceptButton: false,
                rejectButton: false,
                backdropTrigger: false,
                closeButton: false,
              }));
              ws.close();
              setTimeout(()=>{
                location.href = "/room/" + data.roomId;
              }, 2000);
            }

          })
          
        }}
      >
        <div className="flex justify-center mb-2">
          <Sword className="size-14 aspect-square" />
        </div>
        Classic
      </GameMenuOption>
      <GameMenuOption>
        <div className="flex justify-center mb-2">
          <Computer className="size-14 aspect-square" />
        </div>
        VS Bot
      </GameMenuOption>
      <GameMenuOption
        onClick={()=>{
          modalDispatch(makeLoadingModal({
            title: "Making a room. . .",
            message: "Please wait while we create a custom room for you.",
          }));
          location.href = "/custom-room";
        }}
      >
        <div className="flex justify-center mb-2">
          <Box className="size-14 aspect-square" />
        </div>
        Custom Room
      </GameMenuOption>
      <div className="w-42"></div>
      <div className="w-42"></div>
      <div className="w-42"></div>
    </div>
  </>
}


function GameMenuOption({
  children,
  onClick,
}:PropsWithChildren<{
  onClick?: ()=> void
}>){
  return <>
    <Button
      variant={"outline"}
      className="w-42 aspect-square h-fit flex justify-center items-center "
      onClick={onClick}
    >
      <div >
        {children}
      </div>
    </Button>
  </>
}
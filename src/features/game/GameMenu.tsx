import { Button } from "@/components/ui/button"
import { Box, Computer, Joystick, Sword, User } from "lucide-react"
import type { PropsWithChildren } from "react"

export default function GameMenu (){
  return <>
    <div className="w-full max-w-900 p-2 flex flex-wrap justify-center gap-5">
      <GameMenuOption>
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
      <GameMenuOption>
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
  children
}:PropsWithChildren<{
  
}>){
  return <>
    <Button
      variant={"outline"}
      className="w-42 aspect-square h-fit flex justify-center items-center "
    >
      <div >
        {children}
      </div>
    </Button>
  </>
}
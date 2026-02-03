import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

export default function GameStart(){

  return <>
    <div>
      <div className="flex justify-center pb-2">
        <Button className="rounded-full size-fit hover:bg-zinc-200 hover:outline-solid outline-2 outline-zinc-700 aspect-square" variant={"ghost"}>
          <Play className="smLsize-50 size-40 p-2"  fill="black" stroke="#8C8C8C"/>
        </Button>
      </div>
      
      <div className="text-center sm:text-xl text-base">Click the Play Button to Start the Game</div>
    </div>
  </>
}
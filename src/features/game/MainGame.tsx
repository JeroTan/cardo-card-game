import { ModalProvider } from "@/stores/components/ModalContext";
import { GameEventContextProvider } from "./context/GameEventContext";
import TurnBaseContextProvider from "./context/TurnBaseContext";
import Engine from "./engine/Engine";
import { EngineController } from "./engine/EngineController";
import RoomCreation from "./room/RoomCreation";


export default function MainGame({roomId}:{roomId: string}){
  return <>
    <ModalProvider>
      <GameEventContextProvider roomId={roomId}>
        <Composer />
      </GameEventContextProvider>
    </ModalProvider>
  </>
}

function Composer(){
  return <>
    <RoomCreation>
      <EngineController />
    </RoomCreation>
  </>
}
import { GameEventContextProvider } from "./context/GameEventContext";
import TurnBaseContextProvider from "./context/TurnBaseContext";
import Engine from "./engine/Engine";


export default function MainGame({roomId}:{roomId: string}){
  return <>
    <GameEventContextProvider>
      <Composer />
    </GameEventContextProvider>
    
  </>
}


function Composer(){
  return <>
    <TurnBaseContextProvider>
      <Engine />
    </TurnBaseContextProvider>
  </>
}
import TurnBaseContextProvider from "./Context/TurnBaseContext";
import Engine from "./engine/Engine";


export default function MainGame({roomId}:{roomId: string}){
  return <>
    <TurnBaseContextProvider>
      <Engine />
    </TurnBaseContextProvider>
  </>
}
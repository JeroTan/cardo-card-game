import TurnBaseContextProvider from "../context/TurnBaseContext";
import Engine from "./Engine";

export function EngineController(){
  
  return <>
    <TurnBaseContextProvider>
      <Engine />
    </TurnBaseContextProvider>
  </>
}
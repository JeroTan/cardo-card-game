import Board from "../components/Board";
import HoverGlow from "../components/HoverGlow";
import { Pile } from "../components/Pile";
import { FocusContextProvider } from "../Context/FocusContext";
import Interface from "./Interface";
import { useApplication } from '@pixi/react';

export default function Engine(){
  return <>
    <FocusContextProvider>
      <Interface>
        <Composer />
      </Interface>
    </FocusContextProvider>
  </>
}

function Composer(){
  const app = useApplication();
  return <>
    <Board />
    <HoverGlow>
      <Pile
        topCard={"/images/card_back.svg"}
        horizontalOffset={-771}
        verticalOffset={281}
        pileSize={50}
      />
    </HoverGlow>
    <HoverGlow>
      <Pile
        topCard={"/images/card_back.svg"}
        horizontalOffset={771}
        verticalOffset={-281}
        pileSize={50}
      />
    </HoverGlow>
  </>
}
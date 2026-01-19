import Board from "../components/Board";
import Card from "../components/Card";
import { Pile } from "../components/Pile";
import Interface from "./Interface";
import { useApplication } from '@pixi/react';

export default function Engine(){
  return <>
    <Interface>
      <Composer />
    </Interface>
  </>
}

function Composer(){
  const app = useApplication();
  return <>
    <Board />
    <Pile
      topCard={"/images/card_back.svg"}
    />
  </>
}
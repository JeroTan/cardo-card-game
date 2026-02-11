import { useCallback, useEffect, useState, type PropsWithChildren } from "react";
import { useGameEventContext } from "../context/GameEventContext";
import { useEffectOnce } from "react-use";
import { useModalContext } from "@/stores/components/ModalContext";
import { makeCloseModal, makeErrorModal, makeLoadingModal } from "@/components/overlay/ModalBase";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiCheckRoom, ApiGetGameState, WSJoinRoom } from "@/api/client/game";
import { getWSObject } from "../utils/websocket";
import type { GameStateClient } from "@/types/game/events";

export default function RoomCreation({
  children,
}:PropsWithChildren<{}>){
  const {roomId, setWS, setGameEventData, updateGameIsReady} = useGameEventContext();
  const [,modalDispatch] = useModalContext();
  const [loading, loadingSet] = useState(true);

  const joinRoom = useCallback(async ()=>{
    modalDispatch(makeLoadingModal({
      title: "Joining Room",
      message: "Please wait while we connect you to the game room.",
      additionalBody: <>
      
      </>
    }));
    const ws = WSJoinRoom(roomId);
    setWS(ws);

    const checkRoomResult = await ApiCheckRoom(roomId).promiseResponse;
    
    if(checkRoomResult.status !== 200){
      modalDispatch(makeErrorModal({
        title: "Error",
        message: "Room not found. Please check the room ID and try again.",
        backdropTrigger: false,
        closeButton: false,
        acceptButton: true,
        acceptButtonText: "Go Back to Home",
        acceptButtonCallback: ()=>{
          location.href = "/";
        },
        rejectButton: false,
      }));
      return;
    }
    ws.open();

    // Send a signal that this player is ready
    ws.getSocket()?.send(JSON.stringify({
      type: "PLAYER_CONFIRM",
      roomId,
    }));

    ws.receiver( async(message)=>{
      const data = getWSObject(message);
      if(data.type == "INITIAL_CARD_IS_READY"){
        const response = await ApiGetGameState(roomId).promiseResponse;
        if(response.status !== 200){
          modalDispatch(makeErrorModal({
            title: "Error",
            message: "Failed to get game state. Please try again.",
          }));
          return;
        }
        const {data: gameState} = await response.json() as {data: GameStateClient};
        setGameEventData(gameState);

        ws.getSocket()?.send(JSON.stringify({
          type: "PLAYER_READY",
          roomId,
        }));
      }
      if(data.type === "EVERYONE_READY"){
        updateGameIsReady(true);
        loadingSet(false);
        modalDispatch(makeCloseModal());
      }
    });
  }, []);

  useEffectOnce(()=>{
    if(!roomId){
      modalDispatch(makeErrorModal({
        title: "Error",
        message: "Room ID is missing. Please try again.",
      }));
    }
    joinRoom();
  });

  return <>
    {loading ? <>
      <Skeleton className="size-full" />
    </> : <>
      {children}
    </>}
  </>
}
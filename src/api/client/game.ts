import { defineApiResolve } from "@/lib/api/general";
import { WebSocketNative } from "@jsarmyknife/native--http";
import z from "zod";
import { apiClient } from "./config";
import { onZodError } from "@/lib/zod/formatter";


export function WSCreateRoom(){
  const ws = new WebSocketNative(location.origin + "/api/game/find-match");
  return ws;
}

export function WSJoinRoom(roomId:string){
  const ws = new WebSocketNative(location.origin + "/api/game/room/" + roomId);
  return ws;
}

export const ApiCheckRoom = defineApiResolve({
  input: z.string(),
  handler: async (data)=>{
    return apiClient().path(`/game/room/${data}/check`).get().request();
  },
  onZodError,
});

export const ApiGetGameState = defineApiResolve({
  input: z.string(),
  handler: async (data)=>{
    return apiClient().path(`/game/room/${data}/game-state`).get().request();
  },
  onZodError,
})
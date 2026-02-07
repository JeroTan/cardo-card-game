import { WebSocketNative } from "@jsarmyknife/native--http";


export function WSCreateRoom(){
  const ws = new WebSocketNative(location.origin + "/api/game/find-match");
  return ws;
}

export function WSJoinRoom(roomId:string){
  const ws = new WebSocketNative(location.origin + "/api/game/room/" + roomId);
  return ws;
}
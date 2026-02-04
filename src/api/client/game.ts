import { WebSocketNative } from "@jsarmyknife/native--http";


export function WSCreateRoom(){
  const ws = new WebSocketNative(location.origin + "/api/game/find-match");
  ws.urlCheck();
  return ws;
}

export function WSJoinRoom(roomId:string){
  const ws = new WebSocketNative(location.origin + "/api/game/room/" + roomId);
  ws.urlCheck();
  return ws;
}
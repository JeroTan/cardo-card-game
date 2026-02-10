import type { WebsocketStatus } from "@/types/game/events";

export function getWSObject<T extends object>(message: MessageEvent){
  const data = JSON.parse(message.data);
  return data as { 
    type: WebsocketStatus,
  } & T;
}
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

// Custom room lobby APIs
export const ApiCreateCustomRoom = defineApiResolve({
  input: z.object({
    roomName: z.string().min(1).max(50),
    type: z.enum(["OPEN", "INVITE_ONLY"]).default("OPEN"),
  }),
  handler: async (data)=>{
    return apiClient().path('/game/room/create').data(JSON.stringify(data)).post().request();
  },
  onZodError,
});

export const ApiUpdateCustomRoom = defineApiResolve({
  input: z.object({
    roomId: z.string(),
    roomName: z.string().min(1).max(50).optional(),
    type: z.enum(["OPEN", "INVITE_ONLY"]).optional(),
  }),
  handler: async (data)=>{
    return apiClient().path(`/game/room/${data.roomId}/update`).data(JSON.stringify({ roomName: data.roomName, type: data.type })).post().request();
  },
  onZodError,
});

export const ApiJoinRoomByCode = defineApiResolve({
  input: z.object({
    code: z.string().length(6),
  }),
  handler: async (data)=>{
    return apiClient().path('/game/room/join').data(JSON.stringify(data)).post().request();
  },
  onZodError,
});

export const ApiRemovePlayerFromRoom = defineApiResolve({
  input: z.object({
    roomId: z.string(),
    targetPlayerId: z.string(),
  }),
  handler: async (data)=>{
    return apiClient().path(`/game/room/${data.roomId}/remove-player`).data(JSON.stringify({ targetPlayerId: data.targetPlayerId })).post().request();
  },
  onZodError,
});

export const ApiToggleReadyState = defineApiResolve({
  input: z.object({
    roomId: z.string(),
    ready: z.optional(z.boolean()),
  }),
  handler: async (data)=>{
    return apiClient().path(`/game/room/${data.roomId}/ready?ready=${data.ready}`).get().request();
  },
  onZodError,
});

export const ApiAddBotPlayer = defineApiResolve({
  input: z.object({
    roomId: z.string(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  }),
  handler: async (data)=>{
    return apiClient().path(`/game/room/${data.roomId}/add-bot`).data(JSON.stringify({ difficulty: data.difficulty })).post().request();
  },
  onZodError,
});

export const ApiGetCustomRoomState = defineApiResolve({
  input: z.string(),
  handler: async (data)=>{
    return apiClient().path(`/game/room/${data}/custom-room-state`).get().request();
  },
  onZodError,
});
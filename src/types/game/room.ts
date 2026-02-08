export const playerRoomStatus = [
  "INVITED",
  "FROM_MATCHMAKING",
  "JOINED",
  "READY",
  "IN_GAME",
  "DISCONNECTED",
] as const;

export type PlayerRoomStatus = typeof playerRoomStatus[number];

export type PlayerRoomInfo = {
  id: string,
  username: string,
  status: PlayerRoomStatus,
}

export const roomJoinConditions = [
  "OPEN",
  "INVITE_ONLY",
  "MATCHMAKING"
] as const;
export type RoomJoinCondition = typeof roomJoinConditions[number];

export type RoomInfo = {
  id: string,
  name: string,
  players: PlayerRoomInfo[],
  joinCondition: RoomJoinCondition,
}

export const roomEventTypes = [
  "PLAYER_IS_READY",
] as const;
export type RoomEventType = typeof roomEventTypes[number];

export type WebsocketMessageForRoom<T> = {
  type: RoomEventType,
  data: T
}
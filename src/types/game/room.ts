export const playerRoomStatus = [
  "INVITED",
  "FROM_MATCHMAKING",
  "JOINED",
  "CONNECTION_READY", // Player has confirmed the status of their websocket connection and is ready to start the game
  "READY_TO_PLAY", // Player is ready to start the game
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
  expiresAt: number,
}

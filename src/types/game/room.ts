export const playerRoomStatus = [
  "INVITED",
  "FROM_MATCHMAKING",
  "JOINED",
  "READY_FOR_CUSTOM_ROOM", // Player who joined the custom have set their status for ready to play
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
  owner: boolean,
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

export type BotDifficulty = "EASY" | "MEDIUM" | "HARD";

// WebSocket events for lobby
export type LobbyWSMessage =
  | { type: "PLAYER_JOINED"; player: PlayerRoomInfo }
  | { type: "PLAYER_LEAVE"; playerId: string }
  | { type: "PLAYER_READY"; playerId: string }
  | { type: "PLAYER_NOT_READY"; playerId: string }
  | { type: "BOT_ADDED"; bot: PlayerRoomInfo  & {difficulty: BotDifficulty} }
  | { type: "GAME_STARTING"; roomId: string }
  | { type: "LOBBY_UPDATE"; lobby: RoomInfo };

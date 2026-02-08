import type { ModelCardRaw } from "../model/cards"

export type GameCard = Omit<ModelCardRaw, 'created_at' | 'updated_at'>;
export type PlayerGameInfo = {
    id: string, // player ID
    username: string, // player username
    cardsInDeck:Array<GameCard>, // initial deck is 50 cards
    jailedCards: Array<GameCard>, // 0 start
    turnCount: number, // 0 start
    timeLeft: string, // 60 seconds but the format is whole date in utc form. A simple example is right now is 2026-05-01T12:00:00Z then to become 60 seconds 2026-05-01T12:01:00Z
  }

export type PlayerGameInfoClient = {
    id: string, // player ID
    username: string, // player username
    totalCardsInDeck: number, // initial deck is 50 cards
    jailedCards: Array<GameCard>, // 0 start
    turnCount: number, // 0 start
    timeLeft: string, // 60 seconds but the format is whole date in utc form. A simple example is right now is 2026-05-01T12:00:00Z then to become 60 seconds 2026-05-01T12:01:00Z
  }

export type GameState = {
  roomId: string,
  playerInfo: PlayerGameInfo[],
  events: TurnEventsLog,
  createdAt: string,
  status: "waiting" | "playing" | "finished",
}

export type GameStateClient = Omit<GameState, "playerInfo"> & {
  playerInfo: PlayerGameInfoClient[],
}

export const eventTypes = [
  "PLAYER_JOIN",
  "PLAYER_OUT",
  "GAME_START",
  "START_TURN",
  "ATTACKING",
  "CHANGE_SENTINEL",
  "DRAW_CARD",
  "JAIL_CARD",
  "GAME_END",
  "PLAYER_LOSE",
  "PLAYER_WIN",
] as const;

export type EventType = (typeof eventTypes)[number];

export type TurnEvent = {
  timestamp: string, // ISO string of when the event happened
}&({
  type: "PLAYER_JOIN",
  playerId: string,
}|{
  type: "PLAYER_OUT",
  playerId: string,
}|{
  type: "GAME_START",
}|{
  type: "START_TURN",
  playerId: string,
}|{
  type: "ATTACKING",
  card_used: Array<GameCard>,
  playerId: string,
}|{
  type: "CHANGE_SENTINEL",
  new_sentinel: Array<GameCard>,
  playerId: string,
}|{
  type: "DRAW_CARD",
  drawn_cards: Array<GameCard>,
  playerId: string,
}|{
  type: "JAIL_CARD",
  jailed_cards: Array<GameCard>,
  playerId: string,
}|{
  type: "GAME_END",
}|{
  type: "PLAYER_LOSE",
  playerId: string,
}|{
  type: "PLAYER_WIN",
  playerId: string,
})

export type TurnEventsLog = Array<TurnEvent>;


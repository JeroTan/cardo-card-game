import type { ModelCardRaw } from "../model/cards"

export type GameCard = Omit<ModelCardRaw, 'created_at' | 'updated_at'>;
export type PlayerGameInfo = {
    id: string, // player ID
    username: string, // player username
    cardsInDeck:Array<GameCard>, // initial deck is 50 cards
    jailedCards: Array<GameCard>, // 
    cardsInHand: Array<GameCard>, // 
    turnCount: number, // 0 start
    timeLeft: string, // 60 seconds but the format is whole date in utc form. A simple example is right now is 2026-05-01T12:00:00Z then to become 60 seconds 2026-05-01T12:01:00Z
  }

export type PlayerGameInfoClient = {
    id: string, // player ID
    username: string, // player username
    totalCardsInDeck: number, // initial deck is 50 cards
    jailedCards: Array<GameCard>,
    cardsInHand: Array<GameCard>|number, // if it's the player himself, then it's Array<GameCard>, if it's other player, then it's number of cards in hand
    turnCount: number, // 0 start
    timeLeft: string, // 60 seconds but the format is whole date in utc form. A simple example is right now is 2026-05-01T12:00:00Z then to become 60 seconds 2026-05-01T12:01:00Z
  }

export type GameState = {
  roomId: string,
  playerInfo: PlayerGameInfo[],
  events: TurnEventsLog,
  createdAt: string,
  status: "waiting" | "preparation_ready" | "playing" | "finished",
  expiresAt: number,
}

export type GameStateClient = Omit<GameState, "playerInfo" | "expiresAt"> & {
  playerInfo: PlayerGameInfoClient[],
}

export const eventTypes = [
  "GAME_START",
  "STARTING_CARDS",
  "START_TURN",
  "ATTACKING",
  "REMOVE_FROM_HAND",
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
  readonly type: "GAME_START",
}|{
  readonly type: "STARTING_CARDS",
  playerId: string,
  cardsInHand: Array<GameCard>|number, // if it's the player himself, then it's Array<GameCard>, if it's other player, then it's number of cards in hand
}|{
  readonly type: "START_TURN",
  playerId: string,
}|{
  readonly type: "ATTACKING",
  card_used: Array<GameCard>,
  playerId: string,
}|{
  readonly type: "REMOVE_FROM_HAND",
  cards_removed: Array<GameCard>|number,
  playerId: string,
}|{
  readonly type: "CHANGE_SENTINEL",
  new_sentinel: Array<GameCard>,
  playerId: string,
}|{
  readonly type: "DRAW_CARD",
  drawn_cards: Array<GameCard>|number, // if it's the player himself, then it's Array<GameCard>, if it's other player, then it's number of cards drawn
  playerId: string,
}|{
  readonly type: "JAIL_CARD",
  jailed_cards: Array<GameCard>,
  playerId: string,
}|{
  readonly type: "GAME_END",
}|{
  readonly type: "PLAYER_LOSE",
  playerId: string,
}|{
  readonly type: "PLAYER_WIN",
  playerId: string,
})

export type TurnEventsLog = Array<TurnEvent>;

export const websocketStatus =[
  "ERROR",
  "RECONNECTED",
  "DISCONNECTED",
  "JOINED_ROOM",
  "PLAYER_CONFIRM",
  "INITIAL_CARD_IS_READY",
  "PLAYER_READY",
  "EVERYONE_READY",
  "NEXT_EVENT",
  "REQUEST_DRAW_CARD",
  "REQUEST_ATTACK",
  "REQUEST_END_TURN",
  "REQUEST_DISCARD_CARD",
  "REQUEST_SURRENDER",
  "GAME_END",
] as const;

export type WebsocketStatus = (typeof websocketStatus)[number];

export type WebsocketStatusForRoom<T> = {
  type: WebsocketStatus,
  data: T
}
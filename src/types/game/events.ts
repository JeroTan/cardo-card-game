import type { ModelCardRaw } from "../model/cards"

export type PlayerGameInfo = {
  players: Array<{
    id: string,
    name: string,
    cards:Array<ModelCardRaw>,
    jailedCards: Array<ModelCardRaw>,
    turnLeft: number,
    timeLeft: string,
  }>
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
] as const;

export type EventType = (typeof eventTypes)[number];

export type TurnEvent = ({
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
  card_used: Array<ModelCardRaw>,
}|{
  type: "CHANGE_SENTINEL",
  new_sentinel: Array<ModelCardRaw>,
}|{
  type: "DRAW_CARD",
  drawn_cards: Array<ModelCardRaw>,
}|{
  type: "JAIL_CARD",
  jailed_cards: Array<ModelCardRaw>,
})

export type TurnEventsLog = Array<TurnEvent>;
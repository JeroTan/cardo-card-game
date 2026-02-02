import type { ModelCardRaw } from "../model/cards"

export type Player = {
  players: Array<{
    id: string,
    name: string,
    cards:Array<ModelCardRaw>,
    jailedCards: Array<ModelCardRaw>,
    turnLeft: number,
  }>
}

export const eventTypes = [
  "START_TURN",
  "ATTACKING",
  "CHANGE_SENTINEL",
  "DRAW_CARD",
  "JAIL_CARD",
] as const;

export type EventType = (typeof eventTypes)[number];

export type TurnEvent = {
  type: EventType,
  playerId: string,
}&({
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
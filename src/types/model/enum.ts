export const cardFactions = [
  "Bayani",
] as const;
export type CardFaction = (typeof cardFactions)[number];

export const cardPackStatuses = [
  "PUBLISHED",
  "HIDDEN",
] as const;
export type CardPackStatus = (typeof cardPackStatuses)[number];
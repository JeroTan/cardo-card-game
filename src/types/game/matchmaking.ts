/**
 * MatchMakingInfo represents information about a player in the matchmaking queue.
 * joinedAt is a timestamp (in milliseconds) indicating when the player joined the queue. It is UTC-based.
 */
export type MatchMakingInfo = {
  playerId: string,
  joinedAt: number,
}

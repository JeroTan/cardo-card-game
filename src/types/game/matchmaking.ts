/**
 * MatchMakingInfo represents information about a player in the matchmaking queue.
 * joinedAt is a timestamp (in milliseconds) indicating when the player joined the queue. It is UTC-based.
 */
export type MatchMakingInfo = {
  playerId: string,
  joinedAt: number,
  expiresAt: number, // Timestamp in milliseconds indicating when the matchmaking entry expires (e.g., 24 hours after joinedAt)
}

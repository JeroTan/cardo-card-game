import type { GameState, GameStateClient, TurnEvent } from "@/types/game/events";

export function generateRoomId(length = 8){
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let roomId = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    roomId += characters[randomIndex];
  }
  return roomId;
}

/**
 * Converts server RoomState to client-safe version
 * Hides actual cards in deck, only shows count
 */
export function convertRoomStateForClient(serverState: GameState, showCardsInHandForPlayerId?:string): GameStateClient {
  return {
    roomId: serverState.roomId,
    playerInfo: serverState.playerInfo.map(player => ({
        id: player.id,
        username: player.username,
        totalCardsInDeck: player.cardsInDeck.length,
        cardsInHand: showCardsInHandForPlayerId === player.id ? player.cardsInHand : player.cardsInHand.length, // only show count of cards in hand for other players
        jailedCards: player.jailedCards,
        turnCount: player.turnCount,
        timeLeft: player.timeLeft,
      })),
    events: serverState.events,
    createdAt: serverState.createdAt,
    status: serverState.status,
  };
}

type ValidationResult = {
  valid: boolean;
  error?: string;
  event: TurnEvent;
};

/**
 * Validates a received game event against the server's room state
 * @param receiveEvent - The event received from the client
 * @param serverState - The current server room state
 * @returns Validation result with the event to append if valid
 */
export function validateGameEvent(receiveEvent: TurnEvent, serverState: GameState): ValidationResult {
  const events = serverState.events;
  const playerInfo = serverState.playerInfo;

  // Rule 1: At the very start, only GAME_START is allowed
  if (events.length === 0) {
    if (receiveEvent.type !== "GAME_START") {
      return { valid: false, error: "First event must be GAME_START", event: receiveEvent };
    }
    return { valid: true, event: receiveEvent };
  }

  // Rule 2: GAME_START should only appear once
  const gameStartCount = events.filter(e => e.type === "GAME_START").length;
  if (receiveEvent.type === "GAME_START") {
    if (gameStartCount > 0) {
      return { valid: false, error: "GAME_START can only appear once", event: receiveEvent };
    }
    return { valid: true, event: receiveEvent };
  }

  // Rule 3: STARTING_CARDS should come after GAME_START and before any other gameplay events
  if (receiveEvent.type === "STARTING_CARDS") {
    if (gameStartCount === 0) {
      return { valid: false, error: "STARTING_CARDS must come after GAME_START", event: receiveEvent };
    }
    
    // Check if this player already has a STARTING_CARDS event
    const playerId = receiveEvent.playerId;
    const playerStartingCardsCount = events.filter(e => e.type === "STARTING_CARDS" && e.playerId === playerId).length;
    
    if (playerStartingCardsCount > 0) {
      return { valid: false, error: `Player ${playerId} already has STARTING_CARDS event`, event: receiveEvent };
    }
    
    // STARTING_CARDS should only come after GAME_START or other STARTING_CARDS events
    const lastEvent = events[events.length - 1];
    if (lastEvent.type !== "GAME_START" && lastEvent.type !== "STARTING_CARDS") {
      return { valid: false, error: "STARTING_CARDS must come directly after GAME_START or other STARTING_CARDS events", event: receiveEvent };
    }
    
    return { valid: true, event: receiveEvent };
  }

  // Rule 4: GAME_END should only appear once
  const gameEndCount = events.filter(e => e.type === "GAME_END").length;
  if (receiveEvent.type === "GAME_END") {
    if (gameEndCount > 0) {
      return { valid: false, error: "GAME_END can only appear once", event: receiveEvent };
    }
    return { valid: true, event: receiveEvent };
  }

  // Rule 5: PLAYER_LOSE and PLAYER_WIN should only appear once per player
  if (receiveEvent.type === "PLAYER_LOSE" || receiveEvent.type === "PLAYER_WIN") {
    const playerId = receiveEvent.playerId;
    const playerLoseCount = events.filter(e => e.type === "PLAYER_LOSE" && e.playerId === playerId).length;
    const playerWinCount = events.filter(e => e.type === "PLAYER_WIN" && e.playerId === playerId).length;
    
    if (receiveEvent.type === "PLAYER_LOSE" && playerLoseCount > 0) {
      return { valid: false, error: `Player ${playerId} already has PLAYER_LOSE event`, event: receiveEvent };
    }
    if (receiveEvent.type === "PLAYER_WIN" && playerWinCount > 0) {
      return { valid: false, error: `Player ${playerId} already has PLAYER_WIN event`, event: receiveEvent };
    }
    return { valid: true, event: receiveEvent };
  }

  // Rule 6: DRAW_CARD validation
  if (receiveEvent.type === "DRAW_CARD") {
    const { drawn_cards, playerId } = receiveEvent;
    
    // Get the count of cards being drawn
    const drawnCount = typeof drawn_cards === "number" ? drawn_cards : drawn_cards.length;
    
    // Max 3 cards can be drawn
    if (drawnCount > 3) {
      return { valid: false, error: "Cannot draw more than 3 cards", event: receiveEvent };
    }

    // Check if player has enough cards in deck
    const player = playerInfo.find(p => p.id === playerId);
    if (!player) {
      return { valid: false, error: `Player ${playerId} not found`, event: receiveEvent };
    }

    if (player.cardsInDeck.length < drawnCount) {
      return { valid: false, error: `Not enough cards in deck. Has ${player.cardsInDeck.length}, trying to draw ${drawnCount}`, event: receiveEvent };
    }

    return { valid: true, event: receiveEvent };
  }

  // Rule 7: JAIL_CARD validation
  if (receiveEvent.type === "JAIL_CARD") {
    const { jailed_cards, playerId } = receiveEvent;
    
    // Max 3 cards can be jailed per event
    if (jailed_cards.length > 3) {
      return { valid: false, error: "Cannot jail more than 3 cards in one event", event: receiveEvent };
    }

    // Check if player's total jailed cards won't exceed 50
    const player = playerInfo.find(p => p.id === playerId);
    if (!player) {
      return { valid: false, error: `Player ${playerId} not found`, event: receiveEvent };
    }

    if (player.jailedCards.length + jailed_cards.length > 50) {
      return { valid: false, error: `Jailed cards would exceed 50. Current: ${player.jailedCards.length}, adding: ${jailed_cards.length}`, event: receiveEvent };
    }

    return { valid: true, event: receiveEvent };
  }

  // Rule 8: ATTACKING validation
  if (receiveEvent.type === "ATTACKING") {
    const { card_used, playerId } = receiveEvent;
    
    // Max 3 cards can be used to attack
    if (card_used.length > 3 || card_used.length < 1) {
      return { valid: false, error: "Must attack with 1-3 cards", event: receiveEvent };
    }

    // Find current sentinel owner
    const lastSentinelEvent = [...events].reverse().find(e => e.type === "CHANGE_SENTINEL");
    if (lastSentinelEvent && 'playerId' in lastSentinelEvent && lastSentinelEvent.playerId === playerId) {
      return { valid: false, error: "Sentinel owner cannot attack their own sentinel", event: receiveEvent };
    }

    // Calculate total ATK of attacking cards
    const totalATK = card_used.reduce((sum, card) => sum + (card.atk || 0), 0);

    // Special case: Single 0 ATK card
    const isSingleZero = card_used.length === 1 && card_used[0].atk === 0;

    // Get current sentinel DEF
    if (lastSentinelEvent && 'new_sentinel' in lastSentinelEvent) {
      const currentSentinel = lastSentinelEvent.new_sentinel;
      const totalDEF = currentSentinel.reduce((sum, card) => sum + (card.def || 0), 0);

      // Check if sentinel contains only 0 cards
      const sentinelIsOnlyZeros = currentSentinel.every(card => card.atk === 0);

      if (isSingleZero) {
        // 0 card cannot beat a sentinel with only 0 cards
        if (sentinelIsOnlyZeros) {
          return { valid: false, error: "Zero card cannot defeat a zero-only sentinel", event: receiveEvent };
        }
        // Otherwise, single 0 can beat any sentinel
        return { valid: true, event: receiveEvent };
      }

      // Normal attack: ATK must be higher than DEF
      if (totalATK <= totalDEF) {
        return { valid: false, error: `Attack failed: ATK ${totalATK} must be greater than Sentinel DEF ${totalDEF}`, event: receiveEvent };
      }
    }

    return { valid: true, event: receiveEvent };
  }

  // Rule 9: CHANGE_SENTINEL validation
  if (receiveEvent.type === "CHANGE_SENTINEL") {
    const { new_sentinel } = receiveEvent;
    
    // Sentinel must have 1-3 cards
    if (new_sentinel.length > 3 || new_sentinel.length < 1) {
      return { valid: false, error: "Sentinel must contain 1-3 cards", event: receiveEvent };
    }

    // CHANGE_SENTINEL should come after ATTACKING
    const lastEvent = events[events.length - 1];
    if (lastEvent.type !== "ATTACKING") {
      return { valid: false, error: "CHANGE_SENTINEL must come after ATTACKING", event: receiveEvent };
    }

    return { valid: true, event: receiveEvent };
  }

  // Rule 10: START_TURN validation
  if (receiveEvent.type === "START_TURN") {
    const lastEvent = events[events.length - 1];
    
    // START_TURN should come after GAME_START or after a complete turn
    if (gameStartCount === 0) {
      return { valid: false, error: "START_TURN can only appear after GAME_START", event: receiveEvent };
    }

    // All players must have STARTING_CARDS before any START_TURN
    const startingCardsEvents = events.filter(e => e.type === "STARTING_CARDS");
    if (startingCardsEvents.length < playerInfo.length) {
      return { valid: false, error: "All players must have STARTING_CARDS before START_TURN", event: receiveEvent };
    }

    // Valid previous events for START_TURN
    const validPreviousTypes = ["STARTING_CARDS", "DRAW_CARD", "CHANGE_SENTINEL", "JAIL_CARD", "PLAYER_LOSE"];
    if (!validPreviousTypes.includes(lastEvent.type)) {
      return { valid: false, error: `START_TURN cannot follow ${lastEvent.type}`, event: receiveEvent };
    }

    // Find the last START_TURN to determine turn order
    const lastStartTurn = [...events].reverse().find(e => e.type === "START_TURN");
    
    if (lastStartTurn && 'playerId' in lastStartTurn) {
      // Get list of active players (not eliminated)
      const lostPlayerIds = events
        .filter(e => e.type === "PLAYER_LOSE")
        .map(e => 'playerId' in e ? e.playerId : null)
        .filter(id => id !== null);
      
      const activePlayers = playerInfo.filter(p => !lostPlayerIds.includes(p.id));
      
      if (activePlayers.length === 0) {
        return { valid: false, error: "No active players remaining", event: receiveEvent };
      }

      // Find current player index
      const currentPlayerIndex = activePlayers.findIndex(p => p.id === lastStartTurn.playerId);
      
      if (currentPlayerIndex === -1) {
        return { valid: false, error: "Previous turn player not found", event: receiveEvent };
      }

      // Next player is the next index (wrapping around)
      const nextPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
      const expectedNextPlayerId = activePlayers[nextPlayerIndex].id;

      if (receiveEvent.playerId !== expectedNextPlayerId) {
        return { 
          valid: false, 
          error: `Wrong turn order. Expected player ${expectedNextPlayerId}, got ${receiveEvent.playerId}`, 
          event: receiveEvent 
        };
      }
    }

    return { valid: true, event: receiveEvent };
  }

  // Default: allow other events
  return { valid: true, event: receiveEvent };
}
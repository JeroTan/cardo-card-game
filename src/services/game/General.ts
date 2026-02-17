import type { GameState, GameStateClient, TurnEvent } from "@/types/game/events";

// Import PUBLIC_APP_URL with fallback for test environment
let PUBLIC_APP_URL: string;
try {
  PUBLIC_APP_URL = await import("astro:env/client").then(m => m.PUBLIC_APP_URL);
} catch {
  PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || "http://localhost:4321";
}

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
    events: serverState.events.map((event)=>{
      return convertTurnStateForClient(event, showCardsInHandForPlayerId);
    }),
    createdAt: serverState.createdAt,
    status: serverState.status,
  };
}

export function convertTurnStateForClient(event: TurnEvent, playerId?: string): TurnEvent {
  // Hide card details from other players, only show counts
  if (event.type === "STARTING_CARDS") {
    return {
      ...event,
      cardsInHand: event.playerId === playerId
        ? event.cardsInHand 
        : (Array.isArray(event.cardsInHand) ? event.cardsInHand.length : event.cardsInHand)
    };
  }
  if (event.type === "DRAW_CARD") {
    return {
      ...event,
      drawn_cards: event.playerId === playerId
        ? event.drawn_cards 
        : (Array.isArray(event.drawn_cards) ? event.drawn_cards.length : event.drawn_cards)
    };
  }
  if (event.type === "REMOVE_FROM_HAND") {
    return {
      ...event,
      cards_removed: event.playerId === playerId
        ? event.cards_removed 
        : (Array.isArray(event.cards_removed) ? event.cards_removed.length : event.cards_removed)
    };
  }
  return event;
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

  // Rule 8: REMOVE_FROM_HAND validation
  if (receiveEvent.type === "REMOVE_FROM_HAND") {
    const { cards_removed, playerId } = receiveEvent;

    // Server always expects CardGame[] for validation
    if (!Array.isArray(cards_removed)) {
      return { valid: false, error: "cards_removed must be an array", event: receiveEvent };
    }

    // Check if player exists
    const player = playerInfo.find(p => p.id === playerId);
    if (!player) {
      return { valid: false, error: `Player ${playerId} not found`, event: receiveEvent };
    }

    // Check if player has all the cards being removed in their hand
    const playerCardIds = player.cardsInHand.map(card => card.id);
    const missingCards = cards_removed.filter(card => !playerCardIds.includes(card.id));
    
    if (missingCards.length > 0) {
      return { valid: false, error: `Player does not have all cards in hand. Missing: ${missingCards.map(c => c.id).join(', ')}`, event: receiveEvent };
    }

    return { valid: true, event: receiveEvent };
  }

  // Rule 9: ATTACKING validation
  if (receiveEvent.type === "ATTACKING") {
    const { card_used, playerId } = receiveEvent;
    
    // Check if attack is within turn time limit (60 seconds from START_TURN)
    // if (!isAttackWithinTime(serverState)) {
    //   return { valid: false, error: "Attack must be made within 60 seconds of turn start", event: receiveEvent };
    // }
    
    // Max 3 cards can be used to attack
    if (card_used.length > 3 || card_used.length < 1) {
      return { valid: false, error: "Must attack with 1-3 cards", event: receiveEvent };
    }

    // Find current sentinel owner
    const lastSentinelEvent = [...events].reverse().find(e => e.type === "CHANGE_SENTINEL");
    if (lastSentinelEvent && 'playerId' in lastSentinelEvent && lastSentinelEvent.playerId === playerId) {
      return { valid: false, error: "Sentinel owner cannot attack their own sentinel", event: receiveEvent };
    }

    // If no sentinel exists in the field, any attack is valid (first turn scenario)
    // The attacking cards will become the sentinel via CHANGE_SENTINEL
    if (!lastSentinelEvent) {
      return { valid: true, event: receiveEvent };
    }

    // Calculate total ATK of attacking cards
    const totalATK = card_used.reduce((sum, card) => sum + (card.atk || 0), 0);

    // Special case: Single 0 ATK card
    const isSingleZero = card_used.length === 1 && card_used[0].atk === 0;

    // Get current sentinel DEF
    if ('new_sentinel' in lastSentinelEvent) {
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

  // Rule 10: CHANGE_SENTINEL validation
  if (receiveEvent.type === "CHANGE_SENTINEL") {
    const { new_sentinel, playerId } = receiveEvent;
    
    // Sentinel must have 1-3 cards
    if (new_sentinel.length > 3 || new_sentinel.length < 1) {
      return { valid: false, error: "Sentinel must contain 1-3 cards", event: receiveEvent };
    }

    const lastSentinelEvent = [...events].reverse().find(e => e.type === "CHANGE_SENTINEL");
    const startTurnCount = events.filter(e => e.type === "START_TURN").length;
    const isFirstTurn = startTurnCount === 1 && !lastSentinelEvent;
    
    // First turn: skip sentinel owner validation (allow establishing initial sentinel)
    if (!isFirstTurn) {
      // Sentinel owner cannot change their own sentinel
      if (lastSentinelEvent && 'playerId' in lastSentinelEvent && lastSentinelEvent.playerId === playerId) {
        return { valid: false, error: "Sentinel owner cannot change their own sentinel", event: receiveEvent };
      }
    }

    // In the same turn, CHANGE_SENTINEL cards must match ATTACKING cards
    const lastStartTurn = [...events].reverse().find(e => e.type === "START_TURN");
    if (lastStartTurn) {
      const lastStartTurnIndex = events.findIndex(e => e === lastStartTurn);
      const eventsSinceLastTurn = events.slice(lastStartTurnIndex + 1);
      
      const attackingEvent = eventsSinceLastTurn.find(e => e.type === "ATTACKING");
      if (attackingEvent && 'card_used' in attackingEvent) {
        const attackingCards = attackingEvent.card_used;
        
        // Check if new_sentinel cards match attacking cards
        if (attackingCards.length !== new_sentinel.length) {
          return { valid: false, error: "CHANGE_SENTINEL cards must match ATTACKING cards", event: receiveEvent };
        }
        
        // Check each card ID matches
        const attackingCardIds = attackingCards.map(card => card.id).sort();
        const sentinelCardIds = new_sentinel.map(card => card.id).sort();
        
        for (let i = 0; i < attackingCardIds.length; i++) {
          if (attackingCardIds[i] !== sentinelCardIds[i]) {
            return { valid: false, error: "CHANGE_SENTINEL cards must match ATTACKING cards", event: receiveEvent };
          }
        }
      }
    }

    return { valid: true, event: receiveEvent };
  }

  // Rule 11: START_TURN validation
  if (receiveEvent.type === "START_TURN") {    
    // Before starting a new turn, the game must be started (GAME_START must exist)
    if (!events.some(e => e.type === "GAME_START")) {
      return { valid: false, error: "START_TURN can only appear after GAME_START", event: receiveEvent };
    }

    // All players must have STARTING_CARDS before any START_TURN
    const startingCardsEvents = events.filter(e => e.type === "STARTING_CARDS");
    if (startingCardsEvents.length < playerInfo.length) {
      return { valid: false, error: "All players must have STARTING_CARDS before START_TURN", event: receiveEvent };
    }

    // Find the last START_TURN to determine turn order
    const latestStartTurn = [...events].reverse().find(e => e.type === "START_TURN");
    
    if (latestStartTurn && 'playerId' in latestStartTurn) {
      // Get list of active players (not eliminated)
      const lostPlayerIds = events
        .filter(e => e.type === "PLAYER_LOSE" && 'playerId' in e && e.playerId != null)
        .map(e => 'playerId' in e ? e.playerId : null);
      
      const activePlayers = playerInfo.filter(p => !lostPlayerIds.includes(p.id));
      
      if (activePlayers.length === 0) {
        return { valid: false, error: "No active players remaining", event: receiveEvent };
      }

      // Find current player index
      const currentPlayerIndex = activePlayers.findIndex(p => p.id === latestStartTurn.playerId);
      
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

      // This to get the events of the latest turn
      const latestStartTurnIndex = events.findIndex(e => e === latestStartTurn);
      const eventsSinceLastTurn = events.slice(latestStartTurnIndex + 1);

      // This is use to determine if the player is a sentinel owner or not. 
      const eventsBeforeLastTurn = events.slice(0, latestStartTurnIndex);
      const lastSentinelEventBeforeTurn = [...eventsBeforeLastTurn].reverse().find(e => e.type === "CHANGE_SENTINEL"); //We get the latest sentinel owner
      const isSentinelOwner = lastSentinelEventBeforeTurn && 'playerId' in lastSentinelEventBeforeTurn && lastSentinelEventBeforeTurn.playerId === latestStartTurn.playerId;

      // Check if this was the first START_TURN (only 1 START_TURN exists in events)
      const wasFirstTurn = events.filter(e => e.type === "START_TURN").length === 1;
      
      if (wasFirstTurn) {
        // First turn player MUST attack and establish a sentinel
        const hasAttacking = eventsSinceLastTurn.some(e => e.type === "ATTACKING");
        const hasChangeSentinel = eventsSinceLastTurn.some(e => e.type === "CHANGE_SENTINEL");
        
        if (!hasAttacking || !hasChangeSentinel) {
          return { valid: false, error: "First turn player must ATTACK and CHANGE_SENTINEL to establish a sentinel", event: receiveEvent };
        }
      }

      if (!isSentinelOwner) {
        // Non-sentinel player must have either ATTACKING or DRAW_CARD in their turn
        const hasAttacking = eventsSinceLastTurn.some(e => e.type === "ATTACKING");
        const hasDrawCard = eventsSinceLastTurn.some(e => e.type === "DRAW_CARD");
        const hasChangeSentinel = eventsSinceLastTurn.some(e => e.type === "CHANGE_SENTINEL");

        // Must have either ATTACKING or DRAW_CARD
        if (!hasAttacking && !hasDrawCard) {
          return { valid: false, error: "Non-sentinel player must either ATTACK or DRAW_CARD before ending turn", event: receiveEvent };
        }

        // If ATTACKING is present, CHANGE_SENTINEL must also be present
        if (hasAttacking && !hasChangeSentinel) {
          return { valid: false, error: "CHANGE_SENTINEL must follow ATTACKING", event: receiveEvent };
        }
      }
    }

    return { valid: true, event: receiveEvent };
  }

  // Default: allow other events
  return { valid: true, event: receiveEvent };
}


export function isAttackWithinTime(serverState: GameState, interval = 1000*60) {
  const events = serverState.events;
  
  // Find the most recent START_TURN event
  const lastStartTurn = events.slice().reverse().find(e => e.type === 'START_TURN');
  
  if (!lastStartTurn) {
    // If no START_TURN found, allow the action (game might be starting)
    return true;
  }
  
  const elapsedTime = Date.now() -  new Date(lastStartTurn.timestamp).getTime();
  return elapsedTime <= interval;
}

export function getCurrentPlayer(gameState: GameState) {
  const events = gameState.events;
  const lastStartTurn = events.slice().reverse().find(e => e.type === 'START_TURN');
  if (!lastStartTurn || !('playerId' in lastStartTurn)) {
    throw new Error("No START_TURN event found or START_TURN missing playerId");
  }
  const playerId = lastStartTurn.playerId;
  const playerInfo = gameState.playerInfo.find(p => p.id === playerId);
  if(!playerInfo){
    throw new Error(`Player with id ${playerId} not found in playerInfo`);
  }
  return playerInfo;
}

export function checkIfFirstTurnAndNoSentinelYet (serverState: GameState) {
  const events = serverState.events;
  const startTurnCount = events.filter(e => e.type === "START_TURN").length;
  const hasSentinelBeenEstablished = events.some(e => e.type === "CHANGE_SENTINEL");
  return startTurnCount === 1 && !hasSentinelBeenEstablished;
}

/**
 * @description it will confirm the current START_TURN with the latest CHANGE_SENTINEL, if the START_TURN and CHANGE_SENTINEL playerId is match then it means the current turn player is the sentinel owner, and the turn is basically a free turn without attack, otherwise it's a normal turn with attack
 * @param gameState 
 * @returns 
 */
export function isCurrentASentinel(gameState: GameState){
  const events = gameState.events;
  const lastStartTurn = events.slice().reverse().find(e => e.type === 'START_TURN');
  const lastChangeSentinel = events.slice().reverse().find(e => e.type === 'CHANGE_SENTINEL');
  if(!lastStartTurn || !lastChangeSentinel) return false;
  if('playerId' in lastStartTurn && 'playerId' in lastChangeSentinel){
    return lastStartTurn.playerId === lastChangeSentinel.playerId;
  }
  return false;
}

/**
 * @description this will check (only not sentinel owner) if the player can end turn by checking if he draw a card if he don't made an attack or if he made an attack then he can end turn. Please don't use this with a sentinel owner
 * @param gameState 
 */
export function isNotSentinelOwnerAllowedToEnd(gameState: GameState){
  const events = gameState.events;
  // Check if there is ATTACKING in the current turn
  const lastStartTurn = events.slice().reverse().find(e => e.type === 'START_TURN');
  if(!lastStartTurn) return {ok: false, code: "NO_START_TURN", message: "No START_TURN found"};
  const lastStartTurnIndex = events.findIndex(e => e === lastStartTurn);
  const eventsSinceLastTurn = events.slice(lastStartTurnIndex + 1);
  const hasAttacking = eventsSinceLastTurn.some(e => e.type === "ATTACKING");
  const hasDrawCard = eventsSinceLastTurn.some(e => e.type === "DRAW_CARD");
  if(!hasAttacking && !hasDrawCard) return {ok: false, code:"NO_ATTACKING_AND_NO_DRAW", message: "Player did not make an attack or draw a card"};

  // Check if the card that was draw is not overflowing from hands
  if(hasDrawCard){
    const player = gameState.playerInfo.find(p => p.id === lastStartTurn.playerId);
    if(!player){
      return {ok: false, code:"PLAYER_NOT_FOUND", message: "Player not found in game state"};
    }
    if(player.cardsInHand.length > 7){
      return {ok: false, code:"HAND_OVERFLOW", message: "Player has more than 7 cards in hand, must remove cards from hand before ending turn"};
    }
  }
  return {ok: true, code:"OK", message: "Player can end turn"};
}

export function isHandOverflow(gameState: GameState, maxCard = 7){
  const events = gameState.events;
  const lastStartTurn = events.slice().reverse().find(e => e.type === 'START_TURN');
  if(!lastStartTurn) return false;
  const playerId = 'playerId' in lastStartTurn ? lastStartTurn.playerId : null;
  if(!playerId) return false;
  const playerInfo = gameState.playerInfo.find(p => p.id === playerId);
  if(!playerInfo) return false;
  const handCardsCount = Array.isArray(playerInfo.cardsInHand) ? playerInfo.cardsInHand.length : playerInfo.cardsInHand;
  return handCardsCount > maxCard;
}

export function howManyCardsToRemoveFromOverflowHand(gameState: GameState, maxCard = 7){
  const events = gameState.events;
  const lastStartTurn = events.slice().reverse().find(e => e.type === 'START_TURN');
  if(!lastStartTurn) return 0;
  const playerId = 'playerId' in lastStartTurn ? lastStartTurn.playerId : null;
  if(!playerId) return 0;
  const playerInfo = gameState.playerInfo.find(p => p.id === playerId);
  if(!playerInfo) return 0;
  const handCardsCount = Array.isArray(playerInfo.cardsInHand) ? playerInfo.cardsInHand.length : playerInfo.cardsInHand;
  return Math.max(0, handCardsCount - maxCard);
}

export function cardsToRemoveFromOverflowHand(gameState: GameState, maxCard = 7){
  const numberOfCardsToBeRemove = howManyCardsToRemoveFromOverflowHand(gameState, maxCard);
  if(numberOfCardsToBeRemove <= 0) return [];
  const events = gameState.events;
  const lastStartTurn = events.slice().reverse().find(e => e.type === 'START_TURN');
  if(!lastStartTurn) return [];
  const playerId = 'playerId' in lastStartTurn ? lastStartTurn.playerId : null;
  if(!playerId) return [];
  const playerInfo = gameState.playerInfo.find(p => p.id === playerId);
  if(!playerInfo) return [];
  const handCards = Array.isArray(playerInfo.cardsInHand) ? playerInfo.cardsInHand : [];
  return handCards.slice(0, numberOfCardsToBeRemove);
}

export function toImageLink(cardId: string){
  return `${PUBLIC_APP_URL}/api/public/resources/card/${cardId}`;
}
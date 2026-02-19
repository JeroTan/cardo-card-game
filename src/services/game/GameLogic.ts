import type { GameCard, GameState, PlayerGameInfo, TurnEvent } from "@/types/game/events";
import type { RoomInfo } from "@/types/game/room";
import type { CardPackService } from "../cardPack";
import type { CardService } from "../card";
import type { ModelCardRaw } from "@/types/model/cards";
import type { ModelCardPackCardsWitCardDetails } from "@/types/model/cardPack";
import { isAttackWithinTime, toImageLink, validateGameEvent } from "./General";

export class GameProcessLogic {
  constructor(protected storage: DurableObjectStorage){}
  
  public async createGame(roomId: string){
    const gameData:GameState = {
      roomId,
      playerInfo: [],
      events: [],
      createdAt: new Date().toISOString(),
      status: "waiting",
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // Expires in 24 hours
    }
    await this.storage.put(`game__${roomId}`, gameData);
    return {ok: true, message: "Game created successfully", gameData};
  }

  public async addInitialPlayers(roomId: string, playerInfo: Pick<PlayerGameInfo, "id" | "username"| "cardsInDeck"|"cardsInHand">[]){
    const gameRoom = await this.storage.get(`game__${roomId}`) as GameState | undefined;
    if(!gameRoom){
      return {ok: false, message: "Game not found", gameRoom: null} as const;
    }
    const playersForGame = playerInfo.map(player=>({
      ...player,
      jailedCards: [],
      turnCount: 0,
      timeLeft: new Date(Date.now() + 60000).toISOString(), // 60 seconds from now
    })) as PlayerGameInfo[];

    const updatedGameData: GameState = {
      ...gameRoom,
      playerInfo: [...gameRoom.playerInfo, ...playersForGame],
    }
    await this.storage.put(`game__${roomId}`, updatedGameData);
    return {ok: true, message: "Initial players added to the game successfully", gameData: updatedGameData} as const;
  }

   public async addInitialPlayersFromServices({roomInfo, cardPackService, env}: {roomInfo: RoomInfo, cardPackService: CardPackService, env: Env}){
    const gameRoom = await this.storage.get(`game__${roomInfo.id}`) as GameState | undefined;
    if(!gameRoom){
      return {ok: false, message: "Game not found", gameRoom: null} as const;
    }

    // Fetch available card packs
    const cardPackResult = await cardPackService.get({env, pageProps:{page: 1, limit: 100}});
    if(cardPackResult.error || (cardPackResult.data == null) || (cardPackResult.data != undefined && cardPackResult.data.data.length <= 0)){
      console.error('Error fetching card packs:', cardPackResult.error);
      throw new Error('Failed to fetch card packs');
    }

    // Cached Fetched Cards Container
    const fetchedCardsCache: Map<string, ModelCardPackCardsWitCardDetails[]> = new Map();

    const playersForGame = await Promise.all(roomInfo.players.map(async player=>{
      // Randomly pick a card pack for the player
      const cardPacks = cardPackResult.data.data;
      const randomIndex = Math.floor(Math.random() * cardPacks.length);
      const cardPack = cardPacks[randomIndex];

      // Check cache first
      let cardsInPack = fetchedCardsCache.get(cardPack.id);
      if(!cardsInPack){
        const cardsInDeckResult = await cardPackService.getCardsOfPack({env, cardPackId: cardPack.id});
        if(cardsInDeckResult.error || !cardsInDeckResult.data){
          console.error('Error fetching card pack details:', cardsInDeckResult.error);
          throw new Error('Failed to fetch card pack details');
        }
        cardsInPack = cardsInDeckResult.data;
        // add image link
        for(let card of cardsInPack){
          card.card_art = toImageLink(card.card_art);
        }

        // Store in cache
        fetchedCardsCache.set(cardPack.id, cardsInPack);
      }

      // Shuffle the cards
      const cardsInPackUnique = cardsInPack.map((card, index)=>({
        ...card,
        id: `${card.id}__${index}__${Date.now()}`, // Make sure each card has a unique ID by appending index and timestamp
      }))
      const shuffledCards = cardsInPackUnique.sort(() => 0.5 - Math.random());
      const cardsInDeck: GameCard[] = shuffledCards.map(cards=>{
        return {
          id: cards.id,
          name: cards.name,
          atk: cards.atk,
          def: cards.def,
          card_art: cards.card_art,
        }
      });
  
      return {
        id: player.id,
        username: player.username,
        cardsInDeck: cardsInDeck,
        jailedCards: [],
        cardsInHand: [],
        turnCount: 1,
        timeLeft: new Date(Date.now() + 60000).toISOString(), // 60 seconds from now
      } as PlayerGameInfo;
    }));

    //Randomize the order of players
    const shuffledPlayersForGame = playersForGame.sort(() => 0.5 - Math.random());

    return await this.addInitialPlayers(roomInfo.id, shuffledPlayersForGame);
   }

   async startTheGame(roomId: string){
    const gameRoom = await this.storage.get(`game__${roomId}`) as GameState | undefined;
    if(!gameRoom){
      return {ok: false, message: "Game not found", gameRoom: null} as const;
    }
    if(gameRoom.playerInfo.length < 2){
      return {ok: false, message: "At least 2 players are required to start the game", gameRoom} as const;
    }
    
    const nextEventResult = validateGameEvent({
      type: "GAME_START",
      timestamp: new Date().toISOString(),
    }, gameRoom);

    if(!nextEventResult.valid){
      return {ok: false, message: `Invalid game event: ${nextEventResult.error}`, gameRoom, nextEvent: null} as const;
    }

    const updatedGameRoom: GameState = {
      ...gameRoom,
      events: [...gameRoom.events, nextEventResult.event],
      status: "playing",
    }

    await this.storage.put(`game__${roomId}`, updatedGameRoom);
    return {ok: true, message: "Game started successfully", gameRoom: updatedGameRoom, nextEvent: nextEventResult.event} as const;    
   }
 
   async addInitialCardsForPlayers({roomId, playerId}: {roomId: string, playerId?: string}){
    const gameRoom = await this.storage.get(`game__${roomId}`) as GameState | undefined;
    if(!gameRoom){
      return {ok: false, message: "Game not found", gameRoom: null} as const;
    }
    // Check also if the game is already started
    if(!gameRoom.events.find(event=>event.type === "GAME_START")){
      return {ok: false, message: "Game has not started yet", gameRoom, nextEvent: null} as const;
    }

    // If no playerId is provided, it means we are adding initial cards for all players, otherwise we are just adding for the specific player who just got ready
    const playersToAddCards = playerId ? gameRoom.playerInfo.filter(player=>player.id === playerId) : gameRoom.playerInfo;
    if(playersToAddCards.length === 0){
      return {ok: false, message: "Player not found in the game", gameRoom, nextEvent: null} as const;
    }
    playersToAddCards.forEach(player=>{
      if(player.cardsInHand.length > 0){
        return; // Skip if the player already has cards in hand
      }
      const initialCardsInHand = drawCardFromDeck({cardsInDeck: player.cardsInDeck, cardsToDraw: 5});
      player.cardsInDeck = initialCardsInHand.remainingDeck;
      player.cardsInHand = initialCardsInHand.drawnCards;
      gameRoom.events.push({
        type: "STARTING_CARDS",
        playerId: player.id,
        cardsInHand: player.cardsInHand,
        timestamp: new Date().toISOString(),
      } as TurnEvent);
    });

    const updatedGameRoom: GameState = {
      ...gameRoom,
      playerInfo: gameRoom.playerInfo,
    }
    await this.storage.put(`game__${roomId}`, updatedGameRoom);
    return {ok: true, message: "Initial cards added successfully", gameRoom: updatedGameRoom, nextEvent: null} as const;
  }

   async isGameExist(roomId: string){
    const gameRoom = await this.storage.get(`game__${roomId}`) as GameState | undefined;
    if(!gameRoom){
      return {ok: false, message: "Game not found", gameRoom: null, nextEvent: null} as const;
    }
    return {ok: true, message: "Game found", gameRoom, nextEvent: null} as const;
   }

   async drawCards({roomId, playerId, cardsToDraw}: {roomId: string, playerId: string, cardsToDraw: number}){
    const gameRoom = await this.storage.get(`game__${roomId}`) as GameState | undefined;
    if(!gameRoom){
      return {ok: false, message: "Game not found", code: "GAME_NOT_FOUND", gameRoom: null, nextEvent: null} as const;
    }
    const playerIndex = gameRoom.playerInfo.findIndex(player=>player.id === playerId);
    if(playerIndex === -1){
      return {ok: false, message: "Player not found in the game", code: "PLAYER_NOT_FOUND", gameRoom, nextEvent: null} as const;
    }
    const player = gameRoom.playerInfo[playerIndex];

    // Check if there's still card in the deck to draw
    if(player.cardsInDeck.length === 0){
      return {ok: false, message: "No more cards in the deck to draw", code: "NO_CARDS_IN_DECK", gameRoom, nextEvent: null} as const;
    }

    const drawCardFromDeckResult = drawCardFromDeck({cardsInDeck: player.cardsInDeck, cardsToDraw});
    const newEventResult = validateGameEvent({
      type: "DRAW_CARD",
      playerId,
      drawn_cards: drawCardFromDeckResult.drawnCards,
      timestamp: new Date().toISOString(),
    }, gameRoom);
    if(!newEventResult.valid){
      return {ok: false, message: `Invalid game event: ${newEventResult.error}`, code: "INVALID_GAME_EVENT", gameRoom, nextEvent: null} as const;
    }

    // Save the next game state to our logs
    const updatedGameRoom: GameState = {
      ...gameRoom,
      events: [...gameRoom.events, newEventResult.event],
      playerInfo: gameRoom.playerInfo.map((p, index)=>{
        if(index === playerIndex){
          return {
            ...p,
            cardsInDeck: drawCardFromDeckResult.remainingDeck,
            cardsInHand: [...p.cardsInHand, ...drawCardFromDeckResult.drawnCards],
          }
        }
        return p;
      }),
    };
    await this.storage.put(`game__${roomId}`, updatedGameRoom);
    return {ok: true, message: "Cards drawn successfully", code: "CARDS_DRAWN_SUCCESSFULLY", gameRoom: updatedGameRoom, nextEvent: newEventResult.event} as const;
  }

  getGameState(roomId: string){
    return this.storage.get(`game__${roomId}`) as Promise<GameState | undefined>;
  }

  clearRoom(roomId: string){
    this.storage.delete(`game__${roomId}`); 
  }

  async startTurn(roomId: string){
    // Start the order of players turn
    // Basically for this if starting the game or there's no START_TURN in event logs, the first player in index of playerInfo will start the game.
    // In the upcoming turns the player who has is the last START_TURN, check its playerID, find it in the array element of playerInfo and next to that element is the next START_TURN
    const gameState = await this.getGameState(roomId);  
    if(!gameState){
      return {ok: false, code:"GAME_NOT_FOUND", message: "Game not found", gameState: null, nextEvent: null} as const;
    }

    const playerInfo = gameState.playerInfo;
    if(playerInfo.length === 0){
      return {ok: false, code:"NO_PLAYERS", message: "No players in the game", gameState, nextEvent: null} as const;
    }

    // Determine the next player to start the turn
    const lastStartTurnEvent = [...gameState.events].reverse().find(event=>event.type === "START_TURN") as TurnEvent | undefined;
    
    // Get all players who have lost
    const lostPlayerIds = new Set(
      gameState.events
        .filter((event): event is TurnEvent & {type: "PLAYER_LOSE"} => event.type === "PLAYER_LOSE")
        .map(event => event.playerId)
    );
    
    let playerIdToStartTheTurn: string;
    
    if(lastStartTurnEvent && lastStartTurnEvent.type === "START_TURN"){
      const currentPlayerId = lastStartTurnEvent.playerId;
      const currentPlayerIndex = playerInfo.findIndex(player=>player.id === currentPlayerId);
      if(currentPlayerIndex !== -1){
        // Find the next player who hasn't lost
        let nextPlayerIndex = (currentPlayerIndex + 1) % playerInfo.length;
        let attempts = 0;
        while(lostPlayerIds.has(playerInfo[nextPlayerIndex].id) && attempts < playerInfo.length){
          nextPlayerIndex = (nextPlayerIndex + 1) % playerInfo.length;
          attempts++;
        }
        playerIdToStartTheTurn = playerInfo[nextPlayerIndex].id;
      } else {
        playerIdToStartTheTurn = playerInfo[0].id;
      }
    } else {
      // First turn - just use the first player (no one has lost yet)
      playerIdToStartTheTurn = playerInfo[0].id;
    }

    const newEventResult = validateGameEvent({
      type: "START_TURN",
      playerId: playerIdToStartTheTurn,
      timestamp: new Date().toISOString(),
    }, gameState);

    if(!newEventResult.valid){
      return {ok: false, code:"INVALID_GAME_EVENT", message: `Invalid game event: ${newEventResult.error}`, gameState, nextEvent: null} as const;
    }

    const updatedGameState: GameState = {
      ...gameState,
      events: [...gameState.events, newEventResult.event],
      playerInfo: gameState.playerInfo.map(player=>{
        const newPlayerInfo = {
          ...player,
          timeLeft: new Date(Date.now() + 60000).toISOString(), // Reset time left to 60 seconds for the new turn
        }
        if(player.id === playerIdToStartTheTurn){
          newPlayerInfo.turnCount += 1; // Increment turn count for the player who starts the turn
        }
        return newPlayerInfo;
      })
    };
    await this.storage.put(`game__${roomId}`, updatedGameState);
    return {ok: true, code:"OK", message: "Turn started successfully", gameState: updatedGameState, nextEvent: newEventResult.event} as const;
  }

  async setGamePreparationReady(roomId:string){
    const gameState = await this.getGameState(roomId);
    if(!gameState){
      return {ok: false, message: "Game not found", gameState: null, nextEvent: null} as const;
    }
    const updatedGameState: GameState = {
      ...gameState,
      status: "preparation_ready",
    }
    await this.storage.put(`game__${roomId}`, updatedGameState);
    return {ok: true, message: "Game is ready to start", gameState: updatedGameState, nextEvent: null} as const;
  }

  async isGamePreparationReady(roomId: string){
    const gameState = await this.getGameState(roomId);
    if(!gameState){
      return {ok: false, message: "Game not found", gameState: null, nextEvent: null} as const;
    }
    if(gameState.status === "waiting"  ){
      return {ok: false, message: "Game is not ready yet", gameState, nextEvent: null} as const;
    }
    return {ok: true, message: "Game is ready to start", gameState, nextEvent: null} as const;
  }

  async attackWithCards({roomId, playerId, attackingCardIds, forceOutOfTime = false}: {roomId: string, playerId: string, attackingCardIds: string[], forceOutOfTime?: boolean}){
    // For this we need to check if the attacking cards are in the player's hand, if not then it's an invalid event
    const gameState = await this.getGameState(roomId);
    if(!gameState){
      return {ok: false, message: "Game not found", gameState: null, nextEvent: null} as const;
    }
    const playerInfo = gameState.playerInfo;
    if(playerInfo.length === 0){
      return {ok: false, message: "No players in the game", gameState, nextEvent: null} as const;
    }
    const playerIndex = playerInfo.findIndex(player=>player.id === playerId);
    if(playerIndex === -1){
      return {ok: false, message: "Player not found in the game", gameState, nextEvent: null} as const;
    }
    const player = playerInfo[playerIndex];
    const attackingCards = player.cardsInHand.filter(card=>attackingCardIds.includes(card.id));
    if(attackingCards.length !== attackingCardIds.length){
      console.log("Attacking cards in hand:", player.cardsInHand, "Attacking card IDs:", attackingCardIds, "Attacking cards found:", attackingCards);
      return {ok: false, message: "One or more attacking cards are not in the player's hand", gameState, nextEvent: null} as const;
    }

    // Check if attack is within turn time limit (60 seconds from START_TURN)
    if(!isAttackWithinTime(gameState) && !forceOutOfTime){
      return {ok: false, message: "Attack must be made within 60 seconds of turn start", gameState, nextEvent: null} as const;
    }

    const newEventResult = validateGameEvent({
      type: "ATTACKING",
      playerId,
      card_used: attackingCards,
      timestamp: new Date().toISOString(),
    }, gameState);
    
    if(!newEventResult.valid){
      return {ok: false, message: `Invalid game event: ${newEventResult.error}`, gameState, nextEvent: null} as const;
    }
    
    const updatedGameState: GameState = {
      ...gameState,
      events: [...gameState.events, newEventResult.event],
    };
    await this.storage.put(`game__${roomId}`, updatedGameState);
    return {ok: true, message: "Attack successful", gameState: updatedGameState, nextEvent: newEventResult.event} as const;
  }

  async changeSentinel({roomId}: {roomId: string}){
    const gameState = await this.getGameState(roomId);
    if(!gameState){
      return {ok: false, message: "Game not found", gameState: null, nextEvent: null} as const;
    }
    const playerInfo = gameState.playerInfo;
    if(playerInfo.length === 0){
      return {ok: false, message: "No players in the game", gameState, nextEvent: null} as const;
    }

    // Get the status of ATTACKING cards in the current turn, if there's no ATTACKING event in the current turn then it's invalid to change sentinel
    const lastStartTurnEventIndex = [...gameState.events].reverse().findIndex(event=>event.type === "START_TURN");
    const attackingEventInCurrentTurn = [...gameState.events].reverse().find((event, index)=>event.type === "ATTACKING" && index < lastStartTurnEventIndex) as TurnEvent | undefined;
    if(!attackingEventInCurrentTurn || attackingEventInCurrentTurn.type !== "ATTACKING"){
      return {ok: false, message: "No attacking event found in the current turn, cannot change sentinel", gameState, nextEvent: null} as const;
    }

    const newSentinel = attackingEventInCurrentTurn.card_used;

    const newEventResult = validateGameEvent({
      type: "CHANGE_SENTINEL",
      playerId: attackingEventInCurrentTurn.playerId,
      new_sentinel: newSentinel,
      timestamp: new Date().toISOString(),
    }, gameState);

    if(!newEventResult.valid){
      return {ok: false, message: `Invalid game event: ${newEventResult.error}`, gameState, nextEvent: null} as const;
    }

    const updatedGameState: GameState = {
      ...gameState,
      events: [...gameState.events, newEventResult.event],
    };
    await this.storage.put(`game__${roomId}`, updatedGameState);
    return {ok: true, message: "Sentinel changed successfully", gameState: updatedGameState, nextEvent: newEventResult.event} as const;
  }

  async jailCards({roomId, cardsToRemove}:{roomId: string, cardsToRemove: GameCard[]}){
    // This function is used to jail the cards of the player who owns the sentinel at the end of their turn if they haven't attacked or drawn a card
    const gameState = await this.getGameState(roomId);
    if(!gameState){
      return {ok: false, message: "Game not found", gameState: null, nextEvent: null} as const;
    }
    const playerInfo = gameState.playerInfo;
    if(playerInfo.length === 0){
      return {ok: false, message: "No players in the game", gameState, nextEvent: null} as const;
    }
    // Get the last START_TURN event to determine the current player
    const lastStartTurnEvent = [...gameState.events].reverse().find(event=>event.type === "START_TURN") as TurnEvent | undefined;
    if(!lastStartTurnEvent || lastStartTurnEvent.type !== "START_TURN"){
      return {ok: false, message: "No START_TURN event found, cannot determine current player", gameState, nextEvent: null} as const;
    }
    const currentPlayerId = lastStartTurnEvent.playerId;
    const playerIndex = playerInfo.findIndex(player=>player.id === currentPlayerId);
    if(playerIndex === -1){
      return {ok: false, message: "Current player not found in the game", gameState, nextEvent: null} as const;
    }
    
    const newEventResult = validateGameEvent({
      type: "JAIL_CARD",
      playerId: currentPlayerId,
      jailed_cards: cardsToRemove,
      timestamp: new Date().toISOString(),
    }, gameState);
    if(!newEventResult.valid){
      return {ok: false, message: `Invalid game event: ${newEventResult.error}`, gameState, nextEvent: null} as const;
    }

    const updatedGameState: GameState = {
      ...gameState,
      events: [...gameState.events, newEventResult.event],
      playerInfo: gameState.playerInfo.map((p, index)=>{
        if(index === playerIndex){
          return {
            ...p,
            jailedCards: [...p.jailedCards, ...cardsToRemove],
          }
        }
        return p;
      }),
    };
    await this.storage.put(`game__${roomId}`, updatedGameState);
    return {ok: true, message: "Cards jailed successfully", gameState: updatedGameState, nextEvent: newEventResult.event} as const;
  }

  async jailSentinelCards({roomId}: {roomId: string}){
    // Get the previous sentinel
    const gameState = await this.getGameState(roomId);
    if(!gameState){
      return {ok: false, message: "Game not found", gameState: null, nextEvent: null} as const;
    }
    const playerInfo = gameState.playerInfo;
    if(playerInfo.length === 0){
      return {ok: false, message: "No players in the game", gameState, nextEvent: null} as const;
    }
    // Get the last event of CHANGE_SENTINEL but NOT in this START_TURN 
    const lastStartTurnEventIndex = [...gameState.events].reverse().findIndex(event=>event.type === "START_TURN");
    // Slice to get the previous events before the last START_TURN, then find the last CHANGE_SENTINEL event in those events
    const eventsBeforeLastStartTurn = [...gameState.events].slice(0, gameState.events.length - lastStartTurnEventIndex - 1);
    const lastChangeSentinelEvent = eventsBeforeLastStartTurn.reverse().find(event=>event.type === "CHANGE_SENTINEL") as TurnEvent | undefined;
    
    if(!lastChangeSentinelEvent || lastChangeSentinelEvent.type !== "CHANGE_SENTINEL"){
      return {ok: false, message: "No sentinel change event found in the current turn", gameState, nextEvent: null} as const;
    }

    const nextEventResult = validateGameEvent({
      type: "JAIL_CARD",
      playerId: lastChangeSentinelEvent.playerId,
      jailed_cards: lastChangeSentinelEvent.new_sentinel,
      timestamp: new Date().toISOString(),
    }, gameState);
    if(!nextEventResult.valid){
      return {ok: false, message: `Invalid game event: ${nextEventResult.error}`, gameState, nextEvent: null} as const;
    }

    // Update the game state with the jailed cards
    const updatedGameState: GameState = {
      ...gameState,
      events: [...gameState.events, nextEventResult.event],
      playerInfo: gameState.playerInfo.map(player=>{
        if(player.id === lastChangeSentinelEvent.playerId){
          return {
            ...player,
            jailedCards: [...player.jailedCards, ...lastChangeSentinelEvent.new_sentinel],
          }
        }
        return player;
      }),
    };
    await this.storage.put(`game__${roomId}`, updatedGameState);
    return {ok: true, message: "Cards jailed successfully", gameState: updatedGameState, nextEvent: nextEventResult.event} as const;
  }

  async removeFromHand({roomId, cardsToRemove}: {roomId: string, cardsToRemove: string[]}){
    const gameState = await this.getGameState(roomId);
    if(!gameState){
      return {ok: false, message: "Game not found", code:"NOT_FOUND", gameState: null, nextEvent: null} as const;
    }
    const playerInfo =  gameState.playerInfo;
    if(playerInfo.length === 0){
      return {ok: false, message: "No players in the game", code:"NO_PLAYERS", gameState, nextEvent: null} as const;
    }

    // Get the last START_TURN event to determine the current player
    const lastStartTurnEvent = [...gameState.events].reverse().find(event=>event.type === "START_TURN") as TurnEvent | undefined;
    if(!lastStartTurnEvent || lastStartTurnEvent.type !== "START_TURN"){
      return {ok: false, message: "No START_TURN event found, cannot determine current player", code:"NO_CURRENT_PLAYER", gameState, nextEvent: null} as const;
    }

    const currentPlayerId = lastStartTurnEvent.playerId;
    const playerIndex = playerInfo.findIndex(player=>player.id === currentPlayerId);
    if(playerIndex === -1){
      return {ok: false, message: "Current player not found in the game", code:"CURRENT_PLAYER_NOT_FOUND", gameState, nextEvent: null} as const;
    }

    // Get the cards from player's hand that match the cardsToRemove
    const player = playerInfo[playerIndex];
    const cardsInHand = player.cardsInHand;
    const cardsToActuallyRemove = cardsInHand.filter(card=>cardsToRemove.includes(card.id));

    const removeFromHandResult = validateGameEvent({
      type: "REMOVE_FROM_HAND",
      playerId: currentPlayerId,
      cards_removed: cardsToActuallyRemove,
      timestamp: new Date().toISOString(),
    }, gameState);

    if(!removeFromHandResult.valid){
      return {ok: false, message: `Invalid game event: ${removeFromHandResult.error}`, code:"INVALID_GAME_EVENT", gameState, nextEvent: null} as const;
    }

    const updatedGameState: GameState = {
      ...gameState,
      events: [...gameState.events, removeFromHandResult.event],
      playerInfo: gameState.playerInfo.map((p, index)=>{
        if(index === playerIndex){
          return {
            ...p,
            cardsInHand: p.cardsInHand.filter(card=>!cardsToActuallyRemove.some(removedCard=>removedCard.id === card.id)),
          }
        }
        return p;
      }),
    };
    await this.storage.put(`game__${roomId}`, updatedGameState);
    return {ok: true, message: "Cards removed from hand successfully", gameState: updatedGameState, nextEvent: removeFromHandResult.event} as const;
  }

  async setPlayerLose({roomId, playerId}: {roomId: string, playerId: string}){
    const gameState = await this.getGameState(roomId);
    if(!gameState){
      return {ok: false, message: "Game not found", gameState: null, nextEvent: null} as const;
    }
    const playerInfo = gameState.playerInfo;
    if(playerInfo.length === 0){
      return {ok: false, message: "No players in the game", gameState, nextEvent: null} as const;
    }
    const playerIndex = playerInfo.findIndex(player=>player.id === playerId);
    if(playerIndex === -1){
      return {ok: false, message: "Player not found in the game", gameState, nextEvent: null} as const;
    }

    const newEventResult = validateGameEvent({
      type: "PLAYER_LOSE",
      playerId,
      timestamp: new Date().toISOString(),
    }, gameState);
    if(!newEventResult.valid){
      return {ok: false, message: `Invalid game event: ${newEventResult.error}`, code: "INVALID_GAME_EVENT", gameState, nextEvent: null} as const;
    }

    const updatedGameState: GameState = {
      ...gameState,
      events: [...gameState.events, newEventResult.event],
    };
    await this.storage.put(`game__${roomId}`, updatedGameState);
    return {ok: true, message: "Player marked as lost", code: "PLAYER_LOSE_SUCCESS", gameState: updatedGameState, nextEvent: newEventResult.event} as const;
  }
  async isThereAWinner({roomId}: {roomId: string}){
    // Get the total losers and check if there's only one player left who hasn't lost, if yes then that player is the winner
    const gameState = await this.getGameState(roomId);
    if(!gameState){
      return {ok: false, message: "Game not found", gameState: null, nextEvent: null} as const;
    }
    const playerInfo = gameState.playerInfo;
    if(playerInfo.length === 0){
      return {ok: false, message: "No players in the game", gameState, nextEvent: null} as const;
    }
    const lostPlayerIds = new Set(
      gameState.events
        .filter((event): event is TurnEvent & {type: "PLAYER_LOSE"} => event.type === "PLAYER_LOSE")
        .map(event => event.playerId)
    );
    const playersLeft = playerInfo.filter(player=>!lostPlayerIds.has(player.id));
    if(playersLeft.length === 1){
      const winner = playersLeft[0];
      const newEventResult = validateGameEvent({
        type: "PLAYER_WIN",
        playerId: winner.id,
        timestamp: new Date().toISOString(),
      }, gameState);
      if(!newEventResult.valid){
        return {ok: false, message: `Invalid game event: ${newEventResult.error}`, code: "INVALID_GAME_EVENT", gameState, nextEvent: null} as const;
      }
      const updatedGameState: GameState = {
        ...gameState,
        events: [...gameState.events, newEventResult.event],
      };
      await this.storage.put(`game__${roomId}`, updatedGameState);
      return {ok: true, message: "We have a winner!", code: "PLAYER_WIN_SUCCESS", gameState: updatedGameState, nextEvent: newEventResult.event} as const;
    }
    return {ok: false, message: "No winner yet", gameState, nextEvent: null} as const;
  }
  //
}


function drawCardFromDeck({cardsInDeck, cardsToDraw}:{cardsInDeck: GameCard[], cardsToDraw: number}){
  const drawnCards = cardsInDeck.slice(0, cardsToDraw);
  cardsInDeck = cardsInDeck.slice(cardsToDraw);
  return {
    drawnCards,
    remainingDeck: cardsInDeck,
  };
}
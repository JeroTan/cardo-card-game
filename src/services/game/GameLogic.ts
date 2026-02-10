import type { GameCard, GameState, PlayerGameInfo, TurnEvent } from "@/types/game/events";
import type { RoomInfo } from "@/types/game/room";
import type { CardPackService } from "../cardPack";
import type { CardService } from "../card";
import type { ModelCardRaw } from "@/types/model/cards";
import type { ModelCardPackCardsWitCardDetails } from "@/types/model/cardPack";
import { validateGameEvent } from "./General";

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

   public async addInitialPlayersFromServices({roomInfo, cardPackService, cardService, env}: {roomInfo: RoomInfo, cardPackService: CardPackService, cardService: CardService, env: Env}){
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
        // Store in cache
        fetchedCardsCache.set(cardPack.id, cardsInPack);
      }

      // Shuffle the cards
      const shuffledCards = cardsInPack.sort(() => 0.5 - Math.random());
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
        turnCount: 0,
        timeLeft: new Date(Date.now() + 60000).toISOString(), // 60 seconds from now
      } as PlayerGameInfo;
    }));

    //Randomize the order of players
    const shuffledPlayersForGame = playersForGame.sort(() => 0.5 - Math.random());

    this.addInitialPlayers(roomInfo.id, shuffledPlayersForGame);
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
      return {ok: false, message: "Game not found", gameRoom: null, nextEvent: null} as const;
    }
    const playerIndex = gameRoom.playerInfo.findIndex(player=>player.id === playerId);
    if(playerIndex === -1){
      return {ok: false, message: "Player not found in the game", gameRoom, nextEvent: null} as const;
    }
    const player = gameRoom.playerInfo[playerIndex];
    const drawCardFromDeckResult = drawCardFromDeck({cardsInDeck: player.cardsInDeck, cardsToDraw});
    const newEventResult = validateGameEvent({
      type: "DRAW_CARD",
      playerId,
      drawn_cards: drawCardFromDeckResult.drawnCards,
      timestamp: new Date().toISOString(),
    }, gameRoom);
    if(!newEventResult.valid){
      return {ok: false, message: `Invalid game event: ${newEventResult.error}`, gameRoom, nextEvent: null} as const;
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
    return {ok: true, message: "Cards drawn successfully", gameRoom: updatedGameRoom, nextEvent: newEventResult.event} as const;
  }

  getGameState(roomId: string){
    return this.storage.get(`game__${roomId}`) as Promise<GameState | undefined>;
  }

  clearRoom(roomId: string){
      this.storage.delete(`game__${roomId}`); 
   }
}

function drawCardFromDeck({cardsInDeck, cardsToDraw}:{cardsInDeck: GameCard[], cardsToDraw: number}){
  const drawnCards = cardsInDeck.slice(0, cardsToDraw);
  cardsInDeck = cardsInDeck.slice(cardsToDraw);
  return {
    drawnCards,
    remainingDeck: cardsInDeck,
  };
}
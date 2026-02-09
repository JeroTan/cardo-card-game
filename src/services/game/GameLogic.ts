import type { GameCard, GameState, PlayerGameInfo } from "@/types/game/events";
import type { RoomInfo } from "@/types/game/room";
import type { CardPackService } from "../cardPack";
import type { CardService } from "../card";
import type { ModelCardRaw } from "@/types/model/cards";
import type { ModelCardPackCardsWitCardDetails } from "@/types/model/cardPack";

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

  public async addInitialPlayers(roomId: string, playerInfo: Pick<PlayerGameInfo, "id" | "username"| "cardsInDeck">[]){
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
        cardsInDeck,
        jailedCards: [],
        turnCount: 0,
        timeLeft: new Date(Date.now() + 60000).toISOString(), // 60 seconds from now
      } as PlayerGameInfo;
    }));

    this.addInitialPlayers(roomInfo.id, playersForGame);
   }

   clearRoom(roomId: string){
      this.storage.delete(`game__${roomId}`); 
   }
}
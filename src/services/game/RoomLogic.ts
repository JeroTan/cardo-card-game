import type { PlayerRoomInfo, RoomInfo, RoomJoinCondition } from "@/types/game/room";

export class RoomLogic {
  constructor(protected storage: DurableObjectStorage){}

  /**
   * @description Prepares the room with initial player info. This will set up the room and delete the existing one.
   * @param roomId 
   * @param playerInfo 
   */
  setPreMadeRoom(roomId: string, playerInfo: Pick<PlayerRoomInfo, "id">[]){
    this.storage.put(roomId, {
      id: roomId,
      name: "Room " + roomId,
      players: playerInfo.map(player=>{
        return {
            ...player,
            status: "FROM_MATCHMAKING",
            username: "n/a",
          } as PlayerRoomInfo
        }
      ),
      joinCondition: "INVITE_ONLY", 

    } as RoomInfo);
  }

  async inviteToRoom(roomId: string, playerInfo: Pick<PlayerRoomInfo, "id" | "username">[]){
    const roomInfo = await this.storage.get(roomId) as RoomInfo | undefined;
    if(!roomInfo){
      return {ok: false, message: "Room not found", roomInfo: null} as const;
    }
    const updatedRoomInfo: RoomInfo = {
      ...roomInfo,
      players: [
        ...roomInfo.players,
        ...playerInfo.map(player=>({
          ...player,
          status: "INVITED" as const,
        })),
      ],
    }
    await this.storage.put(roomId, updatedRoomInfo);
    return {ok: true, message: "Players have been invited to the room", roomInfo: updatedRoomInfo} as const;
  }

  async joinRoom(roomId: string, playerInfo: Pick<PlayerRoomInfo, "id" | "username">[]){
    const roomInfo = await this.storage.get(roomId) as RoomInfo | undefined;
    if(!roomInfo){
      return {ok: false, message: "Room not found", roomInfo: null} as const;
    }
    const joinHandler = joinHandling[roomInfo.joinCondition];
    joinHandler.setRoomInfo(roomInfo);
    joinHandler.setPlayers(playerInfo.map(player=>({
      ...player,
      status: "JOINED" as const,
    })));
    const result = joinHandler.execute();
    return result;
  }

  async reconnectToRoom(roomId: string, playerInfo: Pick<PlayerRoomInfo, "id" | "username">){
    const roomInfo = await this.storage.get(roomId) as RoomInfo | undefined;
    if(!roomInfo){
      return {ok: false, message: "Room not found", roomInfo: null} as const;
    }
    // Check first if the player is in the room and has DISCONNECTED status. If not, return error
    const playerInRoom = roomInfo.players.find(player=>player.id === playerInfo.id);
    if(!playerInRoom){
      return {ok: false, message: "Player not in the room", roomInfo: null} as const;
    }
    if(playerInRoom.status !== "DISCONNECTED"){
      return {ok: false, message: "Player is not marked as disconnected", roomInfo: null} as const;
    }

    const updatedRoomInfo: RoomInfo = {
      ...roomInfo,
      players: roomInfo.players.map(player=>{
        if(player.id === playerInfo.id && player.status === "DISCONNECTED"){  
          return {
            ...player,
            ...playerInfo,
            status: "JOINED" as const,
          }
        }
        return player;
      }),
    }
    await this.storage.put(roomId, updatedRoomInfo);
    return {ok: true, message: "Player has reconnected to the room", roomInfo: updatedRoomInfo} as const;
  }

  async playerDisconnected(roomId: string, playerId: string){
    const roomInfo = await this.storage.get(roomId) as RoomInfo | undefined;
    if(!roomInfo){
      return {ok: false, message: "Room not found", roomInfo: null} as const;
    }
    const updatedRoomInfo: RoomInfo = {
      ...roomInfo,
      players: roomInfo.players.map(player=>{
        if(player.id === playerId){
          return {
            ...player,
            status: "DISCONNECTED" as const,
          }
        }
        return player;
      }),
    }
    await this.storage.put(roomId, updatedRoomInfo);
    return {ok: true, message: "Player has been marked as disconnected", roomInfo: updatedRoomInfo} as const;
  }

  async readyThePlayer(roomId:string, playerIds: string[]){
    const roomInfo = await this.storage.get(roomId) as RoomInfo | undefined;
    if(!roomInfo){
      return {ok: false, message: "Room not found", roomInfo: null} as const;
    }
    
    // Update players by mapping over playerIds and finding them in roomInfo
    const updatedPlayers = roomInfo.players.map(player => {
      if(playerIds.includes(player.id)){
        return {
          ...player,
          status: "READY" as const,
        }
      }
      return player;
    });
    
    const updatedRoomInfo: RoomInfo = {
      ...roomInfo,
      players: updatedPlayers,
    }
    await this.storage.put(roomId, updatedRoomInfo);
    return {ok: true, message: "Players are ready", roomInfo: updatedRoomInfo} as const;
  }

  async isEveryoneReady(roomId: string){
    const roomInfo = await this.storage.get(roomId) as RoomInfo | undefined;
    if(!roomInfo){
      return {ok: false, message: "Room not found", roomInfo: null} as const;
    }
    const everyoneReady = roomInfo.players.every(player=>player.status === "READY");
    if(!everyoneReady){
      return {ok: false, message: "Not everyone is ready", roomInfo} as const;
    }
    return {ok: true, message: "Everyone is ready", roomInfo} as const;
  }


  clearRoom(roomId: string){
    this.storage.delete(roomId);
  }
}

interface JoinHandler {
  setRoomInfo: (roomInfo: RoomInfo)=>void,
  setPlayers: (players: PlayerRoomInfo[])=>void,
  execute(): {ok: false, message: string, roomInfo: null} | {ok: true, message: string, roomInfo: RoomInfo}
}
class MatchmakingJoinHandler implements JoinHandler {
  roomInfo!: RoomInfo;
  players!: PlayerRoomInfo[]
  setRoomInfo(roomInfo: RoomInfo){
    this.roomInfo = roomInfo;
  }
  setPlayers(players: PlayerRoomInfo[]){
    this.players = players;
  }
  execute(){
    // Check the players from set players to the players set in roomInfo. The only one who can join is the one with status FROM_MATCHMAKING
    const roomPlayers = this.roomInfo.players;
    const canJoin = this.players.some(player=>{
      const roomPlayer = roomPlayers.find(p=>p.id === player.id);
      return roomPlayer?.status === "FROM_MATCHMAKING";
    });
    if(!canJoin){
      return {ok: false, message: "You cannot join this room", roomInfo: null} as const;
    }
    const updatedRoomInfo:RoomInfo = { 
      ...this.roomInfo,
      players: roomPlayers.map(roomPlayer=>{
        const player = this.players.find(p=>p.id === roomPlayer.id);
        if(player && roomPlayer.status === "FROM_MATCHMAKING"){
          return {
            ...roomPlayer,
            ...player,
            status: "JOINED",
          }
        }
        return roomPlayer;
      }),
    };
    return {ok: true, message: "Players have joined the room", roomInfo: updatedRoomInfo} as const;
  }
}

class InviteOnlyJoinHandler implements JoinHandler {
  roomInfo!: RoomInfo;
  players!: PlayerRoomInfo[];
  setRoomInfo(roomInfo: RoomInfo){
    this.roomInfo = roomInfo;
  }
  setPlayers(players: PlayerRoomInfo[]){
    this.players = players;
  }
  execute(){
    // Check first the contents of the room if a player is already invited
    const roomPlayers = this.roomInfo.players;
    const canJoin = this.players.some(player=>{
      const roomPlayer = roomPlayers.find(p=>p.id === player.id);
      return roomPlayer?.status === "INVITED";
    });
    if(!canJoin){
      return {ok: false, message: "You cannot join this room", roomInfo: null} as const;
    }
    const updatedRoomInfo:RoomInfo = { 
      ...this.roomInfo,
      players: roomPlayers.map(roomPlayer=>{  
        const player = this.players.find(p=>p.id === roomPlayer.id);
        if(player && roomPlayer.status === "INVITED"){
          return {
            ...roomPlayer,
            ...player,
            status: "JOINED",
          }
        }
        return roomPlayer;
      }),
    };
    return {ok: true, message: "Players have joined the room", roomInfo: updatedRoomInfo} as const;
  }
}
class OpenJoinHandler implements JoinHandler {
  roomInfo!: RoomInfo;
  players!: PlayerRoomInfo[];
  setRoomInfo(roomInfo: RoomInfo){
    this.roomInfo = roomInfo;
  }
  setPlayers(players: PlayerRoomInfo[]){
    this.players = players;
  }
  execute(){
    // In open join condition, we can just add the player to the room without any checks
    const roomPlayers = this.roomInfo.players;
    const updatedRoomInfo:RoomInfo = { 
      ...this.roomInfo,
      players: [...roomPlayers, ...this.players.map(player=>({
        ...player,
        status: "JOINED" as const,
      }))],
    };
    return {ok: true, message: "Players have joined the room", roomInfo: updatedRoomInfo} as const; 
  }
}
const joinHandling: Record<RoomJoinCondition, JoinHandler> = {
  "INVITE_ONLY": new InviteOnlyJoinHandler(),
  "OPEN": new OpenJoinHandler(),
  "MATCHMAKING": new MatchmakingJoinHandler(),
}

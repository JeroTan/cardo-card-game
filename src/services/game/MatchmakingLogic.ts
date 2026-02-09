import { getTemporaryUser, getUserAuthInformation, setTemporaryUser } from "@/lib/authentication/userAuth";
import type { MatchMakingInfo } from "@/types/game/matchmaking";
import type { AstroCookies } from "astro";

export class MatchmakingLogic {
  constructor(protected storage: DurableObjectStorage){}
  
  async addPlayer(playerId: string) {
    // Add player to waiting list in storage
    const playerList:MatchMakingInfo[] = (await this.storage.get("waitingPlayers")) ?? [];

    //Before pushing check if player is already in the list to avoid duplicates
    if(playerList.some(player => player.playerId === playerId)){
      return;
    }

    playerList.push({
      playerId,
      joinedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // Expires in 24 hours
    });
    await this.storage.put("waitingPlayers", playerList);
  }

  async removePlayer(playerId: string) {
    const playerList:MatchMakingInfo[] = (await this.storage.get("waitingPlayers")) ?? [];
    //Check first if player is in the list to avoid unnecessary writes
    const index = playerList.findIndex(player => player.playerId === playerId);
    if(index === -1){
      return;
    }
    playerList.splice(index, 1);
    await this.storage.put("waitingPlayers", playerList);
  }

  async isMatchReady(playerRequired: number = 2) {
    const playerList:MatchMakingInfo[] = (await this.storage.get("waitingPlayers")) ?? [];
    if(playerList.length < playerRequired){
      return {ok: false, players: playerList};
    }
    return {ok: true, players: playerList.slice(0, playerRequired)};
  }

  async isMatchReadyFor(playerId: string, playerRequired: number = 1) {
    const playerList:MatchMakingInfo[] = (await this.storage.get("waitingPlayers")) ?? [];
    const playerIndex = playerList.findIndex(player => player.playerId == playerId);
    if(playerIndex === -1){
      return {ok: false, players: playerList};
    }
    // Filter out the current player to get other players
    const otherPlayers = playerList.filter((_, index) => index !== playerIndex);
    if(otherPlayers.length < playerRequired){
      return {ok: false, players: otherPlayers};
    }
    const chosenPlayers = [playerList[playerIndex], ...otherPlayers.slice(0, playerRequired)];
    return {ok: true, players: chosenPlayers};
  }


  async poolCleanse(expiresWhen = Date.now()){
    const playerList:MatchMakingInfo[] = (await this.storage.get("waitingPlayers")) ?? [];
    if(playerList.length === 0){
      const filteredPlayers = playerList.filter(player=>{
        if(player.expiresAt === undefined || typeof player.expiresAt !== "number"){
          return false;
        }
        return player.expiresAt > expiresWhen;
      });
      if(filteredPlayers.length !== playerList.length){
        console.log(`Cleaned up ${playerList.length - filteredPlayers.length} expired player(s) from matchmaking storage`);
        await this.storage.put("waitingPlayers", filteredPlayers);
      }
    }
  }
}


export function getPlayerOnSession(astroCookies: AstroCookies){
  let playerId: string;
  let playerUsername: string;

  const {data: userInfo, error} = getUserAuthInformation(astroCookies);
  if(error != null){
    const {data: userInfo, error} = getTemporaryUser(astroCookies);
    if(error != null){
      const newTemporaryUser = setTemporaryUser(astroCookies);
      playerId = newTemporaryUser.id;
      playerUsername = newTemporaryUser.username;
    }else{
      playerId = userInfo.id;
      playerUsername = userInfo.username;
    }
  } else {
    playerId = userInfo.id;
    playerUsername = userInfo.username;
  }
  return {
    playerId,
    playerUsername,
  }

}
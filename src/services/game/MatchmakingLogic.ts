import { getTemporaryUser, getUserAuthInformation, setTemporaryUser } from "@/lib/authentication/userAuth";
import type { MatchMakingInfo } from "@/types/game/events";
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
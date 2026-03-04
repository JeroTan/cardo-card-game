import { HttpNativePlate} from "@jsarmyknife/native--http";

export const clientEndpointsForAdmin = [
  "/auth/login-with-password",

  // Card Management
  "/cards",
  `/cards-no-packs`,
  `/cards/{cardId}` as `/cards/${string|number}`,

  // Card Pack Management
  "/pack",
  `/pack/{packId}` as `/pack/${string|number}`,
  `/pack/{packId}/cards` as `/pack/${string|number}/cards`,
] as const;
type ClientEndpoint = typeof clientEndpointsForAdmin[number];

export function apiAdmin(){
  const http = new HttpNativePlate<ClientEndpoint>( `${location.origin}/api`+"/admin", {
    "Content-Type": "application/json",
  });
  return http;
}

export const clientEndpointsForClient = [
  "/game/find-match",
  "/game/room/{roomId}" as `/game/room/${string|number}`,
  "/game/room/{roomId}/check" as `/game/room/${string|number}/check`,
  "/game/room/{roomId}/game-state" as `/game/room/${string|number}/game-state`,
  
  // Custom room lobby endpoints
  "/game/room/create",
  "/game/room/join",
  "/game/room/{roomId}/join" as `/game/room/${string|number}/join`,
  "/game/room/{roomId}/remove-player" as `/game/room/${string|number}/remove-player`,
  "/game/room/{roomId}/ready" as `/game/room/${string|number}/ready`,
  "/game/room/{roomId}/add-bot" as `/game/room/${string|number}/add-bot`,

];
type ClientClientEndpoint = typeof clientEndpointsForClient[number];

export function apiClient(){
  const http = new HttpNativePlate<ClientClientEndpoint>( `${location.origin}/api`, {
    "Content-Type": "application/json",
  });
  return http;
}
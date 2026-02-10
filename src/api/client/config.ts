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

];
type ClientClientEndpoint = typeof clientEndpointsForClient[number];

export function apiClient(){
  const http = new HttpNativePlate<ClientClientEndpoint>( `${location.origin}/api`, {
    "Content-Type": "application/json",
  });
  return http;
}
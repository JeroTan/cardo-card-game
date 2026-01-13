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
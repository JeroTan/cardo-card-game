import { HttpNativePlate} from "@jsarmyknife/native--http";

export const clientEndpointsForAdmin = [
  "/auth/login-with-password",

  // Card Management
  "/cards",
  `/cards/{cardId}` as `/cards/${string|number}`,
] as const;
type ClientEndpoint = typeof clientEndpointsForAdmin[number];

export function apiAdmin(){
  const http = new HttpNativePlate<ClientEndpoint>( `${location.origin}/api`+"/admin", {
    "Content-Type": "application/json",
  });
  return http;
}
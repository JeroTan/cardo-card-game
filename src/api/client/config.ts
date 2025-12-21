import { HttpNativePlate} from "@jsarmyknife/native--http";

export const clientEndpointsForAdmin = [
  "/auth/login-with-password",
] as const;
type ClientEndpoint = typeof clientEndpointsForAdmin[number];

export function api(){
  const http = new HttpNativePlate<ClientEndpoint>( `${location.origin}/api`+"/admin", {
    "Content-Type": "application/json",
  });
  return http;
}
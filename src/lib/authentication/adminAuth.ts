import { SECRET_ADMIN_JWT_SECRET_KEY } from "astro:env/server";
import { jwtEncrypt } from "../crypto/jwt";
import type { AstroCookies } from "astro";
import { PUBLIC_APP_URL } from "astro:env/client";

export async function generateJWTForAdmin({userId}:{userId:string}){
  const jwtResult = await jwtEncrypt({
    payload: { userId },
    secretKey: SECRET_ADMIN_JWT_SECRET_KEY,
    expiresInSeconds: 3600*24*7, // 7 days
  });

  return jwtResult.data ? jwtResult.data : null;
}

export function getAdminAuthToken(cookie: AstroCookies):{data: string, error: null|undefined}|{data: null, error: string}{
  const data =  cookie.get("CDO_ADMIN_AUTH_TOKEN")?.value || null;
  if(!data){
    return {data: null, error: "No admin auth token found"};
  }
  try{
    return {
      data: atob(data),
      error: null
    }
  }catch(e){
    return {data: null, error: "Failed to decode admin auth token"};
  }
}

export function setAdminAuthToken(cookie: AstroCookies, token: string){
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // 7 days expiry
  const expiredInSeconds = 7 * 24 * 60 * 60; // 7 days in seconds
  const hostname = PUBLIC_APP_URL.replace(/^https?:\/\//, '').replace(/:\d+/, '').replace(/\/$/, '');


  cookie.set("CDO_ADMIN_AUTH_TOKEN", btoa(token), {
    expires: expiryDate ,
    maxAge:expiredInSeconds,
    httpOnly: true,
    secure: true, //If commented please turn it on again after testing on http without s
    sameSite: "strict",
    path: '/', 
    domain: hostname, 
  });
}
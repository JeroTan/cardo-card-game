import { getRandomString } from "@/utils/math/string";
import { jwtDecrypt, jwtEncrypt } from "../crypto/jwt";
import {SECRET_ADMIN_JWT_SECRET_KEY} from "astro:env/server";

export async function generateJWTForPasswordResetWithToken({userId, previousHash}:{userId:string, previousHash:string}){
  return jwtEncrypt<{userId: string, previousHash: string}>({
    payload: {
      userId,
      previousHash,
    },
    secretKey: SECRET_ADMIN_JWT_SECRET_KEY,
    expiresInSeconds: 600, // 10 minutes
  });
}


export async function decryptJWTForPasswordResetWithToken(token: string){
   return await jwtDecrypt<{userId: string, previousHash: string}>({
    token,
    secretKey: SECRET_ADMIN_JWT_SECRET_KEY
  });
}


export function createInitialUsername(){
  const date = new Date();
  return `u${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${getRandomString(6)}`;
}
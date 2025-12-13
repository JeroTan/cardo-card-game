import { SECRET_ADMIN_JWT_SECRET_KEY } from "astro:env/server";
import { jwtEncrypt } from "../crypto/jwt";

export async function generateJWTForAdmin({userId}:{userId:string}){
  const jwtResult = await jwtEncrypt({
    payload: { userId },
    secretKey: SECRET_ADMIN_JWT_SECRET_KEY,
    expiresInSeconds: 3600*24*7, // 7 days
  });

  return jwtResult.data ? jwtResult.data : null;
}
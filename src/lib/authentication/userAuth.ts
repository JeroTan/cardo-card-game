import { SECRET_USER_JWT_SECRET_KEY } from "astro:env/server";
import { jwtEncrypt } from "../crypto/jwt";
import { SECRET_GOOGLE_CLIENT_ID, SECRET_GOOGLE_CLIENT_SECRET} from "astro:env/server";
import { PUBLIC_APP_URL } from "astro:env/client";

export async function generateJWTForUser({userId}:{userId:string}){
  const jwtResult = await jwtEncrypt({
    payload: { userId },
    secretKey: SECRET_USER_JWT_SECRET_KEY,
    expiresInSeconds: 3600*24*30, // 30 days
  });
  return jwtResult.data ? jwtResult.data : null;
}

export function generateGoogleOAuthPayloadForVerification({code}:{code:string}){
  return new URLSearchParams({
    client_id: SECRET_GOOGLE_CLIENT_ID,
    client_secret: SECRET_GOOGLE_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: PUBLIC_APP_URL + "/api/player/auth/login-with-google",
  });
}
export function generateGoogleOAuthPayloadForRequest(){
  return new URLSearchParams({
    client_id: SECRET_GOOGLE_CLIENT_ID,
    redirect_uri: PUBLIC_APP_URL + "/api/player/auth/login-with-google",
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });
}
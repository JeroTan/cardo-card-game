import { randomUUID } from "node:crypto";

export async function uploadFile({env, id = randomUUID()}:{env: Env, id?:string}) {
  

  return id;
}
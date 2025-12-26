import { defineApiResolve } from "@/lib/api/general";
import { apiAdmin } from "./config";
import { zodLoginPasswordRequest } from "@/types/fields/loginWithPassword";
import { onZodError } from "@/lib/zod/formatter";


export const ApiLoginWithPasswordUser = defineApiResolve({
  input: zodLoginPasswordRequest,
  handler: async (data)=>{
    return apiAdmin().path("/auth/login-with-password").data(JSON.stringify(data)).post().request();
  },
  onZodError,
});

// export function ApiLoginWithPasswordUser(data: typeLoginWithPasswordRequest){
//   const req =  api().path("/auth/login-with-password").data(JSON.stringify(data)).post().request();
//   return new Resolve(req);
// }
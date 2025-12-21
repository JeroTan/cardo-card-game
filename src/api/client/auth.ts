import { defineApi } from "@/lib/api/general";
import { api } from "./config";
import { zodLoginPasswordRequest, type typeLoginWithPasswordRequest } from "@/types/fields/loginWithPassword";
import { Resolve } from "@jsarmyknife/native--http/dist/resolver";


// export const ApiLoginWithPasswordUser = defineApi({
//   input: zodLoginPasswordRequest,
//   handler: async (data)=>{
//     return api().path("/auth/login-with-password").data(JSON.stringify(data)).post();
//   }
// });

export function ApiLoginWithPasswordUser(data: typeLoginWithPasswordRequest){
  const req =  api().path("/auth/login-with-password").data(JSON.stringify(data)).post().request();
  return new Resolve(req);
}
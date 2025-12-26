import { defineApiResolve } from "@/lib/api/general";
import { onZodError } from "@/lib/zod/formatter";
import { zodCardCreate } from "@/types/fields/card/create";
import { apiAdmin } from "./config";

export const apiCreateCard = defineApiResolve({
  input: zodCardCreate,
  handler: async (data)=>{
    return apiAdmin().path("/cards").data(JSON.stringify(data)).post().request();
  },
  onZodError
})

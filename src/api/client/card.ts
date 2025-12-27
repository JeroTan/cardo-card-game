import { defineApiResolve } from "@/lib/api/general";
import { onZodError } from "@/lib/zod/formatter";
import { zodCardCreate } from "@/types/fields/card/create";
import { apiAdmin } from "./config";

export const apiCreateCard = defineApiResolve({
  input: zodCardCreate,
  handler: async (data)=>{
    const formData = new FormData();
    for(const key in data){
      if(key == "key") continue;
      formData.append(key, data[key as keyof typeof data] as string | Blob);
    }
    return apiAdmin()
      .path("/cards")
      .headers({"Content-Type": undefined}, true)
      .data(formData)
      .post()
      .request();
  },
  onZodError
})

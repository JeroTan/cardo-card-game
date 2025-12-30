import { defineApiResolve } from "@/lib/api/general";
import { onZodError } from "@/lib/zod/formatter";
import { zodPageAndQueryProps } from "@/types/model/filter";
import { apiAdmin } from "./config";
import { fromPropsToQueryParams } from "@/utils/api/query";



export const apiGetCardPacks = defineApiResolve({
  input: zodPageAndQueryProps,
  handler: async (query)=>{
    return apiAdmin()
    .path("/pack")
    .params(fromPropsToQueryParams(query))
    .get()
    .request();

  },
  onZodError
})
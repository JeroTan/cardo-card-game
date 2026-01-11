import { defineApiResolve } from "@/lib/api/general";
import { onZodError } from "@/lib/zod/formatter";
import { zodCardCreate } from "@/types/fields/card/create";
import { apiAdmin } from "./config";
import z from "zod";
import { zodPageAndQueryProps } from "@/types/model/filter";
import { fromPropsToQueryParams } from "@/utils/api/query";
import { zodCardUpdate } from "@/types/fields/card/update";
import { zodPackCreate } from "@/types/fields/pack/create";
import { DateNavigator } from "@jsarmyknife/native--math"

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
});

export const apiGetCards = defineApiResolve({
  input: zodPageAndQueryProps,
  handler: async (query)=>{
    return apiAdmin()
    .path("/cards")
    .params(fromPropsToQueryParams(query))
    .get()
    .request();
  },
  onZodError,
});

export const apiGetCardsNoPacks = defineApiResolve({
  input: zodPageAndQueryProps,
  handler: async (query)=>{
    return apiAdmin()
    .path("/cards-no-packs")
    .params(fromPropsToQueryParams(query))
    .get()
    .request();
  },
  onZodError,
})

export const apiGetCardDetail = defineApiResolve({
  input: z.uuid(),
  handler: async (cardId)=>{
    return apiAdmin()
      .path(`/cards/${cardId}`)
      .get()
      .request();
  },
  onZodError,
});

export const apiUpdateCard = defineApiResolve({
  input: zodCardUpdate,
  handler: async ({id, ...data})=>{
    const formData = new FormData();
    for(const key in data){
      if(key == "key") continue;
      if(data[key as keyof typeof data] === undefined) continue;
      formData.append(key, data[key as keyof typeof data] as string | Blob);
    }
    return apiAdmin()
      .path(`/cards/${id}`)
      .headers({"Content-Type": undefined}, true)
      .patch()
      .data(formData)
      .request();
  },
  onZodError,
});

export const apiDeleteCard = defineApiResolve({
  input: z.uuid(),
  handler: async (cardId)=>{
    return apiAdmin()
      .path(`/cards/${cardId}`)
      .data("{}")
      .delete()
      .request();
  },
  onZodError,
});

export const apiCreatePack = defineApiResolve({
  input: zodPackCreate,
  handler: async (data)=>{
    return apiAdmin()
      .path("/pack")
      .data(JSON.stringify({
        pack: {
          name: data.name,
          status: "PUBLISHED",
          pack_price: 1000,
          publish_start_date: new Date().toISOString(),
          publish_end_date: new DateNavigator().nextDay(20).toISOString(),
        },
        cards:data.cards.map((cardId)=>{
          return {card_id: cardId};
        }),
      }))
      .post()
      .request();
  },
  onZodError,
})
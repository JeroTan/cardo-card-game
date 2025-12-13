import { z } from "zod";
import { zod0To9, zodImage, zodLargeText, zodName, zodRarity } from "../zod/field";
import { tbox0To9, tboxDateTime, tboxImage, tboxLargeText, tboxLiterals, tboxName, tboxRarity } from "../typebox/field";
import { t, type Static } from "elysia";

export function zodCardCreate() {
  return z.object({
    name: zodName({fieldName: "Card Name"}),
    atk: zod0To9({fieldName: "Attack"}),
    def: zod0To9({fieldName: "Defense"}),
    card_art: zodImage({fieldName: "Card Art"}),
  })
}

export function tboxCardCreate(){
  return t.Object({
    name: tboxName({fieldName: "Card Name"}),
    atk: tbox0To9({fieldName: "Attack"}),
    def: tbox0To9({fieldName: "Defense"}),
    card_art: tboxImage({fieldName: "Card Art"}),
  })
}

export type typeCardCreate = z.infer<ReturnType<typeof zodCardCreate>>;
// export type typeCardCreate = Static<ReturnType<typeof tboxCardCreate>>;

export function tboxCardPackCreate(){
  return t.Object({
    pack: t.Object({
      name: tboxName({fieldName: "Card Pack Name"}),
      status: tboxLiterals({fieldName: "Pack Status", literals: ["PUBLISHED", "HIDDEN"]}),
      pack_price: t.Number(),
      publish_start_date: tboxDateTime({fieldName: "Publish Start Date"}),
      publish_end_date: tboxDateTime({fieldName: "Publish End Date"}),
    }),
    cards: t.Optional(t.Array(t.Object({
      card_id: t.String(),
    }))),
  })
}
export type typeCardPackCreate = Static<ReturnType<typeof tboxCardPackCreate>>;

export function tboxCardPackUpdate(){
  return t.Object({
    name: t.Optional(tboxName({fieldName: "Card Pack Name"})),
    status: t.Optional(tboxLiterals({fieldName: "Pack Status", literals: ["PUBLISHED", "HIDDEN"]})),
    pack_price: t.Optional(t.Number()),
    publish_start_date: t.Optional(tboxDateTime({fieldName: "Publish Start Date"})),
    publish_end_date: t.Optional(tboxDateTime({fieldName: "Publish End Date"})),
  })
}
export type typeCardPackUpdate = Static<ReturnType<typeof tboxCardPackUpdate>>;



export function tboxCardPackAddCards(){
  return t.Array(t.Object({
    card_id: t.String(),
  }));
}
export type typeCardPackAddCards = Static<ReturnType<typeof tboxCardPackAddCards>>;

export function tboxCardPackUpdateCards(){
  return t.Array(t.Object({
    id: t.String(),
    card_id: t.String(),
  }));
}
export type typeCardPackUpdateCards = Static<ReturnType<typeof tboxCardPackUpdateCards>>;
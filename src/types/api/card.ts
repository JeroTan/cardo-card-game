import { z } from "zod";
import { zod0To9, zodImage, zodLargeText, zodName, zodRarity } from "../zod/field";
import { tbox0To9, tboxImage, tboxLargeText, tboxName, tboxRarity } from "../typebox/field";
import { t, type Static } from "elysia";

export function zodCardCreate() {
  return z.object({
    name: zodName({fieldName: "Card Name"}),
    rarity: zodRarity(),
    atk: zod0To9({fieldName: "Attack"}),
    def: zod0To9({fieldName: "Defense"}),
    description: z.optional(zodLargeText({fieldName: "Description", maxLength: 256})),
    card_art: zodImage({fieldName: "Card Art"}),
  })
}

export function tboxCardCreate(){
  return t.Object({
    name: tboxName({fieldName: "Card Name"}),
    rarity: tboxRarity(),
    atk: tbox0To9({fieldName: "Attack"}),
    def: tbox0To9({fieldName: "Defense"}),
    description: t.Optional(tboxLargeText({fieldName: "Description", maxLength: 256})),
    card_art: tboxImage({fieldName: "Card Art"}),
  })
}

export type typeCardCreate = z.infer<ReturnType<typeof zodCardCreate>>;
// export type typeCardCreate = Static<ReturnType<typeof tboxCardCreate>>;

export function tboxCardPackCreate(){
  return t.Object({
    pack: t.Object({
      name: tboxName({fieldName: "Card Pack Name"}),
      status: t.Union([t.Literal("PUBLISHED"), t.Literal("HIDDEN")]),
      price_per_card: t.Number(),
      publish_start_date: t.String(),
      publish_end_date: t.String(),
    }),
    cards: t.Optional(t.Array(t.Object({
      card_id: t.String(),
      drop_rate: t.Number(),
    }))),
  })
}
export type typeCardPackCreate = Static<ReturnType<typeof tboxCardPackCreate>>;

export function tboxCardPackUpdate(){
  return t.Object({
    name: t.Optional(tboxName({fieldName: "Card Pack Name"})),
    status: t.Optional(t.Union([t.Literal("PUBLISHED"), t.Literal("HIDDEN")])),
    price_per_card: t.Optional(t.Number()),
    publish_start_date: t.Optional(t.String()),
    publish_end_date: t.Optional(t.String()),
  })
}
export type typeCardPackUpdate = Static<ReturnType<typeof tboxCardPackUpdate>>;



export function tboxCardPackAddCards(){
  return t.Array(t.Object({
    card_id: t.String(),
    drop_rate: t.Number(),
  }));
}
export type typeCardPackAddCards = Static<ReturnType<typeof tboxCardPackAddCards>>;

export function tboxCardPackUpdateCards(){
  return t.Array(t.Object({
    id: t.String(),
    card_id: t.String(),
    drop_rate: t.Number(),
  }));
}
export type typeCardPackUpdateCards = Static<ReturnType<typeof tboxCardPackUpdateCards>>;
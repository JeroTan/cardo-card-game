import { tbox0To9, tboxDateTime, tboxImage, tboxLiterals, tboxName } from "../typebox/field";
import { t, type Static } from "elysia";

export const tboxCardCreate = t.Object({
  name: tboxName({fieldName: "Card Name"}),
  atk: tbox0To9({fieldName: "Attack"}),
  def: tbox0To9({fieldName: "Defense"}),
  card_art: tboxImage({fieldName: "Card Art"}),
});


// export type typeCardCreate = z.infer<typeof zodCardCreate>;
export type typeCardCreate = Static<typeof tboxCardCreate>;


export const tboxCardPackCreate = t.Object({
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
});

export type typeCardPackCreate = Static<typeof tboxCardPackCreate>;

export const tboxCardPackUpdate = t.Object({
  name: t.Optional(tboxName({fieldName: "Card Pack Name"})),
  status: t.Optional(tboxLiterals({fieldName: "Pack Status", literals: ["PUBLISHED", "HIDDEN"]})),
  pack_price: t.Optional(t.Number()),
  publish_start_date: t.Optional(tboxDateTime({fieldName: "Publish Start Date"})),
  publish_end_date: t.Optional(tboxDateTime({fieldName: "Publish End Date"})),
});
export type typeCardPackUpdate = Static<typeof tboxCardPackUpdate>;




export const tboxCardPackAddCards = t.Array(t.Object({
    card_id: t.String(),
  }));
export type typeCardPackAddCards = Static<typeof tboxCardPackAddCards>;

export const tboxCardPackUpdateCards = t.Array(t.Object({
  id: t.String(),
  card_id: t.String(),
}));

export type typeCardPackUpdateCards = Static<typeof tboxCardPackUpdateCards>;
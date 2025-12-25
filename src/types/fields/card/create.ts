import { zod0To9, zodImage, zodName } from "@/types/zod/field";
import z from "zod";

export const zodCardCreate = z.object({
  name: zodName({fieldName: "Card Name"}),
  atk: zod0To9({fieldName: "Attack"}),
  def: zod0To9({fieldName: "Defense"}),
  card_art: zodImage({fieldName: "Card Art"}),
});

export type typeCardCreate = z.infer<typeof zodCardCreate>;
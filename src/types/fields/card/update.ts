import { zod0To9, zodImage, zodName } from "@/types/zod/field";
import z from "zod";

export const zodCardUpdate = z.object({
  id: z.uuid(),
  name: zodName({fieldName: "Card Name"}).optional(),
  atk: zod0To9({fieldName: "Attack"}).optional(),
  def: zod0To9({fieldName: "Defense"}).optional(),
  card_art: zodImage({fieldName: "Card Art"}).optional(),
});

export type typeCardUpdate = z.infer<typeof zodCardUpdate>;
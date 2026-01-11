import { zodName } from "@/types/zod/field";
import z from "zod";

export const zodPackCreate = z.object({
  name: zodName({fieldName: "Pack Name", minLength: 2, maxLength: 64}),
  cards: z.array(z.uuid()),
});

export type typePackCreate = z.infer<typeof zodPackCreate>;
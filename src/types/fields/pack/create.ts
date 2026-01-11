import { zodArrayMinMax, zodName } from "@/types/zod/field";
import z from "zod";

export const zodPackCreate = z.object({
  name: zodName({fieldName: "Pack Name", minLength: 2, maxLength: 64}),
  cards: zodArrayMinMax({ zodSchema: z.uuid(), minLength:50, maxLength:50 }),
});

export type typePackCreate = z.infer<typeof zodPackCreate>;
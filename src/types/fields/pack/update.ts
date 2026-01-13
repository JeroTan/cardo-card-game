import { zodNameWithNumbers } from "@/types/zod/field";
import z from "zod";

export const zodPackMetaUpdate = z.object({
  id: z.uuid(),
  name: zodNameWithNumbers({fieldName: "Pack Name", minLength: 2, maxLength: 64}),
});

export type typePackMetaUpdate = z.infer<typeof zodPackMetaUpdate>;
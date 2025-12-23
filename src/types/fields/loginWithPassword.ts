import z from "zod";
import { zodEmail, zodPassword, zodRequired } from "../zod/field";


export const  zodLoginPasswordRequest = z.object({
  email: z.string(),
  password: z.string(),
});

export type typeLoginWithPasswordRequest = z.infer<typeof zodLoginPasswordRequest>;
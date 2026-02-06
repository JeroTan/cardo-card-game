import z from "zod";


export const  zodLoginPasswordRequest = z.object({
  email: z.string(),
  password: z.string(),
});

export type typeLoginWithPasswordRequest = z.infer<typeof zodLoginPasswordRequest>;
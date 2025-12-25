import { clearAdminAuth } from "@/lib/authentication/adminAuth";
import { defineAction } from "astro:actions";


export const authentication = {
  logout: defineAction({
    handler: async (_,context)=>{
      clearAdminAuth(context.cookies);
    }
  })
}
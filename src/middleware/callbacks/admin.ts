import { getAdminAuthToken } from "@/lib/authentication/adminAuth";
import type { APIContext } from "astro";

export function BlockWhenAdminAuth(context: APIContext) {
  const {error} = getAdminAuthToken(context.cookies);
  if(!error){
    return context.redirect("/admin/dashboard");
  }
}

export function BlockWhenNotAdminAuth(context: APIContext) {
  const {error} = getAdminAuthToken(context.cookies);
  if(error){
    return context.redirect("/admin/auth/login");
  }
}
import { clearAdminAuth, getAdminAuthInformation, getAdminAuthToken } from "@/lib/authentication/adminAuth";
import type { APIContext } from "astro";

export function BlockWhenAdminAuth(context: APIContext) {
  const {error} = getAdminAuthToken(context.cookies);
  const {error:authInfoError} = getAdminAuthInformation(context.cookies);
  if(!error && !authInfoError){
    return context.redirect("/admin/dashboard");
  }else{
    clearAdminAuth(context.cookies);
  }
}

export function BlockWhenNotAdminAuth(context: APIContext) {
  const {error} = getAdminAuthToken(context.cookies);
  const {error:authInfoError} = getAdminAuthInformation(context.cookies);
  if(error || authInfoError){
    clearAdminAuth(context.cookies);
    return context.redirect("/admin/auth/login");
  }
}
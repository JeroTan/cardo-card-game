import type { UserAccountController } from "@/controller/admin/userAccount";
import { typedAstroCookies, typedEnv, typedUrlData } from "@/lib/elysia";
import { tboxLoginWithPasswordUsingEmailOrUsername, tboxRegisterWithPassword, tboxResetPasswordWithToken } from "@/types/api/auth";
import { Elysia, t} from "elysia";

export function PlayerRoutes({
  app,
  userController,
}:{
  app: Elysia,
  userController: UserAccountController,
}){
  app
    .use(typedEnv)
    .use(typedUrlData)
    .use(typedAstroCookies)
    .group('/player', (app) => {
      app
      .group("/auth", (app)=>{
        app
        //====================================================================================//
        .get("/login-request-google", ({env})=>{
          return userController.loginRequestGoogle({env});
        }, {
          detail: {
            summary: 'Request Google OAuth Login',
            tags: ['Player - Authentication'],
          }
        })
        //====================================================================================//
        .get("/login-with-google", ({env, query})=>{
          return userController.loginWithGoogle({env, code: query.code});
        }, {
          query: t.Object({
            code: t.String(),
            scope: t.Optional(t.String()),
            authuser: t.Optional(t.String()),
            prompt: t.Optional(t.String()),
          }),
          detail: {
            summary: 'Login with Google OAuth Callback',
            tags: ['Player - Authentication'],
          }
        })
        //====================================================================================//
        .post("/login-with-password", ({env, body, astroCookies})=>{
          return userController.loginWithPassword({env, emailOrUsername: body.emailOrUsername, password: body.password, astroCookies});
        }, {
          body: tboxLoginWithPasswordUsingEmailOrUsername,
          detail: {
            summary: 'Login with Email/Username and Password',
            tags: ['Player - Authentication'],
          }
        })
        //====================================================================================//
        .post("/register", ({env, body})=>{
          return userController.registerUserAccount({env, userData: body});
        }, {
          body: tboxRegisterWithPassword,
          detail: {
            summary: 'Register User Account with Email and Password',
            tags: ['Player - Authentication'],
          }
        })
        //====================================================================================//
        .post("/request-reset-password", ({env, body})=>{
          return userController.requestPasswordResetToken({env, email: body.email, urlLinkToSend: body.urlLinkToSend});
        }, {
          body: t.Object({
            email: t.String(),
            urlLinkToSend: t.String(),
          }),
          detail: {
            summary: 'Request Password Reset',
            tags: ['Player - Authentication'],
          }
        })
        //====================================================================================//
        .post("/reset-password-with-token", ({env, body})=>{
          return userController.resetPasswordWithToken({env, token: body.token, newPassword: body.newPassword});
        }, {
          body: tboxResetPasswordWithToken,
          detail: {
            summary: 'Reset Password with Token',
            tags: ['Player - Authentication'],
          }
        })
        //====================================================================================//
        
        ;

        return app;
      })

      return app;
    });

  return app;
}
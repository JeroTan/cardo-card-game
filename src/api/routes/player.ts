import type { UserAccountController } from "@/controller/admin/userAccount";
import { typedEnv, typedUrlData } from "@/lib/elysia";
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
    .onError((err) => {
      console.error("Player Route Error:", err);
    })
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
        ;

        return app;
      })

      return app;
    });

  return app;
}
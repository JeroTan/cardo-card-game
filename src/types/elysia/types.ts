import type { Context } from "elysia";

export type ModContext<T = any, BODY = any> = Context & {env:Env, cloneRequest:Request, shared?:T} & {body:BODY}
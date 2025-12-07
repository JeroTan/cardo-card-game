import type { Context } from "elysia";

export type ModContext<T = any> = Context & {env:Env} & T
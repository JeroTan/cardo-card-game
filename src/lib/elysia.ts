import Elysia from "elysia";

export const typedEnv = new Elysia().decorate({
    x: undefined,
  } as unknown as {env: Env});
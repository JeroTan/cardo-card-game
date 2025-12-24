import type { AstroCookies } from "astro";
import Elysia from "elysia";

export const typedEnv = new Elysia().decorate({
  x: undefined,
} as unknown as {env: Env});

export const typedUrlData = new Elysia().decorate({
  x: undefined,
} as unknown as {urlData: URL});

export  const typedAstroCookies = new Elysia().decorate({
  x: undefined,
} as unknown as {astroCookies: AstroCookies});
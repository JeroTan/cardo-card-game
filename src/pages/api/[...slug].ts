import { Elysia, t } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
import { openapi } from '@elysiajs/openapi'
import getCorsConfig from '@/api/config/cors'
import { AdminContainer } from '@/container/api/adminContainer';
import type { APIRoute } from 'astro';

const app = new Elysia({ 
  prefix: '/api',
  adapter: CloudflareAdapter,
  aot: false, // After numerous trial to make it work, turning it off make it work on Cloudflare worker.
})
  .use(openapi())
  .use(getCorsConfig())
  // Containers
  .use(AdminContainer(new Elysia()))
// Required for Cloudflare Workers

// In order to run elysia here
const handle:APIRoute = (async (ctx) => {
  return await app.decorate({
    env: ctx.locals.runtime.env,
  })
  // .compile()  // Although pointed out in documentation of Elysia.js, this doesn't work because it is run through Astro.JS
  .handle(ctx.request)
  ;
});
export const GET = handle;
export const POST = handle;
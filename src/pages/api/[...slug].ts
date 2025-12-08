import { Elysia, t } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
import { openapi } from '@elysiajs/openapi'
import getCorsConfig from '@/api/config/cors'
import { AdminContainer } from '@/container/api/adminContainer';
import type { APIRoute } from 'astro';

const app = new Elysia({ 
  prefix: '/api',
  adapter: CloudflareAdapter,
  aot: false,
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
  // .compile()
  .handle(ctx.request)
  ;
});
export const GET = handle;
export const POST = handle;
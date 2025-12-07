import { Elysia, t } from 'elysia'
import { openapi } from '@elysiajs/openapi'
import getCorsConfig from '@/api/config/cors'
import { AdminContainer } from '@/container/api/adminContainer';
import type { APIRoute } from 'astro';

const app = new Elysia({ 
  prefix: '/api',
})
  .use(openapi())
  .use(getCorsConfig())
  // Containers
  .use(AdminContainer(new Elysia()))

// In order to run elysia here
const handle:APIRoute = (async (ctx) => {
  return await app.decorate({
    env: ctx.locals.runtime.env,
  })
  .handle(ctx.request);
});
export const GET = handle;
export const POST = handle;
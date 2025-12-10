import { t, type Static } from "elysia";

export const tBoxQueryParams = t.Object({
  search: t.Optional(t.String()),
  filter: t.Optional(t.Record(t.String(), t.String())),
  sort: t.Optional(t.String()),
});

export type typeQueryParams = Static<typeof tBoxQueryParams>;
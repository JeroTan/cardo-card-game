import { getPlayerOnSession } from "@/services/game/MatchmakingLogic";
import type { APIContext } from "astro";

export function checkTemporaryUser(context: APIContext) {
  getPlayerOnSession(context.cookies);
}
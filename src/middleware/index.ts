import { Middleware } from "@/lib/middleware/main";
import { sequence, defineMiddleware } from "astro/middleware";
import { CheckIfLive, CheckIfMaintenance } from "./callbacks/maintenance";
import { BlockWhenAdminAuth, BlockWhenNotAdminAuth } from "./callbacks/admin";
import { checkTemporaryUser } from "./callbacks/player";

/*|------------------------------------------------------------------------------------------|*/
/*|               Entry Point                                                                |*/
/*|------------------------------------------------------------------------------------------|*/
export const onRequest = sequence(Main());
function Main() {
	return defineMiddleware(async (context, next) => {
		// Middleware logic goes here

		// Skip if it is an action
		if (context.url.pathname.startsWith("/_actions")) {
			return next();
		}
		//If it is a server island loader
		if (context.url.pathname.startsWith("/_server-island")) {
			return next();
		}

		// Skip API routes
		if (context.url.pathname.startsWith("/api/")) {
			return next();
		}

		// Middleware Utility
		const mid = new Middleware(context, next);

		// Add ONs
		checkTemporaryUser(context);

		// 1st Group Middleware
		await mid.group(async (mid) => {
			//Check if maintenance
			await mid.path().except(["/memo/maintenance"], "startend").do(CheckIfMaintenance);
			await mid.path().select(["/memo/maintenance"], "startend").do(CheckIfLive);

			return mid.fin(); // to end the group
		});

		// 2nd Group Middleware
		await mid.group(async (mid)=>{
			await mid.path().select([
				"/admin/auth",
			], "startend").do(BlockWhenAdminAuth);

			await mid.path().select([
				"/admin",	
			], "exact").do(BlockWhenNotAdminAuth);

			await mid.path().select([
				"/admin/dashboard",
				"/admin/account",
				"/admin/card",
				"/admin/card-pack",
				"/admin/user",
			], "startend").do(BlockWhenNotAdminAuth);
			
			return mid.fin(); // to end the group
		});

		return await mid.result();
	});
}

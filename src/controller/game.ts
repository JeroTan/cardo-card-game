

export class CardGameController {
  constructor(){

  }

  prepareRoom({roomId, env, request}: {roomId: string, env: Env, request: Request}){
 	if (!roomId) {
		return Response.json({ message: "Room ID is required" }, { status: 400 });
	}

	// Get the Durable Object binding
	const { CARD_GAME_ROOM } = env;

	// Create a unique ID for this room
	const id = CARD_GAME_ROOM.idFromName(roomId);

	// Get the Durable Object stub
	const stub = CARD_GAME_ROOM.get(id);

	// Forward the request to the Durable Object
	return stub.fetch(request);
  }
}
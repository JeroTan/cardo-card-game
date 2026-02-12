export function getStub({
  name,
  durableObject
}: {
  name: string;
  durableObject: DurableObjectNamespace;
}) {
  const id = durableObject.idFromName(name);
  return durableObject.get(id);
}


export function stabRequest(originalRequest?: Request){
  const url = new URL("https://internal/stab");

  function constructRequest(){
    const init: RequestInit = {
      method: "GET",
    };
    
    // Preserve headers from original request if provided
    if (originalRequest) {
      init.headers = new Headers(originalRequest.headers);
    }
    
    return [
      url,
      init
    ] as const;
  }
  return [
    url,
    constructRequest,
  ] as const;
}
export function stabRequestBody(originalRequest?: Request){
  const url = new URL("https://internal/stab");
  let body: string = "";

  function constructRequest(){
    const init: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    };
    // Preserve headers from original request if provided
    if (originalRequest) {
      init.headers = new Headers(originalRequest.headers);
    }
    return [
      url,
      init
    ] as const;
  }

  function setBody<T extends object>(data: T){
    body = JSON.stringify(data);
  }

  return [
    url,
    setBody,
    constructRequest,
  ] as const;
}

export function makeWSResponse(response: Response){
  if(response.status !== 101 || !response.webSocket){
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  }
  return new Response(null, {
    status: 101,
    webSocket: response.webSocket,
    headers: {
      "Content-Type": "application/json",
    }
  });
}

export function makeWSServer(ctx: DurableObjectState){
  const [client, server] = Object.values(new WebSocketPair());
  ctx.acceptWebSocket(server);
  return {
    response: new Response(null, {
      status: 101,
      webSocket: client,
      headers: {
        "Content-Type": "application/json",
      }
    }),
    client,
    server,
  }
}

export function makeWSServerResponse(ctx: DurableObjectState){
  const { response } = makeWSServer(ctx);
  return response;
}

export function convertMessageToJSON<T extends object>(message: ArrayBuffer | string): T {
  let messageString: string;
  if (typeof message === "string") {
    messageString = message;
  } else {
    const decoder = new TextDecoder();
    messageString = decoder.decode(message);
  }
  return JSON.parse(messageString) as T;
}


export async function cleanseDurableObjectStorage(storage: DurableObjectStorage, expiresWhen = Date.now()){
  const entries = await storage.list();
  console.log(`Starting storage cleanup. Total entries: ${entries.size}`);
  for(const [key, value] of entries){
    //Check if it is an object that is not array
    if(value === null){
      await storage.delete(key);
    }
    if(typeof value === "object" && !Array.isArray(value)){
      //Check if it has expiresAt field and if it is expired
      if("expiresAt" in value! && typeof value.expiresAt === "number" && value.expiresAt < expiresWhen){
        await storage.delete(key);
      }
      //Check if it doesn't have expiresAt field. Then delete it completely as we don't know when it expires
      if(!("expiresAt" in value!)){
        await storage.delete(key);
      }
    }
    
    // Specific Data
    if(key === "waitingPlayers" && Array.isArray(value)){
      const filteredPlayers = value.filter(player=>{
        if(player.expiresAt === undefined || typeof player.expiresAt !== "number"){
          return false;
        }
        return player.expiresAt > expiresWhen;
      });
      if(filteredPlayers.length !== value.length){
        console.log(`Cleaned up ${value.length - filteredPlayers.length} expired player(s) from matchmaking storage`);
        await storage.put(key, filteredPlayers);
      }
    }
  }
}
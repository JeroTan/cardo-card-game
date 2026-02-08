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
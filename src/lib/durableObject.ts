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
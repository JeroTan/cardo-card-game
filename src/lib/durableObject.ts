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


export function stabRequest(){
  const url = new URL("https://internal/stab");

  function constructRequest(){
    return [
      url,
      {
        method: "GET",
      } as RequestInit
    ] as const;
  }
  return [
    url,
    constructRequest,
  ] as const;
}
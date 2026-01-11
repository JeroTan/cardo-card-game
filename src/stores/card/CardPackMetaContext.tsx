import { zodValidateSchema } from "@/lib/zod/validator";
import { zodPackCreate } from "@/types/fields/pack/create";
import { createContext, useContext, useMemo, useState } from "react";

export type typePackMeta = {
  name: string,
  updateName: (name:string) => void,
  hasError: false | string,
  // There will be more next
}

export const PackMetaContext = createContext<typePackMeta>(null!);

export function PackMetaProvider({
  children,
}:{
  children?: React.ReactNode,
}){
  const [name, nameSet] = useState<string>(""); 
  const hasError = useMemo(()=>{
    const result = zodValidateSchema(name, zodPackCreate.shape.name);
    if(result.error == false){
      return false;
    }
    return result.message.join(" ");
  }, [name]);

  return <PackMetaContext.Provider value={{
    name,
    updateName: (newName:string)=>{
      nameSet(newName);
    },
    hasError,
  }}>{children}</PackMetaContext.Provider>
}


export function usePackMetaContext(){
  return useContext(PackMetaContext);
}
import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group";
import { useDebounce } from "@uidotdev/usehooks";
import { useState } from "react";
import { useUpdateEffect } from "react-use";

export default function SearchBox({
  updateValue,
}:{
  updateValue?: (newValue:string)=>void,
}){
  const [search, searchSet] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useUpdateEffect(()=>{
    updateValue?.(debouncedSearch);
  }, [debouncedSearch]);

  return <>
    <InputGroup>
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput 
        placeholder="Search..."
        value={search}
        onInput={(e)=>{
          const newValue = (e.target as HTMLInputElement).value;
          searchSet(newValue);
        }}
      />

    </InputGroup>
  </>;
}
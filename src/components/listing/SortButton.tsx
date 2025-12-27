import type { PropsWithChildren } from "react";
import { Button } from "../ui/button";
import { ArrowDownNarrowWide, ArrowUpNarrowWide } from "lucide-react";

export default function SortButton({children, sort, ...attr}:PropsWithChildren<{
  sort:"ASC"|"DESC"
}&Parameters<typeof Button>>){
  return <>
    <Button variant={"outline"} {...attr}>
      {children} {
        sort === "ASC" ? <ArrowUpNarrowWide /> : <ArrowDownNarrowWide />
      }
    </Button>
  </>
}

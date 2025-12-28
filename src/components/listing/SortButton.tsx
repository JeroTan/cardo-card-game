import type { PropsWithChildren, ComponentProps } from "react";
import { Button } from "../ui/button";
import { ArrowDownNarrowWide, ArrowUpNarrowWide } from "lucide-react";

export default function SortButton({children, sort, ...attr}:PropsWithChildren<{
  sort:"asc"|"desc"
} & ComponentProps<typeof Button>>){
  return <>
    <Button variant={"outline"} {...attr}>
      {children} {
        sort === "asc" ? <ArrowUpNarrowWide /> : <ArrowDownNarrowWide />
      }
    </Button>
  </>
}

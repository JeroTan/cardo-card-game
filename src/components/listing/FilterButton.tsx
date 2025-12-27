import { Funnel } from "lucide-react";
import { Button } from "../ui/button";
import type { PropsWithChildren } from "react";

export default function FilterButton({
  children,
  ...attr
}:PropsWithChildren<{}&Parameters<typeof Button>>){
  return <>
    <Button variant={"outline"} {...attr}>
      {children} Filter <Funnel />
    </Button>
  </>
}
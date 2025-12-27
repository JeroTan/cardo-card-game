import type { PropsWithChildren, ReactNode } from "react";
import { Card } from "../ui/card";
type Props = {
  leftChildren?: ReactNode,
  rightChildren?: ReactNode,
}
export default function NavigationBar({
  leftChildren,
  rightChildren,
}:Props){
  return <nav className="">
    <Card className="w-full flex sm:flex-nowrap flex-wrap justify-between items-center">
      {leftChildren}
      {rightChildren}
    </Card>
  </nav>
}
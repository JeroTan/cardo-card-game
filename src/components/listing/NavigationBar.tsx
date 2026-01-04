import type { PropsWithChildren, ReactNode } from "react";
import { Card } from "../ui/card";
type Props = {
  leftChildren?: ReactNode,
  rightChildren?: ReactNode,
  className?:string,
}
export default function NavigationBar({
  leftChildren,
  rightChildren,
  className,
}:Props){
  return <nav className={className}>
    <Card className="w-full flex-row flex sm:flex-nowrap flex-wrap items-center gap-2 py-2 px-2">
      {leftChildren}
      {rightChildren}
    </Card>
  </nav>
}

export function NavigationBarClean({
  leftChildren,
  rightChildren,
  className,
}:Props){
  return <nav className={className}>
    <div className="w-full flex-row flex @lg:flex-nowrap flex-wrap items-center gap-2 py-2 px-2">
      {leftChildren}
      {rightChildren}
    </div>
  </nav>
}
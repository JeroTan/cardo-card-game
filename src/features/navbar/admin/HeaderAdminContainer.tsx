import type { PropsWithChildren } from "react";

export default function HeaderMainAdmin({children}:PropsWithChildren<{}>){
  return <>
    <nav className="w-full h-16 bg-slate-900 border-b px-5 border-slate-800">
      {children}
    </nav>
  </>
}
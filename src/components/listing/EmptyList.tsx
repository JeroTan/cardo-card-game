import { FolderOpen } from "lucide-react";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { Button } from "../ui/button";

export default function EmptyList({
  children
}:{
  children?:React.ReactNode
}
){
  return <>
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant={"icon"}>
          <FolderOpen />
        </EmptyMedia>
        <EmptyTitle>
          No data found
        </EmptyTitle>
        <EmptyDescription>
          Try adjusting your filters or create new items.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {children}
      </EmptyContent>
    </Empty>
  </>
}
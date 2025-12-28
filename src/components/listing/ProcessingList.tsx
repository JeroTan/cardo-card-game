import { Skeleton } from "../ui/skeleton";

export default function ProcessingList(){
  return <>
    <Skeleton className="h-10 w-full mb-2"/>
    <Skeleton className="h-40 w-full mb-2"/>
    <Skeleton className="h-10 w-full mb-2"/>
    <Skeleton className="h-10 w-full mb-2"/>

  </>
}
export function ProcessingListLarge(){
  return <>
    <Skeleton className="h-64 w-full mb-2"/>
    <Skeleton className="h-64 w-full mb-2"/>
    <Skeleton className="h-32 w-full mb-2"/>
  </>
}
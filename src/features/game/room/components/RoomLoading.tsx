import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

export default function RoomLoading(){
  return <>
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Users className="h-6 w-6" />
          Game Lobby
        </CardTitle>
      </CardHeader>

      <CardContent className="size-full">
        <Skeleton className="size-full" />
      </CardContent>

      <CardFooter className="flex gap-3">
        <p>
          Loading the game lobby...
        </p>
      </CardFooter>
    </Card>
  </>
}
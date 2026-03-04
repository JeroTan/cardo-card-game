import { Button } from "@/components/ui/button";

export default function HeaderNotAuthNavigation(){
  return <>
    <div className="mr-auto">
      <Button asChild variant={"ghost"} className="hover:brightness-120 py-1 px-1">
        <a href="/" className="">
          <img src="/images/logo.png" alt="CARDO Logo" className="inline size-8" />
        </a>
      </Button>
    </div>
    <div>
      <Button asChild variant={"ghost"} className="hover:brightness-120 py-1 px-3 mr-2">
        <a href="/how-to-play" className="">
          How to Play
        </a>
      </Button>
 
    </div>
  </>
}
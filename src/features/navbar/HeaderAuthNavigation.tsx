import { Button } from "@/components/ui/button";

export default function HeaderAuthNavigation(){
  return <>
    <div className="mr-auto">
      <Button asChild variant={"ghost"} className="hover:brightness-120 p-2">
        <a href="/" className="">
          <img src="/images/logo.png" alt="CARDO Logo" className="inline size-8" />
        </a>
      </Button>
    </div>
    <div>
    </div>
  </>
}
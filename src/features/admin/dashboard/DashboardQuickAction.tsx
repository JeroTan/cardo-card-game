import { Button } from "@/components/ui/button";
import { CreditCard, Package, Users } from "lucide-react";

export default function DashboardQuickAction(){
  return <>
    <div className="flex flex-wrap gap-2">
      <Button asChild variant={"outline"}>
        <a
          href="/admin/card/create"
        >
          <CreditCard className="h-4 w-4" />
          Add New Card
        </a>
      </Button>
      
      <Button asChild variant={"outline"}>
        <a
          href="/admin/card-pack/create"
        >
          <Package className="h-4 w-4" />
        Create Card Pack
      </a>
      </Button>
      <Button asChild variant={"outline"}>
        <a
          href="/admin/users"
        >
          <Users className="h-4 w-4" />
          View All Users
        </a>
      </Button>
    </div>
  </>
}
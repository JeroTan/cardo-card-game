import { Users, Package, CreditCard, Settings, BarChart3, ShoppingBag } from "lucide-react";
import DashboardQuickAction from "./DashboardQuickAction";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "./types";
import { useMemo } from "react";

interface Props {
  stats?: DashboardStats;
}

export default function DashboardMenu({ stats = {
  totalUsers: 0,
  totalCards: 0,
  totalPacks: 0,
  activeGames: 0,
} }: Props) {

  const menuItemData = useMemo(()=>{
    return [
      {
        title: "Card Management",
        description: "Manage game cards, stats, and artwork",
        icon: CreditCard,
        href: "/admin/card",
      },
      {
        title: "Card Packs",
        description: "Manage card packs",
        icon: Package,
        href: "/admin/card-pack",
      },
      {
        title: "User Management",
        description: "View and manage player accounts",
        icon: Users,
        href: "/admin/users",
      },
    ];
  }, []);

  const statItemsData = useMemo(()=>{
    return [
      {
        title: "Total Cards",
        value: stats.totalCards,
      },
      {
        title: "Active Packs",
        value: stats.totalPacks,
      },
      {
        title: "Total Users",
        value: stats.totalUsers,
      },
      {
        title: "Active Games",
        value: stats.activeGames ,
      },
    ]
  }, [stats]);

  return (
    <div className="w-full space-y-6 p-6">
      <nav className="flex justify-end">
        <DashboardQuickAction />
      </nav>

      {/* Stats Grid */}
      <div className="flex sm:flex-nowrap flex-wrap justify-content-between gap-4">
        {statItemsData.map((item) => (
          <Card key={item.title} className="py-2 px-5 m-0 basis-full">
            <CardContent className="p-0 flex gap-5">
              <div className="">
                <p className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </p>
                <p className="text-2xl font-bold">
                  {item.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid gap-4 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 ">
        {menuItemData.map((item) => (
          <a
            key={item.title}
            href={item.href}
            className="group"
          >
            <Card className="relative h-full overflow-hidden transition-all hover:shadow-md hover:border-primary">
              <CardContent>
                {/* Icon */}
                <div className="flex justify-center">
                  <div className={`relative rounded-full p-3 bg-zinc-200 bg-opacity-10 transition-transform group-hover:scale-110`}>
                    <item.icon color={"gray"} className={`size-8`} />
                  </div>
                </div>
                
                {/* Content */}
                <div className="text-center mt-3">
                  <h3 className="text-lg group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* Quick Actions */}
      
    </div>
  );
}
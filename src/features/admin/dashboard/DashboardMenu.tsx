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
        href: "/admin/cards",
        color: "bg-blue-500",
      },
      {
        title: "Card Packs",
        description: "Manage card packs, drop rates, and pricing",
        icon: Package,
        href: "/admin/card-packs",
        color: "bg-purple-500",
      },
      {
        title: "User Management",
        description: "View and manage player accounts",
        icon: Users,
        href: "/admin/users",
        color: "bg-green-500",
      },
    ];
  }, []);

  const statItemsData = useMemo(()=>{
    return [
      {
        title: "Total Cards",
        value: stats.totalCards,
        icon: CreditCard,
        color: "bg-blue-500",
      },
      {
        title: "Active Packs",
        value: stats.totalPacks,
        icon: Package,
        color: "bg-purple-500",
      },
      {
        title: "Total Users",
        value: stats.totalUsers,
        icon: Users,
        color: "bg-green-500",
      },
      {
        title: "Active Games",
        value: stats.activeGames ,
        icon: BarChart3,
        color: "bg-pink-500",
      },
    ]
  }, [stats]);

  return (
    <div className="w-full space-y-6 p-6">
      <nav className="flex justify-end">
        <DashboardQuickAction />
      </nav>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItemsData.slice(0, 4).map((item) => (
          <Card key={item.title}>
            <CardContent className="flex gap-5">
              <div className="flex items-center justify-between">
                <div className={`rounded-full p-3 ${item.color} bg-opacity-10`}>
                  <item.icon className={`h-6 w-6 ${item.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
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
      <div className="grid gap-4 lg:grid-cols-5 sm:grid-cols-4 ">
        {menuItemData.map((item) => (
          <a
            key={item.title}
            href={item.href}
            className="group"
          >
            <Card className="relative overflow-hidden transition-all hover:shadow-md hover:border-primary">
              <CardContent>
                {/* Icon */}
                <div className="flex justify-center">
                  <div className={`relative rounded-full p-3 ${item.color} bg-opacity-10 transition-transform group-hover:scale-110`}>
                    <item.icon className={`size-8 ${item.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
                
                {/* Content */}
                <div className="text-center mt-3">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
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
import { Users, Package, CreditCard, Settings, BarChart3, ShoppingBag } from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalCards: number;
  totalPacks: number;
  activeGames: number;
}

interface Props {
  stats?: DashboardStats;
}

export default function DashboardMenu({ stats }: Props) {
  const defaultStats: DashboardStats = {
    totalUsers: stats?.totalUsers ?? 0,
    totalCards: stats?.totalCards ?? 0,
    totalPacks: stats?.totalPacks ?? 0,
    activeGames: stats?.activeGames ?? 0,
  };

  const menuItems = [
    {
      title: "Card Management",
      description: "Manage game cards, stats, and artwork",
      icon: CreditCard,
      href: "/admin/cards",
      color: "bg-blue-500",
      stat: defaultStats.totalCards,
      statLabel: "Total Cards",
    },
    {
      title: "Card Packs",
      description: "Manage card packs, drop rates, and pricing",
      icon: Package,
      href: "/admin/card-packs",
      color: "bg-purple-500",
      stat: defaultStats.totalPacks,
      statLabel: "Active Packs",
    },
    {
      title: "User Management",
      description: "View and manage player accounts",
      icon: Users,
      href: "/admin/users",
      color: "bg-green-500",
      stat: defaultStats.totalUsers,
      statLabel: "Total Users",
    },
    {
      title: "Shop Analytics",
      description: "View sales, purchases, and revenue",
      icon: ShoppingBag,
      href: "/admin/analytics",
      color: "bg-orange-500",
      stat: "N/A",
      statLabel: "Coming Soon",
    },
    {
      title: "Game Statistics",
      description: "Monitor active games and match history",
      icon: BarChart3,
      href: "/admin/games",
      color: "bg-pink-500",
      stat: defaultStats.activeGames,
      statLabel: "Active Games",
    },
    {
      title: "Admin Settings",
      description: "Manage your admin account and preferences",
      icon: Settings,
      href: "/admin/account",
      color: "bg-gray-500",
      stat: null,
      statLabel: null,
    },
  ];

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage cards, packs, users, and game settings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {menuItems.slice(0, 4).map((item) => (
          <div
            key={item.title}
            className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-full p-3 ${item.color} bg-opacity-10`}>
                <item.icon className={`h-6 w-6 ${item.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {item.statLabel}
              </p>
              <p className="text-2xl font-bold">
                {item.stat}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <a
            key={item.title}
            href={item.href}
            className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary"
          >
            {/* Icon */}
            <div className={`mb-4 inline-flex rounded-full p-3 ${item.color} bg-opacity-10 transition-transform group-hover:scale-110`}>
              <item.icon className={`h-6 w-6 ${item.color.replace('bg-', 'text-')}`} />
            </div>

            {/* Content */}
            <div className="space-y-2">
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
          </a>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/cards/add"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            Add New Card
          </a>
          <a
            href="/admin/card-packs"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Package className="h-4 w-4" />
            Create Card Pack
          </a>
          <a
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Users className="h-4 w-4" />
            View All Users
          </a>
        </div>
      </div>
    </div>
  );
}
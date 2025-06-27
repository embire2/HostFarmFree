import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Puzzle, Globe, Heart } from "lucide-react";

export default function StatsGrid() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const statItems = [
    {
      label: "Active Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-accent",
    },
    {
      label: "Premium Plugins",
      value: stats?.totalPlugins || 0,
      icon: Puzzle,
      color: "text-yellow-600",
    },
    {
      label: "Websites Hosted",
      value: stats?.totalWebsites || 0,
      icon: Globe,
      color: "text-green-600",
    },
    {
      label: "Total Donations",
      value: `$${((stats?.totalDonations || 0) / 100).toLocaleString()}`,
      icon: Heart,
      color: "text-red-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <IconComponent className={`w-8 h-8 mx-auto mb-2 ${item.color}`} />
              <div className="text-3xl font-bold text-white">
                {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
              </div>
              <div className="text-sm text-white/80">{item.label}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

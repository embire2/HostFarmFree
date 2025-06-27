import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { Plugin } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { isUnauthorizedError } from "@/lib/authUtils";

interface PluginCardProps {
  plugin: Plugin;
}

export default function PluginCard({ plugin }: PluginCardProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/plugins/${plugin.id}/download`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: `${plugin.name} download has been recorded.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plugins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plugin-downloads"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDownload = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to download plugins.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }
    downloadMutation.mutate();
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "e-commerce": "bg-primary text-white",
      "seo": "bg-orange-500 text-white",
      "page-builder": "bg-purple-500 text-white",
      "forms": "bg-blue-500 text-white",
      "security": "bg-red-500 text-white",
      "backup": "bg-green-500 text-white",
    };
    return colors[category.toLowerCase()] || "bg-gray-500 text-white";
  };

  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
      {plugin.imageUrl && (
        <img
          src={plugin.imageUrl}
          alt={plugin.name}
          className="w-full h-48 object-cover"
        />
      )}
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge className={`text-xs px-3 py-1 rounded-full font-medium ${getCategoryColor(plugin.category)}`}>
            {plugin.category.toUpperCase()}
          </Badge>
          <span className="text-green-600 font-semibold">FREE</span>
        </div>

        <h3 className="text-xl font-semibold text-dark mb-2">{plugin.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{plugin.description}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Download className="w-4 h-4 mr-1" />
            <span>{plugin.downloadCount?.toLocaleString() || 0}</span>
          </div>
          <div>
            v{plugin.version} • {formatFileSize(plugin.fileSize)}
          </div>
        </div>

        <Button
          onClick={handleDownload}
          disabled={downloadMutation.isPending}
          className="w-full bg-accent text-white hover:bg-green-600 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          {downloadMutation.isPending ? "Downloading..." : "Download"}
        </Button>
      </CardContent>
    </Card>
  );
}

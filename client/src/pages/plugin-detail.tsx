import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Heart,
  User,
  FileText,
  Gift,
  ExternalLink
} from "lucide-react";
import Navbar from "@/components/navbar";
import { Plugin } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function PluginDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: plugin, isLoading, error } = useQuery<Plugin>({
    queryKey: ["/api/plugins/slug", slug],
    queryFn: async () => {
      const res = await fetch(`/api/plugins/slug/${slug}`);
      if (!res.ok) throw new Error('Plugin not found');
      return res.json();
    },
    enabled: !!slug,
  });

  const handleDownload = async () => {
    if (!plugin) return;
    
    setIsDownloading(true);
    
    try {
      // For public plugins, direct download
      if (plugin.isPublic) {
        window.open(`/api/plugins/${plugin.id}/download`, '_blank');
        
        toast({
          title: "Download Started",
          description: "Your plugin download has started!",
        });
      } else {
        // Redirect to auth for private plugins
        window.location.href = "/auth";
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download plugin. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDonate = () => {
    if (!plugin?.slug) return;
    setLocation(`/plugin/${plugin.slug}/donate`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading plugin details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !plugin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Plugin Not Found</h1>
          <p className="text-gray-600 mb-8">The plugin you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => window.location.href = '/plugins'}>
            Browse All Plugins
          </Button>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "e-commerce": "bg-blue-500 text-white",
      "seo": "bg-orange-500 text-white",
      "page-builder": "bg-purple-500 text-white",
      "forms": "bg-green-500 text-white",
      "security": "bg-red-500 text-white",
      "backup": "bg-yellow-500 text-white",
      "analytics": "bg-pink-500 text-white",
      "social": "bg-indigo-500 text-white",
      "performance": "bg-teal-500 text-white",
    };
    return colors[category.toLowerCase()] || "bg-gray-500 text-white";
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Plugin Image */}
            <div className="lg:col-span-1">
              {plugin.imageUrl ? (
                <img 
                  src={plugin.imageUrl} 
                  alt={plugin.name}
                  className="w-full aspect-square object-cover rounded-lg border"
                />
              ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <FileText className="w-24 h-24 text-white opacity-50" />
                </div>
              )}
            </div>

            {/* Plugin Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{plugin.name}</h1>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={getCategoryColor(plugin.category)}>
                      {plugin.category.toUpperCase()}
                    </Badge>
                    {plugin.isPublic && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        FREE DOWNLOAD
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                {plugin.description}
              </p>

              {/* Plugin Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Download className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-xl font-bold text-gray-900">
                    {plugin.downloadCount?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">Downloads</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <User className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-lg font-semibold text-gray-900">
                    {plugin.author}
                  </div>
                  <div className="text-sm text-gray-600">Author</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-lg font-semibold text-gray-900">
                    {formatFileSize(plugin.fileSize)}
                  </div>
                  <div className="text-sm text-gray-600">File Size</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex-1 bg-primary hover:bg-secondary text-white text-lg py-3"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download Plugin'}
                </Button>
                
                <Button 
                  onClick={handleDonate}
                  variant="outline" 
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  size="lg"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Donate $5
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plugin Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Plugin Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Version:</span>
                  <span>{plugin.version}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Category:</span>
                  <span className="capitalize">{plugin.category.replace('-', ' ')}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Author:</span>
                  <span>{plugin.author}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">File Size:</span>
                  <span>{formatFileSize(plugin.fileSize)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Downloads:</span>
                  <span>{plugin.downloadCount?.toLocaleString() || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Support & Donation */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="w-5 h-5 mr-2" />
                  Support Development
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Help keep this plugin updated and maintained by making a small donation.
                </p>
                <Button 
                  onClick={handleDonate}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Donate $5
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Secure payment powered by Stripe
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Having trouble with this plugin? Check out our support resources.
                </p>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
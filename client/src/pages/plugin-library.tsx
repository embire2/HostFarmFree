import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  Filter,
  Download,
  Star,
  Grid,
  List,
  Mail,
  Lock,
  AlertTriangle
} from "lucide-react";
import Navbar from "@/components/navbar";
import PluginCard from "@/components/plugin-card";
import PluginRequestForm from "@/components/plugin-request-form";
import SEOHead, { generateSchemaData } from "@/components/seo-head";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plugin } from "@shared/schema";

export default function PluginLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [emailInput, setEmailInput] = useState("");
  const [showEmailBanner, setShowEmailBanner] = useState(false);
  
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plugins, isLoading: pluginsLoading } = useQuery({
    queryKey: ["/api/plugins", { category: selectedCategory !== "all" ? selectedCategory : undefined, search: searchTerm || undefined }],
    enabled: !!(isAuthenticated && user?.email), // Only load plugins if user is authenticated with email
  });

  // Check if user has access to plugin library
  const hasAccess = isAuthenticated && user?.email;
  
  // Show email banner for authenticated users without email
  useEffect(() => {
    if (isAuthenticated && user && !user.email) {
      setShowEmailBanner(true);
    } else {
      setShowEmailBanner(false);
    }
  }, [isAuthenticated, user]);

  // Email update mutation
  const updateEmailMutation = useMutation({
    mutationFn: (email: string) => apiRequest("POST", "/api/update-email", { email }),
    onSuccess: () => {
      toast({
        title: "Email Updated",
        description: "Your email has been saved. You now have access to the Plugin Library!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setShowEmailBanner(false);
      setEmailInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email address",
        variant: "destructive",
      });
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      updateEmailMutation.mutate(emailInput.trim());
    }
  };

  const categories = [
    { id: "all", name: "All Plugins", count: plugins?.length || 0 },
    { id: "e-commerce", name: "E-commerce", count: 0 },
    { id: "seo", name: "SEO Tools", count: 0 },
    { id: "page-builder", name: "Page Builders", count: 0 },
    { id: "forms", name: "Forms", count: 0 },
    { id: "security", name: "Security", count: 0 },
    { id: "backup", name: "Backup", count: 0 },
    { id: "analytics", name: "Analytics", count: 0 },
    { id: "social", name: "Social", count: 0 },
    { id: "performance", name: "Performance", count: 0 },
    { id: "other", name: "Other", count: 0 }
  ];

  // Calculate category counts
  const categoryCounts = categories.map(cat => {
    if (cat.id === "all") return cat;
    const count = plugins?.filter((plugin: Plugin) => plugin.category === cat.id).length || 0;
    return { ...cat, count };
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is handled by the query key change
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "all": "bg-primary text-white",
      "e-commerce": "bg-primary text-white",
      "seo": "bg-orange-500 text-white",
      "page-builder": "bg-purple-500 text-white",
      "forms": "bg-blue-500 text-white",
      "security": "bg-red-500 text-white",
      "backup": "bg-green-500 text-white",
      "analytics": "bg-indigo-500 text-white",
      "social": "bg-pink-500 text-white",
      "performance": "bg-yellow-500 text-white",
      "other": "bg-gray-500 text-white"
    };
    return colors[category] || "bg-gray-500 text-white";
  };

  // Generate structured data for plugin library
  const pluginLibrarySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Premium WordPress Plugin Library",
    "description": "Download thousands of premium WordPress plugins for free including WooCommerce, Elementor Pro, Yoast SEO Premium, and more. No subscriptions, completely free access.",
    "url": "https://hostfarm.org/plugins",
    "mainEntity": {
      "@type": "ItemList",
      "name": "WordPress Plugins",
      "numberOfItems": plugins?.length || 0,
      "itemListElement": plugins?.slice(0, 10).map((plugin, index) => ({
        "@type": "SoftwareApplication",
        "position": index + 1,
        "name": plugin.name,
        "description": plugin.description,
        "applicationCategory": "WordPress Plugin",
        "downloadUrl": `https://hostfarm.org/plugin/${plugin.slug}`
      })) || []
    }
  };

  const breadcrumbSchema = generateSchemaData.breadcrumb([
    { name: "Home", url: "https://hostfarm.org" },
    { name: "WordPress Plugin Library", url: "https://hostfarm.org/plugins" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [pluginLibrarySchema, breadcrumbSchema]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Premium WordPress Plugin Library - Free Download | HostFarm.org"
        description="Download premium WordPress plugins for free including WooCommerce Pro, Elementor Pro, Yoast SEO Premium, Rank Math Pro, WPML, and 2000+ more plugins. No subscriptions, no hidden fees."
        keywords="WordPress plugins free download, premium WordPress plugins, WooCommerce Pro, Elementor Pro, Yoast SEO Premium, Rank Math Pro, WPML, WordPress plugin library, free plugins, premium plugins download"
        canonical="https://hostfarm.org/plugins"
        ogImage="https://hostfarm.org/og-plugin-library.jpg"
        schemaData={combinedSchema}
      />
      <Navbar />
      
      {/* Email Collection Banner */}
      {showEmailBanner && (
        <Alert className="bg-red-50 border-red-200 text-red-800 mx-4 mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <strong>Unlock Plugin Library Access:</strong> By providing your email address, you unlock the Plugin Library and Request function.
              </div>
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-64"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={updateEmailMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {updateEmailMutation.isPending ? "Saving..." : "Save Email"}
                </Button>
              </form>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-dark mb-4">Premium WordPress Plugin Library</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Download <strong>2,000+ premium WordPress plugins</strong> worth $15,000+ completely free. 
            Including WooCommerce Pro, Elementor Pro, Yoast SEO Premium, Rank Math Pro, WPML, and more.
          </p>
        </div>

        {/* Access Control */}
        {!hasAccess && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <Lock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Plugin Library Access Required</h2>
              
              {!isAuthenticated ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    Sign in to access our premium WordPress plugin library with 2,000+ plugins.
                  </p>
                  <Button 
                    onClick={() => window.location.href = "/api/login"} 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Sign In to Access Plugins
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-6">
                    Add your email address to unlock the Plugin Library and Request function.
                  </p>
                  <form onSubmit={handleEmailSubmit} className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-80"
                      required
                    />
                    <Button 
                      type="submit" 
                      disabled={updateEmailMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {updateEmailMutation.isPending ? "Saving..." : "Unlock Plugin Library"}
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search and Filters - Only show if user has access */}
        {hasAccess && (
          <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Bar */}
            <div className="flex-1">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search plugins..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg border-gray-300 focus:border-primary focus:ring-primary"
                />
              </form>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="px-3"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        )}

        {/* Category Filters - Only show if user has access */}
        {hasAccess && (
          <div className="mb-8">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-600 mr-2" />
            <span className="text-lg font-semibold text-gray-700">Categories</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {categoryCounts.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={`${
                  selectedCategory === category.id 
                    ? getCategoryColor(category.id)
                    : "border-gray-300 text-gray-700 hover:border-primary hover:text-primary"
                } transition-all duration-200`}
              >
                {category.name}
                {category.count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 bg-white/20 text-current border-0"
                  >
                    {category.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
        )}

        {/* Results Summary - Only show if user has access */}
        {hasAccess && (
          <div className="flex items-center justify-between mb-6">
          <div className="text-gray-600">
            {pluginsLoading ? (
              "Loading plugins..."
            ) : (
              <>
                Showing {plugins?.length || 0} plugin{plugins?.length !== 1 ? 's' : ''}
                {selectedCategory !== "all" && ` in ${categoryCounts.find(c => c.id === selectedCategory)?.name}`}
                {searchTerm && ` matching "${searchTerm}"`}
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              All plugins are premium quality
            </div>
            <div className="flex items-center">
              <Download className="h-4 w-4 text-green-500 mr-1" />
              Free downloads
            </div>
          </div>
        </div>
        )}

        {/* Plugin Grid/List - Only show if user has access */}
        {hasAccess && (
          <>
            {pluginsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : plugins && plugins.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plugins.map((plugin: Plugin) => (
                <PluginCard key={plugin.id} plugin={plugin} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {plugins.map((plugin: Plugin) => (
                <Card key={plugin.id} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-6">
                      {plugin.imageUrl && (
                        <img
                          src={plugin.imageUrl}
                          alt={plugin.name}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold text-dark mb-1">{plugin.name}</h3>
                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                              <Badge className={getCategoryColor(plugin.category)}>
                                {plugin.category.toUpperCase()}
                              </Badge>
                              <span>v{plugin.version}</span>
                              <span>{plugin.author}</span>
                            </div>
                          </div>
                          <span className="text-green-600 font-semibold">FREE</span>
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">{plugin.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            <Download className="w-4 h-4 mr-1" />
                            <span>{plugin.downloadCount?.toLocaleString() || 0} downloads</span>
                          </div>
                          <Button className="bg-accent text-white hover:bg-green-600">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <div className="max-w-md mx-auto">
                <Search className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No plugins found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedCategory !== "all" 
                    ? "Try adjusting your search criteria or browse different categories."
                    : "No plugins have been uploaded yet. Check back soon for premium WordPress plugins!"}
                </p>
                {(searchTerm || selectedCategory !== "all") && (
                  <div className="space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear Search
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCategory("all")}
                    >
                      View All Categories
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plugin Request Section - Available for users with access */}
        {plugins && plugins.length > 0 && (
          <Card className="mt-16 gradient-primary text-white">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h2>
                <p className="text-lg mb-6 opacity-90">
                  Request the plugins you need. We're constantly adding new premium plugins to our library.
                </p>
              </div>
              
              <PluginRequestForm />
            </CardContent>
          </Card>
        )}
          </>
        )}
      </div>
    </div>
  );
}

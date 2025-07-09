import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Globe, CreditCard, AlertCircle, CheckCircle, Clock, Star, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface DomainSearchResult {
  domain: string;
  isAvailable: boolean;
  registrationPrice: number;
  transferPrice: number;
  canTransfer: boolean;
  finalRegistrationPrice: number;
  finalTransferPrice: number;
  profitMargin: number;
}

export default function PremiumHostingSearch() {
  const [domain, setDomain] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DomainSearchResult[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const { toast } = useToast();

  const handleDomainSearch = async () => {
    if (!domain.trim()) {
      toast({
        title: "Domain Required",
        description: "Please enter a domain name to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchPerformed(false);

    try {
      console.log(`[Premium Domain Search] Searching for: ${domain}`);
      
      const response = await fetch("/api/premium-hosting/search-domain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: domain.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to search domain");
      }

      const results = await response.json();
      console.log(`[Premium Domain Search] Results:`, results);
      
      setSearchResults(results);
      setSearchPerformed(true);
      
      toast({
        title: "Domain Search Complete",
        description: `Found ${results.length} result(s) for ${domain}`,
      });
    } catch (error) {
      console.error("[Premium Domain Search] Error:", error);
      toast({
        title: "Search Failed",
        description: "Failed to search domain. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleOrderDomain = async (domainResult: DomainSearchResult, orderType: 'registration' | 'transfer') => {
    try {
      console.log(`[Premium Domain Order] Ordering ${domainResult.domain} as ${orderType}`);
      
      const response = await fetch("/api/premium-hosting/order-domain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: domainResult.domain,
          orderType,
          price: orderType === 'registration' ? domainResult.finalRegistrationPrice : domainResult.finalTransferPrice,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const orderData = await response.json();
      console.log(`[Premium Domain Order] Order created:`, orderData);
      
      toast({
        title: "Order Created",
        description: `Your ${orderType} order for ${domainResult.domain} has been created and is pending approval.`,
      });
      
      // Redirect to conversion tracking page
      window.location.href = `/conversion?type=premium_hosting&domain=${domainResult.domain}&orderType=${orderType}`;
      
    } catch (error) {
      console.error("[Premium Domain Order] Error:", error);
      toast({
        title: "Order Failed",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Premium Hosting Introduction */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-6 border border-amber-400/30"
        >
          <Star className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Premium Hosting Package</h3>
          <p className="text-amber-100 text-lg">
            Register a new domain or transfer an existing one to create your premium hosting package.
          </p>
          <p className="text-amber-200 text-sm mt-2">
            All orders are manually reviewed and approved by our team for quality assurance.
          </p>
        </motion.div>
      </div>

      {/* Domain Search */}
      <Card className="bg-white/5 border-amber-400/20">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Search className="mr-2 h-5 w-5 text-amber-400" />
            Domain Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain name (e.g., example.com)"
              className="flex-1 bg-white/10 border-amber-400/30 text-white placeholder-amber-200"
              onKeyPress={(e) => e.key === 'Enter' && handleDomainSearch()}
              disabled={isSearching}
            />
            <Button
              onClick={handleDomainSearch}
              disabled={isSearching || !domain.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {isSearching ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Domain
                </>
              )}
            </Button>
          </div>
          
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Clock className="w-8 h-8 text-amber-400 mx-auto animate-spin" />
                <p className="text-amber-200">Searching domain availability...</p>
                <p className="text-amber-300 text-sm">This may take a few moments</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchPerformed && searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-bold text-white flex items-center">
            <Globe className="mr-2 h-5 w-5 text-amber-400" />
            Search Results
          </h3>
          
          {searchResults.map((result) => (
            <Card key={result.domain} className="bg-white/5 border-amber-400/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-6 h-6 text-amber-400" />
                    <div>
                      <h4 className="text-lg font-semibold text-white">{result.domain}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        {result.isAvailable ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Available
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-400/30">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Not Available
                          </Badge>
                        )}
                        
                        {result.canTransfer && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                            <ArrowRight className="mr-1 h-3 w-3" />
                            Transfer Available
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4 bg-amber-400/20" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Registration Option */}
                  {result.isAvailable && (
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-lg p-4 border border-green-400/20">
                      <h5 className="font-semibold text-green-400 mb-2">Domain Registration</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-300">Base Price:</span>
                          <span className="text-white">${(result.registrationPrice / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-300">Profit Margin:</span>
                          <span className="text-white">{result.profitMargin}%</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span className="text-green-400">Your Price:</span>
                          <span className="text-white">${(result.finalRegistrationPrice / 100).toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOrderDomain(result, 'registration')}
                        className="w-full mt-3 bg-green-500 hover:bg-green-600 text-black font-semibold"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Register Domain
                      </Button>
                    </div>
                  )}

                  {/* Transfer Option */}
                  {result.canTransfer && (
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 rounded-lg p-4 border border-blue-400/20">
                      <h5 className="font-semibold text-blue-400 mb-2">Domain Transfer</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-300">Base Price:</span>
                          <span className="text-white">${(result.transferPrice / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-300">Profit Margin:</span>
                          <span className="text-white">{result.profitMargin}%</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span className="text-blue-400">Your Price:</span>
                          <span className="text-white">${(result.finalTransferPrice / 100).toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOrderDomain(result, 'transfer')}
                        className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-black font-semibold"
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Transfer Domain
                      </Button>
                    </div>
                  )}
                </div>

                {!result.isAvailable && !result.canTransfer && (
                  <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 rounded-lg p-4 border border-gray-400/20">
                    <div className="text-center py-2">
                      <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400">This domain is not available for registration or transfer.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* No Results Message */}
      {searchPerformed && searchResults.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-8"
        >
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
          <p className="text-amber-200">
            We couldn't find any available options for the domain you searched. 
            Please try a different domain name.
          </p>
        </motion.div>
      )}

      {/* Information Card */}
      <Card className="bg-white/95 backdrop-blur-sm border-2 border-amber-400/50 shadow-xl">
        <CardHeader className="pb-4 bg-gradient-to-r from-amber-400 to-orange-400">
          <CardTitle className="text-white text-xl font-bold flex items-center">
            <Star className="mr-2 h-5 w-5" />
            How Premium Hosting Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-full w-10 h-10 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-lg">1</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-xl mb-2">Search & Select</h4>
              <p className="text-gray-700 text-lg leading-relaxed">Search for your desired domain and choose registration or transfer.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-full w-10 h-10 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-lg">2</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-xl mb-2">Order Review</h4>
              <p className="text-gray-700 text-lg leading-relaxed">Your order is manually reviewed by our team for quality assurance.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-full w-10 h-10 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-lg">3</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-xl mb-2">Hosting Setup</h4>
              <p className="text-gray-700 text-lg leading-relaxed">Once approved, we'll set up your hosting account and provide access details.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
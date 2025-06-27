import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface DomainSearchProps {
  onSuccess?: () => void;
}

export default function DomainSearch({ onSuccess }: DomainSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [lastSearched, setLastSearched] = useState("");
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: searchResult, isLoading: isSearching } = useQuery({
    queryKey: ["/api/hosting-accounts/search", lastSearched],
    enabled: !!lastSearched,
    retry: false,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (subdomain: string) => {
      const response = await apiRequest("POST", "/api/hosting-accounts", {
        subdomain,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your hosting account has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hosting-accounts"] });
      setSearchTerm("");
      setLastSearched("");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setLastSearched(searchTerm.trim());
  };

  const handleCreate = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a hosting account.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }
    createAccountMutation.mutate(searchTerm.trim());
  };

  const isAvailable = lastSearched && !searchResult && !isSearching;
  const isUnavailable = lastSearched && searchResult && !isSearching;

  return (
    <Card className="max-w-2xl mx-auto glass border-white/20">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Search Your Free Domain
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Enter your desired domain name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="bg-white text-dark placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent pr-32"
            />
            <span className="absolute right-3 top-3 text-gray-400 font-medium">
              .hostme.today
            </span>
          </div>
          <Button
            onClick={handleSearch}
            disabled={!searchTerm.trim() || isSearching}
            className="bg-accent hover:bg-green-600 text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {lastSearched && (
          <div className="mt-4">
            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span className="ml-2 text-white">Checking availability...</span>
              </div>
            )}

            {isAvailable && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-100">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">
                      {lastSearched}.hostme.today is available!
                    </span>
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={createAccountMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {createAccountMutation.isPending ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </div>
            )}

            {isUnavailable && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center text-red-100">
                  <XCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">
                    {lastSearched}.hostme.today is already taken
                  </span>
                </div>
                <div className="mt-2 text-sm text-red-200">
                  Created: {new Date(searchResult.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

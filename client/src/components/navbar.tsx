import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Server, Heart, LogOut, User, Settings, Home, Eye } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Navbar() {
  const { user, isAuthenticated, logoutMutation } = useAuth();
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Server className="text-primary text-2xl" />
              <span className="text-2xl font-bold text-dark">HostFarm.org</span>
              <span className="bg-accent text-white text-xs px-2 py-1 rounded-full font-medium">
                FREE
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/plugins" className={`transition-colors ${
              location === "/plugins" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-primary"
            }`}>
              Plugin Library
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/" className={`transition-colors ${
                  location === "/" 
                    ? "text-primary font-medium" 
                    : "text-gray-600 hover:text-primary"
                }`}>
                  Dashboard
                </Link>
                {user?.role === "admin" && (
                  <>
                    <Link href="/client" className={`transition-colors ${
                      location === "/client" 
                        ? "text-primary font-medium" 
                        : "text-gray-600 hover:text-primary"
                    }`}>
                      Client View
                    </Link>
                    <Link href="/admin/api-settings" className={`transition-colors ${
                      location === "/admin/api-settings" 
                        ? "text-primary font-medium" 
                        : "text-gray-600 hover:text-primary"
                    }`}>
                      API Settings
                    </Link>
                    <a 
                      href="/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary transition-colors flex items-center"
                    >
                      <Eye className="inline w-4 h-4 mr-1" />
                      View Site
                    </a>
                  </>
                )}
              </>
            )}
            <a href="#donate" className="text-gray-600 hover:text-primary transition-colors">
              <Heart className="inline w-4 h-4 mr-1" />
              Donate
            </a>
          </div>

          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link href="/auth">
                  <Button variant="ghost">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="bg-primary text-white hover:bg-secondary">
                    Get Started Free
                  </Button>
                </Link>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user?.profileImageUrl || ""} 
                        alt={user?.firstName || "User"} 
                      />
                      <AvatarFallback>
                        {user?.firstName?.[0] || user?.email?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs leading-none text-primary font-medium">
                      {user?.role === "admin" ? "Administrator" : "Client"}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/">
                      <a className="w-full flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => logoutMutation.mutate()}
                    className="text-red-600"
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

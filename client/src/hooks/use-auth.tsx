import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
  anonymousRegisterMutation: UseMutationResult<any, Error, void>;
  accountRecoveryMutation: UseMutationResult<any, Error, string>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = z.infer<typeof insertUserSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return null;
        }
        
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      } catch (error) {
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      // Force redirect after successful login
      setTimeout(() => {
        const pendingDomain = localStorage.getItem('pendingDomain');
        if (pendingDomain) {
          localStorage.removeItem('pendingDomain');
          window.location.href = '/?domain=' + pendingDomain;
        } else {
          window.location.href = '/';
        }
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Account created!",
        description: "Welcome to HostFarm! Your account has been created successfully.",
      });
      // Force redirect after successful registration
      setTimeout(() => {
        const pendingDomain = localStorage.getItem('pendingDomain');
        if (pendingDomain) {
          localStorage.removeItem('pendingDomain');
          window.location.href = '/?domain=' + pendingDomain;
        } else {
          window.location.href = '/';
        }
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const anonymousRegisterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/register-anonymous", {});
      return await res.json();
    },
    onSuccess: (response) => {
      // Set user data in cache
      queryClient.setQueryData(["/api/user"], {
        id: response.id,
        username: response.username,
        email: null,
        role: response.role,
        isAnonymous: response.isAnonymous,
        recoveryPhrase: response.recoveryPhrase
      });
      
      // Show credentials immediately with toast
      toast({
        title: "Account Created Successfully!",
        description: `Username: ${response.username} | Password: ${response.password}`,
        duration: 10000, // Show for 10 seconds
      });
      
      // Store credentials temporarily for display
      localStorage.setItem('tempCredentials', JSON.stringify({
        username: response.username,
        password: response.password,
        recoveryPhrase: response.recoveryPhrase,
        timestamp: Date.now()
      }));
      
      // Force redirect to dashboard after brief delay
      setTimeout(() => {
        const pendingDomain = localStorage.getItem('pendingDomain');
        if (pendingDomain) {
          localStorage.removeItem('pendingDomain');
          window.location.href = '/?domain=' + pendingDomain;
        } else {
          window.location.href = '/';
        }
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Anonymous registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const accountRecoveryMutation = useMutation({
    mutationFn: async (recoveryPhrase: string) => {
      const res = await apiRequest("POST", "/api/recover-account", { recoveryPhrase });
      return await res.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Account Recovered!",
        description: `Username: ${response.username}\nNew Password: ${response.newPassword}\nRecovery Phrase: ${response.recoveryPhrase}\n\nYour password has been reset for security.`,
        duration: 0, // Never auto-dismiss
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Account recovery failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      // Clear all cache to ensure fresh state
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      // Force a complete page reload to ensure clean state
      setTimeout(() => {
        window.location.replace("/");
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        anonymousRegisterMutation,
        accountRecoveryMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
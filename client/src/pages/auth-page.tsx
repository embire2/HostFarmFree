import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { insertUserSchema } from "@shared/schema"
import { z } from "zod"
import { Redirect, useLocation } from "wouter"
import { Loader2 } from "lucide-react"

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const recoverySchema = z.object({
  recoveryPhrase: z.string().min(1, "Recovery phrase is required"),
})

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>
type RecoveryFormData = z.infer<typeof recoverySchema>

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation, anonymousRegisterMutation, accountRecoveryMutation } = useAuth()
  const [activeTab, setActiveTab] = useState("anonymous")
  const [, setLocation] = useLocation()
  
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  })

  const recoveryForm = useForm<RecoveryFormData>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      recoveryPhrase: "",
    },
  })

  // Handle post-authentication redirect
  useEffect(() => {
    if (!isLoading && user) {
      // Check for pending domain from domain search
      const pendingDomain = localStorage.getItem('pendingDomain');
      if (pendingDomain) {
        localStorage.removeItem('pendingDomain');
        // Redirect back to home with domain info
        setLocation('/?domain=' + pendingDomain);
        return;
      }

      // Redirect based on user role - both admin and regular users go to home (/)
      // The Router in App.tsx will handle showing the appropriate dashboard
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  // Show loading while redirecting
  if (!isLoading && user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Redirecting...</span>
      </div>
    );
  }

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data)
  }

  const onRegister = (data: RegisterFormData) => {
    const { confirmPassword, ...userData } = data
    registerMutation.mutate(userData)
  }

  const onAnonymousRegister = () => {
    anonymousRegisterMutation.mutate()
  }

  const onRecovery = (data: RecoveryFormData) => {
    accountRecoveryMutation.mutate(data.recoveryPhrase)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Auth Form */}
        <div className="order-2 lg:order-1">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Welcome to HostFarm</CardTitle>
              <CardDescription>
                Free WordPress hosting with premium plugins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="anonymous">Anonymous</TabsTrigger>
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                  <TabsTrigger value="recovery">Recover</TabsTrigger>
                </TabsList>
                
                <TabsContent value="anonymous">
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold">Completely Anonymous Hosting</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        No personal information required. Get instant access with auto-generated credentials.
                      </p>
                    </div>
                    <Button 
                      onClick={onAnonymousRegister}
                      className="w-full" 
                      disabled={anonymousRegisterMutation.isPending}
                      size="lg"
                    >
                      {anonymousRegisterMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating anonymous account...
                        </>
                      ) : (
                        "Create Anonymous Account"
                      )}
                    </Button>
                    <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                      Your credentials will be displayed after creation. Save them securely!
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="John" 
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value || undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Doe" 
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value || undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="john@example.com" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="recovery">
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold">Recover Anonymous Account</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enter your recovery phrase to retrieve your account credentials.
                      </p>
                    </div>
                    <Form {...recoveryForm}>
                      <form onSubmit={recoveryForm.handleSubmit(onRecovery)} className="space-y-4">
                        <FormField
                          control={recoveryForm.control}
                          name="recoveryPhrase"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Recovery Phrase</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your recovery phrase" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={accountRecoveryMutation.isPending}
                        >
                          {accountRecoveryMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Recovering account...
                            </>
                          ) : (
                            "Recover Account"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Hero Section */}
        <div className="order-1 lg:order-2 text-center lg:text-left">
          <div className="max-w-lg mx-auto lg:mx-0">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              World's Only <span className="text-blue-600 dark:text-blue-400">Anonymous</span> Hosting
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              No personal information required! Get instant anonymous hosting with auto-generated credentials, free *.hostme.today domain, and premium plugins.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400">✓</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">100% Anonymous</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400">✓</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">No Personal Info</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">One-click WordPress</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Premium plugins</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
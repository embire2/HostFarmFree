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
  const [anonymousSuccess, setAnonymousSuccess] = useState<any>(null)
  
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

  // Handle post-authentication redirect and check for conversion return
  useEffect(() => {
    try {
      // Check if returning from conversion page with showCredentials parameter
      const urlParams = new URLSearchParams(window.location.search);
      const showCredentials = urlParams.get('showCredentials');
      
      if (showCredentials === 'true') {
        console.log("[Auth Page] Returning from conversion tracking, loading stored credentials");
        const storedCredentials = sessionStorage.getItem('anonymousCredentials');
        if (storedCredentials) {
          try {
            const credentials = JSON.parse(storedCredentials);
            console.log("[Auth Page] ✅ Retrieved stored credentials for display");
            setAnonymousSuccess(credentials);
            // Clean up stored credentials
            sessionStorage.removeItem('anonymousCredentials');
            // Clean URL
            window.history.replaceState({}, '', '/auth');
            return;
          } catch (parseError) {
            console.error("[Auth Page] ❌ Error parsing stored credentials:", parseError);
            sessionStorage.removeItem('anonymousCredentials');
          }
        } else {
          console.warn("[Auth Page] ⚠️ No stored credentials found after conversion tracking");
        }
      }

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
    } catch (error) {
      console.error("[Auth Page] ❌ Error in useEffect:", error);
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
    console.log("[Anonymous Registration] Starting anonymous account creation");
    anonymousRegisterMutation.mutate(undefined, {
      onSuccess: (response) => {
        try {
          console.log("[Anonymous Registration] ✅ Account created successfully:", {
            username: response.username,
            hasPassword: !!response.password,
            hasRecoveryPhrase: !!response.recoveryPhrase
          });
          
          // Store credentials temporarily for conversion tracking and success display
          const credentials = {
            username: response.username,
            password: response.password,
            recoveryPhrase: response.recoveryPhrase,
            message: response.message,
            timestamp: new Date().toISOString()
          };
          
          console.log("[Anonymous Registration] Storing credentials in sessionStorage for conversion tracking");
          sessionStorage.setItem('anonymousCredentials', JSON.stringify(credentials));
          
          // Redirect to conversion tracking page for 5 seconds, then back to auth page to show credentials
          const conversionUrl = `/conversion?type=anonymous&destination=${encodeURIComponent('/auth?showCredentials=true')}`;
          console.log(`[Anonymous Registration] Redirecting to conversion page: ${conversionUrl}`);
          setLocation(conversionUrl);
        } catch (error) {
          console.error("[Anonymous Registration] ❌ Error handling successful registration:", error);
          // Fallback to direct success display
          setAnonymousSuccess(response);
        }
      },
      onError: (error) => {
        console.error("[Anonymous Registration] ❌ Registration failed:", error);
      }
    })
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

  // Success screen for anonymous registration
  if (anonymousSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Anonymous Account Created!
              </h1>
              
              <p className="text-gray-600 dark:text-gray-300">
                Your anonymous hosting account is ready. <strong className="text-red-600 dark:text-red-400">SAVE THESE CREDENTIALS NOW</strong> - they cannot be recovered without your recovery phrase!
              </p>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Account Details</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Username:</span>
                    <span className="font-mono text-lg text-blue-600 dark:text-blue-400">{anonymousSuccess.username}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Password:</span>
                    <span className="font-mono text-lg text-blue-600 dark:text-blue-400">{anonymousSuccess.password}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                    <span className="font-medium text-red-700 dark:text-red-300">Recovery Phrase:</span>
                    <span className="font-mono text-lg text-red-600 dark:text-red-400">{anonymousSuccess.recoveryPhrase}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Important Backup Instructions</h3>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 text-left">
                  <li>• Copy these credentials to a secure password manager</li>
                  <li>• Write down the recovery phrase and store it safely</li>
                  <li>• The recovery phrase is your ONLY way to retrieve lost credentials</li>
                  <li>• HostFarm cannot recover your account without the recovery phrase</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    setAnonymousSuccess(null)
                    setLocation("/")
                  }} 
                  className="w-full"
                  size="lg"
                >
                  Continue to Dashboard
                </Button>
                
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Make sure you've saved your credentials before continuing!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
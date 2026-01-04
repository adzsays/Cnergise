import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { 
  CheckCircle, 
  Target, 
  Heart, 
  Wallet, 
  TrendingUp, 
  Smile, 
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Users,
  Calendar,
  Brain,
  Fingerprint,
  Loader2
} from "lucide-react";
import cnergiseLogo from "@/assets/cnergise-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signup");
  
  // MFA state
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string>("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);
  
  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    // Check if biometric login is available
    const storedCredential = localStorage.getItem("cnergise_biometric_credential");
    const isSupported = window.PublicKeyCredential !== undefined;
    setBiometricAvailable(isSupported && !!storedCredential);
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
      
      toast.success("Account created! You can now sign in.");
      navigate("/home");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Check if MFA is required
      if (data.session === null && data.user) {
        // MFA required - get factors
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        if (factorsData?.totp && factorsData.totp.length > 0) {
          setMfaFactorId(factorsData.totp[0].id);
          setShowMFAVerification(true);
          setIsLoading(false);
          return;
        }
      }
      
      toast.success("Signed in successfully!");
      navigate("/home");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAVerification = async () => {
    if (mfaCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setMfaVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });

      if (verifyError) throw verifyError;

      toast.success("Signed in successfully!");
      setShowMFAVerification(false);
      setShowAuthModal(false);
      navigate("/home");
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setMfaVerifying(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      const storedCredentialId = localStorage.getItem("cnergise_biometric_credential");
      const storedUserId = localStorage.getItem("cnergise_biometric_user");
      
      if (!storedCredentialId || !storedUserId) {
        throw new Error("No biometric credentials found");
      }

      // Generate challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [{
          id: Uint8Array.from(atob(storedCredentialId.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
          type: "public-key",
          transports: ["internal"],
        }],
        userVerification: "required",
        timeout: 60000,
      };

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      if (credential) {
        // Biometric verification successful - check if there's a valid session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          toast.success("Welcome back!");
          navigate("/home");
        } else {
          // Session expired, need to re-authenticate with password
          toast.info("Session expired. Please sign in with your password.");
          setShowAuthModal(true);
          setAuthTab("signin");
        }
      }
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        toast.error("Biometric authentication was cancelled");
      } else {
        toast.error("Biometric login failed. Please use password.");
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  const features = [
    {
      icon: CheckCircle,
      title: "Smart Task Management",
      description: "AI-powered task prioritization that learns your habits and optimizes your daily workflow.",
      color: "text-primary"
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set meaningful goals and track progress with intelligent milestones and reminders.",
      color: "text-accent"
    },
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Monitor your physical and mental well-being with integrated health tracking.",
      color: "text-health"
    },
    {
      icon: Wallet,
      title: "Financial Overview",
      description: "Complete visibility into your finances with budgets, expenses, and cash flow analysis.",
      color: "text-finance"
    },
    {
      icon: TrendingUp,
      title: "Investment Portfolio",
      description: "Track and manage your investments with real-time market insights and analytics.",
      color: "text-income"
    },
    {
      icon: Smile,
      title: "Life Balance",
      description: "Achieve harmony across all areas of life with our holistic approach to personal management.",
      color: "text-primary"
    }
  ];

  const benefits = [
    { icon: Zap, text: "Save 10+ hours weekly" },
    { icon: Shield, text: "Bank-level security" },
    { icon: Brain, text: "AI-powered insights" },
    { icon: Users, text: "Team collaboration" }
  ];

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-1">
              <img src={cnergiseLogo} alt="Cnergise" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold text-foreground">Cnergise</span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => { setAuthTab("signin"); setShowAuthModal(true); }}
              >
                Sign In
              </Button>
              <Button 
                onClick={() => { setAuthTab("signup"); setShowAuthModal(true); }}
                className="bg-primary hover:bg-primary/90"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Life Management
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Simplify Your Life,
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Amplify Your Potential
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Cnergise brings together tasks, goals, health, finances, and investments in one intelligent platform. 
            Let AI handle the complexity while you focus on what matters most.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button 
              size="lg" 
              onClick={() => { setAuthTab("signup"); setShowAuthModal(true); }}
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-6"
            >
              Start Free Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
            >
              Watch Demo
            </Button>
          </div>

          {/* Biometric Login Option */}
          {biometricAvailable && (
            <div className="mb-8">
              <Button
                size="lg"
                variant="secondary"
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
                className="gap-2"
              >
                {biometricLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Fingerprint className="w-5 h-5" />
                )}
                Sign in with Biometrics
              </Button>
            </div>
          )}
          
          {/* Quick Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <benefit.icon className="w-4 h-4 text-primary" />
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need, One Place
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stop juggling multiple apps. Cnergise integrates all aspects of your personal and professional life.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                <Brain className="w-4 h-4" />
                Powered by AI
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Your Personal AI Assistant
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our AI learns your patterns, anticipates your needs, and proactively suggests optimizations. 
                From scheduling meetings to tracking expenses, let intelligence work for you.
              </p>
              <ul className="space-y-4">
                {[
                  "Smart task prioritization based on your habits",
                  "Automated expense categorization",
                  "Personalized goal recommendations",
                  "Predictive scheduling & reminders"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 rounded-3xl flex items-center justify-center">
                <div className="absolute inset-4 bg-card rounded-2xl shadow-xl border border-border/50 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm">3 meetings optimized for focus time</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Wallet className="w-5 h-5 text-finance" />
                      <span className="text-sm">$340 saved this month vs. budget</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Target className="w-5 h-5 text-accent" />
                      <span className="text-sm">Fitness goal 78% complete</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">AI: Consider moving gym to mornings for better energy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Life?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands who have simplified their daily routines and achieved more with less stress.
          </p>
          <Button 
            size="lg" 
            onClick={() => { setAuthTab("signup"); setShowAuthModal(true); }}
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-6"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={cnergiseLogo} alt="Cnergise" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-foreground">Cnergise</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Cnergise. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          />
          <Card className="relative w-full max-w-md z-10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">
                {authTab === "signin" ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription>
                {authTab === "signin" 
                  ? "Sign in to access your life dashboard" 
                  : "Start your journey to a more organized life"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showMFAVerification ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={mfaCode}
                      onChange={setMfaCode}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    onClick={handleMFAVerification}
                    disabled={mfaVerifying || mfaCode.length !== 6}
                    className="w-full"
                  >
                    {mfaVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowMFAVerification(false);
                      setMfaCode("");
                    }}
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as "signin" | "signup")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                      
                      {biometricAvailable && (
                        <>
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-card px-2 text-muted-foreground">Or</span>
                            </div>
                          </div>
                          
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBiometricLogin}
                            disabled={biometricLoading}
                            className="w-full"
                          >
                            {biometricLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Fingerprint className="mr-2 h-4 w-4" />
                            )}
                            Use Biometrics
                          </Button>
                        </>
                      )}
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 6 characters
                        </p>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Auth;

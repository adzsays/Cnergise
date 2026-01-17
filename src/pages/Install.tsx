import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { 
  Smartphone, 
  Zap, 
  WifiOff, 
  Download, 
  Share, 
  MoreVertical,
  PlusSquare,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import cnergiseLogo from "@/assets/cnergise-logo.png";

const Install = () => {
  const { 
    canPrompt, 
    promptInstall, 
    isInstalled, 
    isIOS, 
    isAndroid,
    isStandalone 
  } = useInstallPrompt();

  const benefits = [
    {
      icon: Zap,
      title: "Instant Access",
      description: "Launch Cnergise directly from your home screen with one tap"
    },
    {
      icon: WifiOff,
      title: "Works Offline",
      description: "Access your dashboard even without an internet connection"
    },
    {
      icon: Smartphone,
      title: "Native Feel",
      description: "Full-screen experience without browser UI getting in the way"
    }
  ];

  const handleInstallClick = async () => {
    if (canPrompt) {
      await promptInstall();
    }
  };

  // If already installed and running as standalone, show success state
  if (isStandalone) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 pt-[env(safe-area-inset-top)]">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">You're All Set!</h1>
          <p className="text-muted-foreground">
            Cnergise is installed and running as an app on your device.
          </p>
          <Link to="/">
            <Button className="w-full">
              Continue to Cnergise
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pt-[env(safe-area-inset-top)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <img src={cnergiseLogo} alt="Cnergise" className="w-8 h-8" />
            <span className="font-semibold text-foreground">Install Cnergise</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center shadow-lg">
            <img src={cnergiseLogo} alt="Cnergise" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Install Cnergise
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Add Cnergise to your home screen for the best experience — quick access, offline support, and a native app feel.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid gap-4">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="border-border/50">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Install Button or Instructions */}
        {isInstalled ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Already Installed!</h2>
            <p className="text-muted-foreground">
              Look for the Cnergise icon on your home screen.
            </p>
            <Link to="/">
              <Button variant="outline" className="mt-4">
                Back to Cnergise
              </Button>
            </Link>
          </div>
        ) : canPrompt ? (
          <div className="space-y-4">
            <Button 
              onClick={handleInstallClick} 
              className="w-full h-12 text-lg gap-2"
            >
              <Download className="w-5 h-5" />
              Install Now
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Free • No app store required
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {isIOS ? (
              /* iOS Instructions */
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Install on iPhone/iPad
                  </h2>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        1
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">Tap the</span>
                        <Share className="w-5 h-5 text-primary" />
                        <span className="text-foreground font-medium">Share</span>
                        <span className="text-foreground">button</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        2
                      </span>
                      <span className="text-foreground">Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        3
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">Tap</span>
                        <PlusSquare className="w-5 h-5 text-primary" />
                        <span className="text-foreground font-medium">Add</span>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            ) : isAndroid ? (
              /* Android Instructions */
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Install on Android
                  </h2>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        1
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">Tap the</span>
                        <MoreVertical className="w-5 h-5 text-primary" />
                        <span className="text-foreground font-medium">Menu</span>
                        <span className="text-foreground">button</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        2
                      </span>
                      <span className="text-foreground">Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                        3
                      </span>
                      <span className="text-foreground">Tap <strong>Install</strong> to confirm</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            ) : (
              /* Desktop/Other Instructions */
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Install on Desktop
                  </h2>
                  <p className="text-muted-foreground">
                    Look for the install icon <Download className="w-4 h-4 inline mx-1" /> in your browser's address bar, or access it through the browser menu.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Footer Link */}
        <div className="text-center pt-4">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Continue without installing →
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Install;

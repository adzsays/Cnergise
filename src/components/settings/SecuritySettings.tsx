import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, Smartphone, Fingerprint, QrCode, CheckCircle, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
}

export function SecuritySettings() {
  const [mfaFactors, setMfaFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  
  // Biometric state
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricEnrolling, setBiometricEnrolling] = useState(false);

  useEffect(() => {
    fetchMFAFactors();
    checkBiometricSupport();
  }, []);

  const fetchMFAFactors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const allFactors = [...(data.totp || []), ...(data.phone || [])];
      setMfaFactors(allFactors);
    } catch (error) {
      console.error("Error fetching MFA factors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBiometricSupport = () => {
    const isSupported = 
      window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential === "function";
    setBiometricSupported(isSupported);
    
    // Check if biometric is already set up (stored credential ID)
    const storedCredential = localStorage.getItem("cnergise_biometric_credential");
    setBiometricEnabled(!!storedCredential);
  };

  const startTOTPEnrollment = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setShowEnrollDialog(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to start 2FA enrollment");
    } finally {
      setEnrolling(false);
    }
  };

  const verifyAndEnableTOTP = async () => {
    if (verifyCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      toast.success("Two-factor authentication enabled successfully!");
      setShowEnrollDialog(false);
      setVerifyCode("");
      fetchMFAFactors();
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setVerifying(false);
    }
  };

  const unenrollFactor = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      
      toast.success("2FA method removed successfully");
      fetchMFAFactors();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove 2FA method");
    }
  };

  const enrollBiometric = async () => {
    if (!biometricSupported) {
      toast.error("Biometric authentication is not supported on this device");
      return;
    }

    setBiometricEnrolling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Generate a challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "Cnergise",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(user.id),
          name: user.email || "user",
          displayName: user.email || "User",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (credential) {
        // Store credential ID for future authentication
        localStorage.setItem("cnergise_biometric_credential", credential.id);
        localStorage.setItem("cnergise_biometric_user", user.id);
        setBiometricEnabled(true);
        toast.success("Biometric login enabled successfully!");
      }
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        toast.error("Biometric authentication was cancelled or not allowed");
      } else if (error.name === "NotSupportedError") {
        toast.error("Biometric authentication is not supported on this device");
      } else {
        toast.error(error.message || "Failed to enable biometric login");
      }
    } finally {
      setBiometricEnrolling(false);
    }
  };

  const disableBiometric = () => {
    localStorage.removeItem("cnergise_biometric_credential");
    localStorage.removeItem("cnergise_biometric_user");
    setBiometricEnabled(false);
    toast.success("Biometric login disabled");
  };

  const verifiedFactors = mfaFactors.filter(f => f.status === "verified");
  const has2FAEnabled = verifiedFactors.length > 0;

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card className="bg-card border border-border rounded-md shadow-card">
        <CardHeader className="px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base font-medium">Security Overview</CardTitle>
              <CardDescription className="text-sm">
                Manage your account security settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-6 md:px-6">
          <div className="flex items-center gap-4">
            {has2FAEnabled ? (
              <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                2FA Enabled
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                <AlertTriangle className="h-3 w-3 mr-1" />
                2FA Not Enabled
              </Badge>
            )}
            {biometricEnabled && (
              <Badge variant="default" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                <Fingerprint className="h-3 w-3 mr-1" />
                Biometric Active
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="bg-card border border-border rounded-md shadow-card">
        <CardHeader className="px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base font-medium">Two-Factor Authentication</CardTitle>
              <CardDescription className="text-sm">
                Add an extra layer of security with authenticator apps
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-6 md:px-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading security settings...
            </div>
          ) : (
            <>
              {verifiedFactors.length > 0 ? (
                <div className="space-y-3">
                  {verifiedFactors.map((factor) => (
                    <div
                      key={factor.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {factor.friendly_name || "Authenticator App"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Added {new Date(factor.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unenrollFactor(factor.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Two-factor authentication is not enabled. Enable it to add an extra layer of security to your account.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={startTOTPEnrollment}
                disabled={enrolling}
                variant={has2FAEnabled ? "outline" : "default"}
                className="w-full"
              >
                {enrolling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : has2FAEnabled ? (
                  "Add Another Authenticator"
                ) : (
                  "Enable Two-Factor Authentication"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Biometric Login */}
      <Card className="bg-card border border-border rounded-md shadow-card">
        <CardHeader className="px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Fingerprint className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base font-medium">Biometric Login</CardTitle>
              <CardDescription className="text-sm">
                Use fingerprint or Face ID for quick sign-in
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-6 md:px-6 space-y-4">
          {!biometricSupported ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Biometric authentication is not supported on this device or browser.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable Biometric Login</p>
                  <p className="text-xs text-muted-foreground">
                    Sign in quickly using your device's biometric sensor
                  </p>
                </div>
                <Switch
                  checked={biometricEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      enrollBiometric();
                    } else {
                      disableBiometric();
                    }
                  }}
                  disabled={biometricEnrolling}
                />
              </div>

              {biometricEnabled && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Biometric login is active</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can use your fingerprint or face to sign in on the login page.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 2FA Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg">
                {qrCode && (
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                )}
              </div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Or enter this code manually:
              </Label>
              <div className="p-2 bg-muted rounded font-mono text-sm break-all text-center">
                {secret}
              </div>
            </div>

            {/* Verification Code Input */}
            <div className="space-y-3">
              <Label>Enter the 6-digit code from your app:</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verifyCode}
                  onChange={setVerifyCode}
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
            </div>

            <Button
              onClick={verifyAndEnableTOTP}
              disabled={verifying || verifyCode.length !== 6}
              className="w-full"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify and Enable 2FA"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

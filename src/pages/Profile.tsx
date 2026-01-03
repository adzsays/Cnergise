import { useState, useRef, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationSettings } from "@/components/settings/IntegrationSettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { Upload, Save, User, Key, CreditCard, ShieldCheck } from "lucide-react";
import { SkeletonCard } from "@/components/ui/DashboardWidget";

export default function Profile() {
  const { profile, roles, isLoading, updateProfile, uploadAvatar } = useProfile();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate({ name, bio });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar.mutate(file);
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarRail />

        <SidebarInset>
          <div className="flex h-full flex-col">
            <TopBar title="Settings" />

            <div className="flex-1 overflow-auto p-4 md:p-6">
              <div className="max-w-3xl mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-muted/50 mb-6">
                    <TabsTrigger value="profile" className="text-sm">
                      <User className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Profile</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="text-sm">
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Security</span>
                    </TabsTrigger>
                    <TabsTrigger value="subscriptions" className="text-sm">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Subscriptions</span>
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="text-sm">
                      <Key className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">API Connections</span>
                    </TabsTrigger>
                  </TabsList>

                  {isLoading ? (
                    <SkeletonCard lines={6} />
                  ) : (
                    <>
                      <TabsContent value="profile" className="mt-0">
                        <Card className="bg-card border border-border rounded-md shadow-card">
                          <CardHeader className="px-4 py-4 md:px-6">
                            <CardTitle className="text-base font-medium">Profile Information</CardTitle>
                            <CardDescription className="text-sm">Update your profile details and avatar</CardDescription>
                          </CardHeader>
                          <CardContent className="px-4 pb-6 md:px-6 space-y-6">
                            <div className="flex items-center gap-6">
                              <Avatar className="h-20 w-20 border-2 border-border">
                                <AvatarImage src={profile?.avatar_url || ""} />
                                <AvatarFallback className="text-xl bg-muted">
                                  {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploadAvatar.isPending}
                                  className="h-9"
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  {uploadAvatar.isPending ? "Uploading..." : "Upload Avatar"}
                                </Button>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleAvatarUpload}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                  JPG, PNG or WEBP. Max 5MB.
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="name" className="text-sm">Name</Label>
                              <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                className="h-10"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="bio" className="text-sm">Bio</Label>
                              <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself"
                                rows={4}
                              />
                            </div>

                            {roles && roles.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-sm">Roles</Label>
                                <div className="flex gap-2">
                                  {roles.map((role) => (
                                    <Badge key={role.id} variant="secondary" className="text-xs">
                                      {role.role}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <Button
                              onClick={handleSave}
                              disabled={updateProfile.isPending}
                              className="w-full h-10"
                            >
                              <Save className="mr-2 h-4 w-4" />
                              {updateProfile.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="security" className="mt-0">
                        <SecuritySettings />
                      </TabsContent>

                      <TabsContent value="subscriptions" className="mt-0">
                        <SubscriptionSettings />
                      </TabsContent>

                      <TabsContent value="integrations" className="mt-0">
                        <IntegrationSettings />
                      </TabsContent>
                    </>
                  )}
                </Tabs>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAllProfiles } from "@/hooks/useProfile";
import { format } from "date-fns";

export default function Users() {
  const { data: profiles, isLoading } = useAllProfiles();

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <div className="flex-1 p-3 sm:p-6 md:p-8">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex-1 p-3 sm:p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">User Directory</h1>
              <p className="text-muted-foreground mt-2">Browse all users in the system</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles?.map((profile: any) => (
                <Card key={profile.id}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback>
                          {profile.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">{profile.name || "Unnamed User"}</CardTitle>
                        <CardDescription className="text-xs">
                          Joined {format(new Date(profile.created_at), "MMM yyyy")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {profile.bio}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {profile.user_roles?.map((role: any) => (
                        <Badge key={role.id} variant="secondary">
                          {role.role}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

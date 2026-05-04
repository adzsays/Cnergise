import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAllProfiles, useUserRoleManagement } from "@/hooks/useProfile";
import { format } from "date-fns";
import { useState } from "react";
import { Shield, UserMinus } from "lucide-react";
import { AllowlistManager } from "@/components/admin/AllowlistManager";
import { ApprovalQueue } from "@/components/admin/ApprovalQueue";
import { InviteRequestsManager } from "@/components/admin/InviteRequestsManager";
import { VisitorChatManager } from "@/components/admin/VisitorChatManager";

export default function Admin() {
  const { data: profiles, isLoading } = useAllProfiles();
  const { assignRole, removeRole } = useUserRoleManagement();
  const [selectedRole, setSelectedRole] = useState<Record<string, string>>({});

  const handleAssignRole = (userId: string) => {
    const role = selectedRole[userId];
    if (role) {
      assignRole.mutate({ userId, role: role as 'admin' | 'moderator' | 'user' });
    }
  };

  const handleRemoveRole = (userId: string, role: 'admin' | 'moderator' | 'user') => {
    removeRole.mutate({ userId, role });
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <div className="flex-1 p-8">
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
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">Manage users and their roles</p>
            </div>

            <InviteRequestsManager />

            <VisitorChatManager />

            <AllowlistManager />

            <ApprovalQueue />

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Bio</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles?.map((profile: any) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={profile.avatar_url || ""} />
                              <AvatarFallback>
                                {profile.name?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{profile.name || "Unnamed User"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {profile.bio || "No bio"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {profile.user_roles?.map((role: any) => (
                              <div key={role.id} className="flex items-center gap-1">
                                <Badge variant="secondary">{role.role}</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleRemoveRole(profile.id, role.role)}
                                >
                                  <UserMinus className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(profile.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={selectedRole[profile.id] || ""}
                              onValueChange={(value) =>
                                setSelectedRole({ ...selectedRole, [profile.id]: value })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Add role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => handleAssignRole(profile.id)}
                              disabled={!selectedRole[profile.id]}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

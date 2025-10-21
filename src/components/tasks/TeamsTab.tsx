import React, { useState } from "react";
import { useTeams, useTeamMembers } from "@/hooks/useTeams";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Trash2, Edit, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TeamsTab() {
  const { teams, isLoading, createTeam, updateTeam, deleteTeam } = useTeams();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const { teamMembers, addTeamMember, deleteTeamMember } = useTeamMembers(selectedTeam || undefined);
  
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  
  const [teamFormData, setTeamFormData] = useState({
    name: "",
    description: "",
  });

  const [memberFormData, setMemberFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTeam) {
      await updateTeam.mutateAsync({ id: editingTeam.id, ...teamFormData });
      setEditingTeam(null);
    } else {
      const result = await createTeam.mutateAsync(teamFormData);
      if (result) {
        setSelectedTeam(result.id);
      }
    }
    
    setTeamFormData({ name: "", description: "" });
    setIsCreateTeamDialogOpen(false);
  };

  const handleEditTeam = (team: any) => {
    setEditingTeam(team);
    setTeamFormData({
      name: team.name,
      description: team.description || "",
    });
    setIsCreateTeamDialogOpen(true);
  };

  const handleDeleteTeam = async (id: string) => {
    if (confirm("Are you sure you want to delete this team?")) {
      await deleteTeam.mutateAsync(id);
      if (selectedTeam === id) {
        setSelectedTeam(null);
      }
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeam) return;

    const { data: { user } } = await (await import("@/integrations/supabase/client")).supabase.auth.getUser();
    if (!user) return;

    await addTeamMember.mutateAsync({
      team_id: selectedTeam,
      user_id: user.id,
      name: memberFormData.name,
      email: memberFormData.email || null,
      role: memberFormData.role || null,
    });
    
    setMemberFormData({ name: "", email: "", role: "" });
    setIsAddMemberDialogOpen(false);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (confirm("Are you sure you want to remove this team member?")) {
      await deleteTeamMember.mutateAsync(memberId);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading teams...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Teams List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Teams</h2>
          <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { setEditingTeam(null); setTeamFormData({ name: "", description: "" }); }}>
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTeam ? "Edit Team" : "Create New Team"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTeamSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    value={teamFormData.name}
                    onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="team-description">Description</Label>
                  <Textarea
                    id="team-description"
                    value={teamFormData.description}
                    onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingTeam ? "Update Team" : "Create Team"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {teams.length === 0 ? (
          <Card className="p-4 text-center text-sm text-muted-foreground">
            No teams yet
          </Card>
        ) : (
          <div className="space-y-2">
            {teams.map((team) => (
              <Card
                key={team.id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedTeam === team.id ? "border-primary bg-accent" : ""
                }`}
                onClick={() => setSelectedTeam(team.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{team.name}</h3>
                    {team.description && (
                      <p className="text-xs text-muted-foreground truncate">{team.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleEditTeam(team); }}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id); }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Team Members */}
      <div className="lg:col-span-2 space-y-4">
        {selectedTeam ? (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Team Members</h2>
              <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setMemberFormData({ name: "", email: "", role: "" })}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleMemberSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="member-name">Name</Label>
                      <Input
                        id="member-name"
                        value={memberFormData.name}
                        onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="member-email">Email</Label>
                      <Input
                        id="member-email"
                        type="email"
                        value={memberFormData.email}
                        onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="member-role">Role</Label>
                      <Input
                        id="member-role"
                        value={memberFormData.role}
                        onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value })}
                        placeholder="e.g., Developer, Designer"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Add Member
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {teamMembers.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No team members yet. Add your first member!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamMembers.map((member) => (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{member.name}</h3>
                        {member.email && (
                          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                        )}
                        {member.role && (
                          <Badge variant="secondary" className="mt-2">{member.role}</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMember(member.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <Card className="p-8 text-center h-full flex items-center justify-center">
            <p className="text-muted-foreground">Select a team to view and manage members</p>
          </Card>
        )}
      </div>
    </div>
  );
}
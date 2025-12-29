import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  LayoutDashboard,
  CheckSquare,
  Calendar,
  DollarSign,
  Target,
  Heart,
  Briefcase,
  Mail,
  PlusCircle,
  User,
  Share2,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCircle,
  MessageSquare,
  Settings,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSpaces } from "@/hooks/useSpaces";
import { toast } from "sonner";

const sidebarItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: Mail, label: "Mail", href: "/mail" },
  { icon: DollarSign, label: "Finances", href: "/finances" },
  { icon: Share2, label: "Social Media", href: "/social" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Heart, label: "Health", href: "/health" },
  { icon: Briefcase, label: "Portfolio", href: "/portfolio" },
  { icon: Users, label: "Teams", href: "/teams" },
  { icon: UserCircle, label: "Contacts", href: "/contacts" },
  { icon: MessageSquare, label: "Chat", href: "/chat" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: BarChart3, label: "Monitoring", href: "/monitoring" },
];

export function AppSidebar() {
  const location = useLocation();
  const { spaces, isLoading, createSpace } = useSpaces();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSpace.mutateAsync(formData);
      setFormData({ name: "", description: "", color: "#3b82f6" });
      setIsCreateDialogOpen(false);
      toast.success("Space created successfully");
    } catch (error) {
      toast.error("Failed to create space");
    }
  };
  
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white shrink-0">
              <span className="font-semibold">T</span>
            </div>
            {!isCollapsed && <span className="font-medium text-lg">Taskfinity</span>}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="h-7 w-7 shrink-0"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    isActive={location.pathname === item.href}
                    tooltip={item.label}
                    asChild
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Spaces</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex items-center justify-between px-2 py-1 mb-2">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground">
                      <PlusCircle className="mr-2 h-3 w-3" />
                      Create Space
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Space</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSpace} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="color">Color</Label>
                        <Input
                          id="color"
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        />
                      </div>
                      <Button type="submit" className="w-full">Create Space</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              {isLoading ? (
                <div className="px-2 text-xs text-muted-foreground">Loading spaces...</div>
              ) : spaces && spaces.length > 0 ? (
                <SidebarMenu>
                  {spaces.map((space) => (
                    <SidebarMenuItem key={space.id}>
                      <SidebarMenuButton tooltip={space.name}>
                        <div 
                          className="flex h-5 w-5 items-center justify-center rounded text-white text-xs font-semibold shrink-0"
                          style={{ backgroundColor: space.color || "#3b82f6" }}
                        >
                          {space.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{space.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              ) : (
                <div className="px-2 text-xs text-muted-foreground">No spaces yet</div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      
      <SidebarFooter>
        <div className="flex items-center gap-2 p-2">
          <Button variant="ghost" size="sm" className={isCollapsed ? "w-full justify-center p-2" : "w-full justify-start"}>
            <User className={isCollapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
            {!isCollapsed && <span>Invite</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}


import React from "react";
import { CustomCard } from "@/components/ui/CustomCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MoreHorizontal,
  Users,
  DollarSign,
  TrendingUp,
  Paperclip,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export function Dashboard() {
  // Mock statistics data (now with smaller display)
  const statsData = [
    {
      title: "Total Tasks",
      value: "24",
      icon: CheckCircle2,
      change: "+5",
      color: "bg-blue-500",
    },
    {
      title: "Upcoming Meetings",
      value: "7",
      icon: Calendar,
      change: "+2",
      color: "bg-purple-500",
    },
    {
      title: "Unread Emails",
      value: "12",
      icon: Mail,
      change: "-3",
      color: "bg-orange-500",
    },
    {
      title: "Team Members",
      value: "8",
      icon: Users,
      change: "0",
      color: "bg-green-500",
    },
  ];

  // Mock project data with tasks, costs, and potential
  const projectsData = [
    {
      id: 1,
      name: "Website Redesign",
      progress: 65,
      tasks: 12,
      completedTasks: 8,
      cost: "$6,500",
      potential: "$15,000",
      priority: "high",
    },
    {
      id: 2,
      name: "Mobile App Development",
      progress: 30,
      tasks: 18,
      completedTasks: 5,
      cost: "$12,000",
      potential: "$45,000",
      priority: "medium",
    },
    {
      id: 3,
      name: "Marketing Campaign",
      progress: 80,
      tasks: 8,
      completedTasks: 6,
      cost: "$4,200",
      potential: "$9,500",
      priority: "low",
    },
  ];

  // Mock tasks data
  const tasksData = [
    {
      id: 1,
      title: "Finalize homepage wireframes",
      project: "Website Redesign",
      dueDate: "Today",
      priority: "high",
    },
    {
      id: 2,
      title: "Review API documentation",
      project: "Mobile App Development",
      dueDate: "Tomorrow",
      priority: "medium",
    },
    {
      id: 3,
      title: "Create social media assets",
      project: "Marketing Campaign",
      dueDate: "Aug 25",
      priority: "medium",
    },
    {
      id: 4,
      title: "Update project timeline",
      project: "Website Redesign",
      dueDate: "Aug 23",
      priority: "high",
    },
  ];

  // Mock emails data
  const emailsData = [
    {
      id: 1,
      sender: "Sarah Johnson",
      subject: "Project kickoff meeting notes",
      preview: "Hey team, I've attached the notes from our kickoff meeting yesterday...",
      time: "10:32 AM",
      read: false,
    },
    {
      id: 2,
      sender: "Mike Peterson",
      subject: "Invoice #3245 for Website Redesign",
      preview: "Please find attached the invoice for the first phase of the website...",
      time: "Yesterday",
      read: true,
    },
    {
      id: 3,
      sender: "Client Review Team",
      subject: "Feedback on marketing materials",
      preview: "We've reviewed the materials and have a few suggestions for improvements...",
      time: "Aug 21",
      read: true,
    },
  ];

  // Mock activities data
  const activities = [
    {
      id: 1,
      user: "You",
      action: "completed task",
      subject: "Update project timeline",
      time: "5 minutes ago",
    },
    {
      id: 2,
      user: "Sarah",
      action: "commented on",
      subject: "Client presentation deck",
      time: "1 hour ago",
    },
    {
      id: 3,
      user: "John",
      action: "assigned you to",
      subject: "Review marketing materials",
      time: "3 hours ago",
    },
    {
      id: 4,
      user: "Finance app",
      action: "updated",
      subject: "Monthly budget overview",
      time: "Yesterday, 5:30 PM",
    },
  ];

  // Mock upcoming events
  const upcomingEvents = [
    {
      id: 1,
      title: "Team Weekly Sync",
      time: "Today, 10:00 AM",
      duration: "1 hour",
      participants: 8,
    },
    {
      id: 2,
      title: "Client Presentation: Project Phase 2",
      time: "Tomorrow, 2:00 PM",
      duration: "45 minutes",
      participants: 5,
    },
    {
      id: 3,
      title: "Budget Review Meeting",
      time: "Friday, 11:30 AM",
      duration: "30 minutes",
      participants: 3,
    },
  ];

  const priorityColors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Stats Cards - Now Smaller */}
      <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <CustomCard key={index} className="p-0 overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <h3 className="text-lg font-bold mt-0.5">{stat.value}</h3>
                </div>
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-white",
                    stat.color
                  )}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-center mt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    stat.change.startsWith("+")
                      ? "text-green-600 dark:text-green-400"
                      : stat.change.startsWith("-")
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                  )}
                >
                  {stat.change !== "0" ? stat.change : "No change"}
                </Badge>
                <p className="text-xs text-muted-foreground ml-2">vs last week</p>
              </div>
            </div>
            <div className="h-1 w-full bg-muted overflow-hidden">
              <div
                className={cn("h-full", stat.color)}
                style={{ width: `${Math.random() * 50 + 50}%` }}
              ></div>
            </div>
          </CustomCard>
        ))}
      </div>

      {/* Projects Section */}
      <div className="md:col-span-3">
        <CustomCard title="Active Projects" className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Potential</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectsData.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="h-2 w-20" />
                        <span className="text-xs">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{project.completedTasks}/{project.tasks}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {project.cost}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-accent" />
                        {project.potential}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs whitespace-nowrap",
                          priorityColors[project.priority as keyof typeof priorityColors]
                        )}
                      >
                        {project.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CustomCard>
      </div>

      {/* Main Content Column */}
      <div className="md:col-span-2 space-y-6">
        {/* Tasks Section */}
        <CustomCard title="Recent Tasks">
          <div className="space-y-3">
            {tasksData.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-lg border flex items-start gap-3"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{task.title}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Paperclip className="h-3 w-3 mr-1" />
                    {task.project}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {task.dueDate}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        priorityColors[task.priority as keyof typeof priorityColors]
                      )}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Tasks
          </Button>
        </CustomCard>

        {/* Emails Section */}
        <CustomCard title="Recent Emails">
          <div className="space-y-3">
            {emailsData.map((email) => (
              <div
                key={email.id}
                className={cn(
                  "p-3 rounded-lg border flex items-start gap-3",
                  !email.read && "bg-primary/5"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://ui-avatars.com/api/?name=${email.sender.replace(" ", "+")}`} />
                  <AvatarFallback>{email.sender.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn("font-medium", !email.read && "font-semibold")}>
                      {email.sender}
                    </p>
                    <p className="text-xs text-muted-foreground">{email.time}</p>
                  </div>
                  <p className="text-sm font-medium mt-0.5 truncate">{email.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {email.preview}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Emails
          </Button>
        </CustomCard>

        {/* Activity Feed */}
        <CustomCard title="Recent Activity">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{" "}
                    {activity.action}{" "}
                    <span className="font-medium">{activity.subject}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.time}
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Activity
          </Button>
        </CustomCard>
      </div>

      {/* Sidebar Column */}
      <div className="space-y-6">
        {/* Upcoming Events */}
        <CustomCard title="Upcoming Events">
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg border flex items-start gap-3"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{event.title}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {event.time} · {event.duration}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    {event.participants} participants
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CustomCard>

        {/* Monthly Goals */}
        <CustomCard title="Monthly Goals">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium">Complete Project Milestones</p>
                  <p className="text-xs text-muted-foreground">
                    8/12 milestones completed
                  </p>
                </div>
                <Badge>67%</Badge>
              </div>
              <Progress value={67} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium">Financial Target</p>
                  <p className="text-xs text-muted-foreground">
                    $8,540 / $10,000 saved
                  </p>
                </div>
                <Badge>85%</Badge>
              </div>
              <Progress value={85} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium">Health & Wellness</p>
                  <p className="text-xs text-muted-foreground">
                    15/20 workout sessions
                  </p>
                </div>
                <Badge>75%</Badge>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </div>
        </CustomCard>

        {/* App Overview */}
        <CustomCard title="App Overview" className="hidden sm:block">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Projects</span>
              </div>
              <span className="font-medium text-sm">3</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email Accounts</span>
              </div>
              <span className="font-medium text-sm">3</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Calendars Synced</span>
              </div>
              <span className="font-medium text-sm">2</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Financial Accounts</span>
              </div>
              <span className="font-medium text-sm">3</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            Manage Connections
          </Button>
        </CustomCard>
      </div>
    </div>
  );
}

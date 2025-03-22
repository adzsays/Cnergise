
import React from "react";
import { Calendar, Clock, Users } from "lucide-react";

interface EventsSectionProps {
  projectFilter: string;
}

export function EventsSection({ projectFilter }: EventsSectionProps) {
  // Mock upcoming events with project associations
  const allUpcomingEvents = [
    {
      id: 1,
      title: "Team Weekly Sync",
      time: "Today, 10:00 AM",
      duration: "1 hour",
      participants: 8,
      projectId: "all", // General event for all projects
    },
    {
      id: 2,
      title: "Client Presentation: Project Phase 2",
      time: "Tomorrow, 2:00 PM",
      duration: "45 minutes",
      participants: 5,
      projectId: "website",
    },
    {
      id: 3,
      title: "Budget Review Meeting",
      time: "Friday, 11:30 AM",
      duration: "30 minutes",
      participants: 3,
      projectId: "mobile",
    },
    {
      id: 4,
      title: "Marketing Campaign Review",
      time: "Friday, 3:00 PM",
      duration: "1 hour",
      participants: 4,
      projectId: "marketing",
    },
  ];

  // Filter events - for "all" we show all events, otherwise show general events (projectId="all") AND project-specific events
  const upcomingEvents = projectFilter === "all" 
    ? allUpcomingEvents 
    : allUpcomingEvents.filter(event => event.projectId === "all" || event.projectId === projectFilter);

  return (
    <div className="space-y-3">
      {upcomingEvents.length > 0 ? (
        upcomingEvents.map((event) => (
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
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No events found for the selected project.
        </div>
      )}
    </div>
  );
}

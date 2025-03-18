
import React from "react";
import { CustomCard } from "@/components/ui/CustomCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "work" | "personal" | "meeting";
}

const eventTypes = {
  work: "bg-taskfinity-blue text-white",
  personal: "bg-taskfinity-purple text-white",
  meeting: "bg-taskfinity-teal text-white",
};

export function CalendarSection() {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date()
  );

  // Mock calendar events
  const events: CalendarEvent[] = [
    {
      id: "1",
      title: "Team Meeting",
      date: new Date(2023, 7, 18, 10, 0),
      type: "meeting",
    },
    {
      id: "2",
      title: "Client Presentation",
      date: new Date(2023, 7, 21, 14, 0),
      type: "work",
    },
    {
      id: "3",
      title: "Doctor Appointment",
      date: new Date(2023, 7, 23, 9, 30),
      type: "personal",
    },
    {
      id: "4",
      title: "Project Deadline",
      date: new Date(2023, 7, 25, 17, 0),
      type: "work",
    },
  ];

  const today = new Date();
  
  // Filter events for the selected date
  const selectedDateEvents = events.filter(
    (event) =>
      selectedDate &&
      event.date.getDate() === selectedDate.getDate() &&
      event.date.getMonth() === selectedDate.getMonth() &&
      event.date.getFullYear() === selectedDate.getFullYear()
  );

  return (
    <CustomCard
      title="Calendar"
      description="Sync and manage your schedules"
      className="h-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiersStyles={{
              today: {
                fontWeight: "bold",
                color: "white",
                backgroundColor: "hsl(var(--primary))",
              },
            }}
            components={{
              DayContent: ({ date }) => {
                // Check if there are events for this day
                const dayEvents = events.filter(
                  (event) =>
                    event.date.getDate() === date.getDate() &&
                    event.date.getMonth() === date.getMonth() &&
                    event.date.getFullYear() === date.getFullYear()
                );

                return (
                  <div className="relative">
                    <div>{date.getDate()}</div>
                    {dayEvents.length > 0 && (
                      <div
                        className={cn(
                          "absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full",
                          dayEvents.some((e) => e.type === "work") 
                            ? "bg-taskfinity-blue"
                            : dayEvents.some((e) => e.type === "meeting")
                            ? "bg-taskfinity-teal"
                            : "bg-taskfinity-purple"
                        )}
                      />
                    )}
                  </div>
                );
              },
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">
              {selectedDate?.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[300px]">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border flex items-start"
                >
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.date.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge className={cn(eventTypes[event.type])}>
                    {event.type}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No events scheduled for this day
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Connected Calendars</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-taskfinity-blue mr-2"></div>
                  <span>Work Calendar</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Google
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-taskfinity-purple mr-2"></div>
                  <span>Personal Calendar</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Outlook
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomCard>
  );
}

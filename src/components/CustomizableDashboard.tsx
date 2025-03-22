
import React, { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { CustomCard } from "@/components/ui/CustomCard";
import { Button } from "@/components/ui/button";
import { ProjectsSection } from "@/components/dashboard/ProjectsSection";
import { TasksSection } from "@/components/dashboard/TasksSection";
import { EmailsSection } from "@/components/dashboard/EmailsSection";
import { ActivitySection } from "@/components/dashboard/ActivitySection";
import { EventsSection } from "@/components/dashboard/EventsSection";
import { GoalsSection } from "@/components/dashboard/GoalsSection";
import { Maximize2, Minimize2, Move } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Define dashboard widget types
interface DashboardWidget {
  id: string;
  title: string;
  component: React.ReactNode;
  size: "small" | "medium" | "large";
}

export function CustomizableDashboard() {
  // Project filter state
  const [selectedProject, setSelectedProject] = useState<string>("all");
  
  // State to track widget sizes
  const [widgetSizes, setWidgetSizes] = useState<Record<string, "small" | "medium" | "large">>({
    projects: "large",
    tasks: "medium",
    emails: "medium",
    activity: "medium",
    events: "small",
    goals: "small"
  });

  // State to track widget order
  const [widgetOrder, setWidgetOrder] = useState([
    "projects", 
    "tasks", 
    "emails", 
    "activity", 
    "events", 
    "goals"
  ]);

  // Projects data for filtering
  const projectOptions = [
    { id: "all", name: "All Projects" },
    { id: "website", name: "Website Redesign" },
    { id: "mobile", name: "Mobile App Development" },
    { id: "marketing", name: "Marketing Campaign" }
  ];

  // Handle project filter change
  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
  };

  // Toggle widget size
  const toggleWidgetSize = (widgetId: string) => {
    setWidgetSizes(prev => {
      const currentSize = prev[widgetId];
      let newSize: "small" | "medium" | "large";
      
      if (currentSize === "small") newSize = "medium";
      else if (currentSize === "medium") newSize = "large";
      else newSize = "small";
      
      return { ...prev, [widgetId]: newSize };
    });
  };

  // Handle drag end
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(widgetOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setWidgetOrder(items);
  };

  // Get size classes for a widget
  const getSizeClasses = (size: "small" | "medium" | "large") => {
    switch (size) {
      case "small": return "col-span-1";
      case "medium": return "col-span-2";
      case "large": return "col-span-3";
      default: return "col-span-1";
    }
  };

  // Render widget with title bar
  const renderWidget = (id: string, title: string, children: React.ReactNode, index: number) => {
    const size = widgetSizes[id];
    
    return (
      <Draggable key={id} draggableId={id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`${getSizeClasses(size)} mb-6`}
          >
            <CustomCard
              className="h-full"
              title={title}
              titleExtra={
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => toggleWidgetSize(id)}
                  >
                    {size === "large" ? 
                      <Minimize2 className="h-4 w-4" /> : 
                      <Maximize2 className="h-4 w-4" />
                    }
                  </Button>
                  <div {...provided.dragHandleProps} className="cursor-move">
                    <Move className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              }
            >
              {children}
            </CustomCard>
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="space-y-6">
      {/* Project filter */}
      <div className="flex justify-end mb-4">
        <Select value={selectedProject} onValueChange={handleProjectChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            {projectOptions.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Draggable widgets */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard-widgets" direction="horizontal" type="widget">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-3 gap-6"
            >
              {widgetOrder.map((widgetId, index) => {
                switch (widgetId) {
                  case "projects":
                    return renderWidget(
                      "projects",
                      "Active Projects",
                      <ProjectsSection />,
                      index
                    );
                  case "tasks":
                    return renderWidget(
                      "tasks",
                      "Recent Tasks",
                      <TasksSection projectFilter={selectedProject} />,
                      index
                    );
                  case "emails":
                    return renderWidget(
                      "emails",
                      "Recent Emails",
                      <EmailsSection projectFilter={selectedProject} />,
                      index
                    );
                  case "activity":
                    return renderWidget(
                      "activity",
                      "Recent Activity",
                      <ActivitySection projectFilter={selectedProject} />,
                      index
                    );
                  case "events":
                    return renderWidget(
                      "events",
                      "Upcoming Events",
                      <EventsSection projectFilter={selectedProject} />,
                      index
                    );
                  case "goals":
                    return renderWidget(
                      "goals",
                      "Monthly Goals",
                      <GoalsSection projectFilter={selectedProject} />,
                      index
                    );
                  default:
                    return null;
                }
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

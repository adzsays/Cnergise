
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface GoalsSectionProps {
  projectFilter: string;
}

export function GoalsSection({ projectFilter }: GoalsSectionProps) {
  // Mock goals data with project associations
  const allGoals = [
    {
      id: 1,
      title: "Complete Project Milestones",
      progress: 67,
      detail: "8/12 milestones completed",
      projectId: "website",
    },
    {
      id: 2,
      title: "Financial Target",
      progress: 85,
      detail: "$8,540 / $10,000 saved",
      projectId: "all", // Cross-project goal
    },
    {
      id: 3,
      title: "Health & Wellness",
      progress: 75,
      detail: "15/20 workout sessions",
      projectId: "all", // Cross-project goal
    },
    {
      id: 4,
      title: "Mobile App Test Coverage",
      progress: 60,
      detail: "60% of code covered",
      projectId: "mobile",
    },
    {
      id: 5,
      title: "Marketing Conversion Rate",
      progress: 42,
      detail: "4.2% conversion rate",
      projectId: "marketing",
    },
  ];

  // Filter goals - for "all" we show all goals, otherwise show general goals (projectId="all") AND project-specific goals
  const goals = projectFilter === "all" 
    ? allGoals 
    : allGoals.filter(goal => goal.projectId === "all" || goal.projectId === projectFilter);

  return (
    <div className="space-y-4">
      {goals.length > 0 ? (
        goals.map((goal) => (
          <div key={goal.id}>
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="font-medium">{goal.title}</p>
                <p className="text-xs text-muted-foreground">
                  {goal.detail}
                </p>
              </div>
              <Badge>{goal.progress}%</Badge>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No goals found for the selected project.
        </div>
      )}
    </div>
  );
}

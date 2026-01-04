import { useState } from "react";
import { ExternalLink, Clock, User, MoreVertical, Trash2, Award, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLearningCourses, type LearningCourse } from "@/hooks/useLearningCourses";

const providerColors: Record<string, string> = {
  coursera: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  udemy: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  linkedin: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  edx: "bg-red-500/10 text-red-500 border-red-500/20",
  udacity: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  pluralsight: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  other: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  enrolled: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-green-500/10 text-green-500",
  dropped: "bg-destructive/10 text-destructive",
};

interface CourseCardProps {
  course: LearningCourse;
}

export function CourseCard({ course }: CourseCardProps) {
  const { deleteCourse, updateProgress } = useLearningCourses();
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [localProgress, setLocalProgress] = useState(course.progress_percent);

  const handleProgressSave = () => {
    updateProgress.mutate({ id: course.id, progress: localProgress });
    setIsEditingProgress(false);
  };

  const providerDisplay = course.provider.charAt(0).toUpperCase() + course.provider.slice(1);

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={providerColors[course.provider] || providerColors.other}>
                {providerDisplay}
              </Badge>
              <Badge variant="outline" className={statusColors[course.status]}>
                {course.status === 'in_progress' ? 'In Progress' : course.status.charAt(0).toUpperCase() + course.status.slice(1)}
              </Badge>
            </div>
            <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {course.course_url && (
                <DropdownMenuItem onClick={() => window.open(course.course_url!, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Course
                </DropdownMenuItem>
              )}
              {course.certificate_url && (
                <DropdownMenuItem onClick={() => window.open(course.certificate_url!, '_blank')}>
                  <Award className="h-4 w-4 mr-2" />
                  View Certificate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => deleteCourse.mutate(course.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {course.instructor && (
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{course.instructor}</span>
            </div>
          )}
          {course.estimated_hours && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{course.estimated_hours}h</span>
            </div>
          )}
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{course.progress_percent}%</span>
          </div>
          
          {isEditingProgress ? (
            <div className="space-y-3">
              <Slider
                value={[localProgress]}
                onValueChange={([value]) => setLocalProgress(value)}
                max={100}
                step={5}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsEditingProgress(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleProgressSave}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="cursor-pointer group/progress"
              onClick={() => setIsEditingProgress(true)}
            >
              <Progress value={course.progress_percent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1 opacity-0 group-hover/progress:opacity-100 transition-opacity">
                Click to update progress
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {course.course_url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(course.course_url!, '_blank')}
          >
            <Play className="h-4 w-4 mr-2" />
            Continue Learning
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

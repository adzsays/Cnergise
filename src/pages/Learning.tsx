import React from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Award, TrendingUp, GraduationCap } from "lucide-react";
import { useLearningCourses } from "@/hooks/useLearningCourses";
import { CourseCard } from "@/components/learning/CourseCard";
import { AddCourseDialog } from "@/components/learning/AddCourseDialog";
import { CourseraConnect } from "@/components/learning/CourseraConnect";
import { VoiceAssistant } from "@/components/VoiceAssistant";

export default function Learning() {
  const { courses, isLoading, stats } = useLearningCourses();

  const inProgressCourses = courses?.filter(c => c.status === 'in_progress') || [];
  const enrolledCourses = courses?.filter(c => c.status === 'enrolled') || [];
  const completedCourses = courses?.filter(c => c.status === 'completed') || [];

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarRail />

        <SidebarInset>
          <TopBar title="Learning" />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">Total Courses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.inProgress}</p>
                        <p className="text-sm text-muted-foreground">In Progress</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Award className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.completed}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <Clock className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.totalHours}h</p>
                        <p className="text-sm text-muted-foreground">Learning Hours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <Tabs defaultValue="courses" className="space-y-4">
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="courses">My Courses</TabsTrigger>
                    <TabsTrigger value="providers">Providers</TabsTrigger>
                  </TabsList>
                  <AddCourseDialog />
                </div>

                <TabsContent value="courses" className="space-y-6">
                  {/* In Progress */}
                  {inProgressCourses.length > 0 && (
                    <section>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        Continue Learning
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {inProgressCourses.map(course => (
                          <CourseCard key={course.id} course={course} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Enrolled */}
                  {enrolledCourses.length > 0 && (
                    <section>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        Not Started
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {enrolledCourses.map(course => (
                          <CourseCard key={course.id} course={course} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Completed */}
                  {completedCourses.length > 0 && (
                    <section>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-500" />
                        Completed
                        <Badge variant="secondary">{completedCourses.length}</Badge>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedCourses.map(course => (
                          <CourseCard key={course.id} course={course} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Empty State */}
                  {(!courses || courses.length === 0) && !isLoading && (
                    <Card className="py-12">
                      <CardContent className="flex flex-col items-center text-center">
                        <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Start tracking your learning journey by adding courses from Coursera, Udemy, and more.
                        </p>
                        <AddCourseDialog />
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="providers" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CourseraConnect />
                    
                    {/* Placeholder for other providers */}
                    <Card className="opacity-60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <img 
                            src="https://www.udemy.com/staticx/udemy/images/v7/logo-udemy.svg" 
                            alt="Udemy" 
                            className="h-5"
                          />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Udemy integration coming soon. Add courses manually for now.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="opacity-60">
                      <CardHeader>
                        <CardTitle>LinkedIn Learning</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          LinkedIn Learning integration coming soon.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="opacity-60">
                      <CardHeader>
                        <CardTitle>edX</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          edX integration coming soon.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
        <VoiceAssistant />
      </div>
    </SidebarProvider>
  );
}

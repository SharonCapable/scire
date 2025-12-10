import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Course, Tier, Module, UserCourseEnrollment, UserProgress } from "@shared/types";

interface CourseWithDetails extends Course {
  tiers: (Tier & { modules: Module[] })[];
}

export default function CourseDetail() {
  const [, params] = useRoute("/course/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const courseId = params?.id;

  const { data: course, isLoading } = useQuery<CourseWithDetails>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const { data: enrollment } = useQuery<UserCourseEnrollment>({
    queryKey: ["/api/enrollments", courseId],
    enabled: !!courseId,
  });

  const { data: progress } = useQuery<UserProgress[]>({
    queryKey: [`/api/progress/${courseId}/details`],
    enabled: !!courseId && !!enrollment,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/enrollments", { courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments", courseId] });
      toast({
        title: "Enrolled!",
        description: "You've been enrolled in this course. Start learning now!",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-24 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Course not found</h2>
        <Button onClick={() => setLocation("/courses")}>Browse Courses</Button>
      </div>
    );
  }

  const tierLevelOrder = { start: 0, intermediate: 1, advanced: 2 };
  const sortedTiers = [...(course.tiers || [])].sort(
    (a, b) => (tierLevelOrder[a.level as keyof typeof tierLevelOrder] || 0) -
      (tierLevelOrder[b.level as keyof typeof tierLevelOrder] || 0)
  );

  const getModuleProgress = (moduleId: string) => {
    return progress?.find((p: any) => p.moduleId === moduleId);
  };

  const getTierProgress = (tier: any) => {
    if (!tier.modules?.length) return 0;
    const completed = tier.modules.filter((m: any) => getModuleProgress(m.id)?.completed).length;
    return Math.round((completed / tier.modules.length) * 100);
  };

  const handleContinueLearning = () => {
    for (const tier of sortedTiers) {
      for (const module of tier.modules) {
        const modProgress = getModuleProgress(module.id);
        if (!modProgress?.completed) {
          setLocation(`/learn/${module.id}`);
          return;
        }
      }
    }
    if (sortedTiers.length > 0 && sortedTiers[0].modules.length > 0) {
      setLocation(`/learn/${sortedTiers[0].modules[0].id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 font-heading" data-testid="text-course-title">
              {course.title}
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-4">{course.description}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{course.sourceType}</Badge>
              {course.tiers?.length > 0 && (
                <Badge variant="secondary">{course.tiers.length} learning tiers</Badge>
              )}
            </div>
          </div>
        </div>

        {!enrollment ? (
          <Button
            size="lg"
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending}
            data-testid="button-enroll"
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Enroll in Course
          </Button>
        ) : (
          <Card className="bg-primary/5">
            <CardHeader className="gap-2 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Progress</CardTitle>
                <div className="flex items-center gap-4">
                  <Button onClick={handleContinueLearning} className="gap-2">
                    <PlayCircle className="h-4 w-4" />
                    Continue Learning
                  </Button>
                  <Badge variant="default">Enrolled</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold font-heading">Learning Path</h2>

        {sortedTiers.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              This course is being prepared. Check back soon!
            </p>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {sortedTiers.map((tier: any, idx: number) => {
              const tierProgress = getTierProgress(tier);
              const levelColors = {
                start: "bg-green-500",
                intermediate: "bg-yellow-500",
                advanced: "bg-red-500",
              };

              return (
                <AccordionItem
                  key={tier.id}
                  value={tier.id}
                  className="border rounded-lg"
                  data-testid={`tier-${tier.level}`}
                >
                  <AccordionTrigger className="px-6 hover:no-underline hover-elevate">
                    <div className="flex items-center gap-4 flex-1 text-left">
                      <div className={`w-1 h-12 rounded-full ${levelColors[tier.level as keyof typeof levelColors] || "bg-gray-500"}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold font-heading">{tier.title}</h3>
                          <Badge variant="outline" className="text-xs capitalize">
                            {tier.level}
                          </Badge>
                        </div>
                        {tier.description && (
                          <p className="text-sm text-muted-foreground">{tier.description}</p>
                        )}
                        {enrollment && tier.modules?.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={tierProgress} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground">{tierProgress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    {tier.modules?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No modules yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {tier.modules?.map((module: any, modIdx: number) => {
                          const moduleProgress = getModuleProgress(module.id);
                          const isCompleted = moduleProgress?.completed;

                          return (
                            <Card
                              key={module.id}
                              className="hover-elevate cursor-pointer"
                              onClick={() => enrollment && setLocation(`/learn/${module.id}`)}
                              data-testid={`module-${module.id}`}
                            >
                              <CardHeader className="p-4 gap-1">
                                <div className="flex items-start gap-3">
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-base font-semibold">
                                      {modIdx + 1}. {module.title}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                      <span>{module.estimatedMinutes} min</span>
                                      {moduleProgress && !isCompleted && (
                                        <span>• {moduleProgress.progressPercent}% complete</span>
                                      )}
                                    </div>
                                  </div>
                                  {enrollment && !isCompleted && (
                                    <Button size="sm" variant="ghost" data-testid={`button-start-${module.id}`}>
                                      <PlayCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </CardHeader>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}

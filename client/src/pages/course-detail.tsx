import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GenerationProgress } from "@/components/generation-progress";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  PlayCircle,
  Lock,
  Sparkles,
  Loader2,
  ChevronRight,
  Clock,
  Trophy
} from "lucide-react";
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

  const [generatingTier, setGeneratingTier] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState(0);

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

  const generateTierMutation = useMutation({
    mutationFn: async (tierLevel: string) => {
      setGeneratingTier(tierLevel);
      setGenerationStep(0);

      // Simulate step progress
      const stepInterval = setInterval(() => {
        setGenerationStep((prev) => Math.min(prev + 1, 4));
      }, 3000);

      try {
        const result = await apiRequest("POST", `/api/courses/${courseId}/generate-tier/${tierLevel}`);
        clearInterval(stepInterval);
        setGenerationStep(5);
        return result;
      } catch (error) {
        clearInterval(stepInterval);
        throw error;
      }
    },
    onSuccess: () => {
      setTimeout(() => {
        setGeneratingTier(null);
        setGenerationStep(0);
        queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
        toast({
          title: "Tier Unlocked!",
          description: "New learning content is now available.",
        });
      }, 2000);
    },
    onError: (error: any) => {
      setGeneratingTier(null);
      setGenerationStep(0);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate tier. Please try again.",
        variant: "destructive",
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

  const canGenerateTier = (tier: any, index: number) => {
    // Can only generate if previous tier is completed
    if (index === 0) return true;
    const prevTier = sortedTiers[index - 1];
    return prevTier?.generationStatus === 'completed' || (prevTier?.modules?.length > 0);
  };

  const isTierLocked = (tier: any) => {
    return tier.generationStatus === 'locked' && (!tier.modules || tier.modules.length === 0);
  };

  const handleContinueLearning = () => {
    for (const tier of sortedTiers) {
      if (isTierLocked(tier)) continue;
      for (const module of tier.modules) {
        const modProgress = getModuleProgress(module.id);
        if (!modProgress?.completed) {
          setLocation(`/learn/${module.id}`);
          return;
        }
      }
    }
    if (sortedTiers.length > 0 && sortedTiers[0].modules?.length > 0) {
      setLocation(`/learn/${sortedTiers[0].modules[0].id}`);
    }
  };

  const levelColors = {
    start: { bg: "bg-emerald-500", text: "text-emerald-500", light: "bg-emerald-500/10" },
    intermediate: { bg: "bg-amber-500", text: "text-amber-500", light: "bg-amber-500/10" },
    advanced: { bg: "bg-red-500", text: "text-red-500", light: "bg-red-500/10" },
  };

  const levelLabels = {
    start: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };

  return (
    <>
      {/* Generation Progress Overlay */}
      <GenerationProgress
        isVisible={!!generatingTier}
        courseTitle={course.title}
        tierLevel={generatingTier as 'start' | 'intermediate' | 'advanced'}
        currentStep={generationStep}
        totalSteps={5}
        onComplete={() => { }}
      />

      <motion.div
        className="max-w-4xl mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Course Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {course.isPersonalized && (
                  <Badge className="bg-violet-500 gap-1">
                    <Sparkles className="h-3 w-3" />
                    Personalized
                  </Badge>
                )}
                <Badge variant="outline">{course.sourceType}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 font-heading" data-testid="text-course-title">
                {course.title}
              </h1>
              <p className="text-muted-foreground leading-relaxed mb-4">{course.description}</p>

              {/* Course Stats */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {sortedTiers.length} Tiers
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {sortedTiers.reduce((acc, t) => acc + (t.modules?.length || 0), 0)} Modules
                </div>
              </div>
            </div>
          </div>

          {/* Enrollment / Progress Card */}
          {!enrollment ? (
            <Button
              size="lg"
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              data-testid="button-enroll"
              className="gap-2"
            >
              <BookOpen className="h-5 w-5" />
              Enroll in Course
            </Button>
          ) : (
            <Card className="bg-gradient-to-r from-primary/5 to-violet-500/5 border-primary/20">
              <CardHeader className="gap-2 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Your Progress</CardTitle>
                      <CardDescription>Continue your learning journey</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={handleContinueLearning} className="gap-2">
                      <PlayCircle className="h-4 w-4" />
                      Continue Learning
                    </Button>
                    <Badge className="bg-emerald-500">Enrolled</Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Learning Path */}
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
            <div className="space-y-4">
              {sortedTiers.map((tier: any, idx: number) => {
                const tierProgress = getTierProgress(tier);
                const isLocked = isTierLocked(tier);
                const canGenerate = canGenerateTier(tier, idx);
                const colors = levelColors[tier.level as keyof typeof levelColors] || levelColors.start;
                const label = levelLabels[tier.level as keyof typeof levelLabels] || tier.level;

                return (
                  <motion.div
                    key={tier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className={`overflow-hidden ${isLocked ? 'opacity-75' : ''}`}>
                      {/* Tier Header */}
                      <div className={`h-1 ${colors.bg}`} />
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${colors.light}`}>
                              {isLocked ? (
                                <Lock className={`h-6 w-6 ${colors.text}`} />
                              ) : tierProgress === 100 ? (
                                <CheckCircle2 className={`h-6 w-6 text-emerald-500`} />
                              ) : (
                                <BookOpen className={`h-6 w-6 ${colors.text}`} />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-lg">{tier.title}</CardTitle>
                                <Badge variant="outline" className="capitalize text-xs">
                                  {label}
                                </Badge>
                              </div>
                              {tier.description && (
                                <CardDescription>{tier.description}</CardDescription>
                              )}
                            </div>
                          </div>

                          {/* Tier Action Button */}
                          {isLocked ? (
                            <Button
                              onClick={() => generateTierMutation.mutate(tier.level)}
                              disabled={!canGenerate || generateTierMutation.isPending}
                              className="gap-2"
                            >
                              {generateTierMutation.isPending && generatingTier === tier.level ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4" />
                                  Unlock Tier
                                </>
                              )}
                            </Button>
                          ) : (
                            <div className="text-right">
                              <span className="text-sm font-medium">{tierProgress}%</span>
                              <p className="text-xs text-muted-foreground">
                                {tier.modules?.length || 0} modules
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {!isLocked && tier.modules?.length > 0 && enrollment && (
                          <div className="mt-4">
                            <Progress value={tierProgress} className="h-2" />
                          </div>
                        )}
                      </CardHeader>

                      {/* Modules List */}
                      {!isLocked && tier.modules?.length > 0 && (
                        <CardContent className="pt-0">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="modules" className="border-none">
                              <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline">
                                View {tier.modules.length} modules
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 pt-2">
                                  {tier.modules.map((module: any, modIdx: number) => {
                                    const moduleProgress = getModuleProgress(module.id);
                                    const isCompleted = moduleProgress?.completed;

                                    return (
                                      <div
                                        key={module.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isCompleted
                                            ? 'bg-emerald-500/5 border-emerald-500/20'
                                            : 'hover:bg-muted/50'
                                          }`}
                                        onClick={() => enrollment && setLocation(`/learn/${module.id}`)}
                                      >
                                        {isCompleted ? (
                                          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                        ) : (
                                          <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm truncate">
                                            {modIdx + 1}. {module.title}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {module.estimatedMinutes} min
                                          </p>
                                        </div>
                                        {enrollment && !isCompleted && (
                                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </CardContent>
                      )}

                      {/* Locked State Message */}
                      {isLocked && (
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                            <Lock className="h-4 w-4" />
                            {canGenerate ? (
                              <span>Click "Unlock Tier" to generate this learning content.</span>
                            ) : (
                              <span>Complete the previous tier to unlock this content.</span>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

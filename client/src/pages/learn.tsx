import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Brain,
  FileQuestion,
  ClipboardCheck,
  Sparkles,
  Loader2,
  VolumeX,
  Pause,
  Play,
  Lock,
  Trophy,
  ArrowRight,
  Home,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import confetti from "canvas-confetti";
import type { Module, Flashcard, UserProgress, Assessment, Tier } from "@shared/types";
import { QuizComponent } from "@/components/assessment/QuizComponent";
import { UnderstandingCheckComponent } from "@/components/assessment/UnderstandingCheckComponent";

// Split content into pages (approximately 500 words per page)
function splitContentIntoPages(content: string): string[] {
  if (!content) return [""];

  // Clean content artifacts
  const cleanContent = content
    .replace(/^(\*\*\*|\+\+\+|---)?s*markdowns*/i, "") // Remove markdown block indicators
    .replace(/^#+s*Module:.*$/im, "") // Remove duplicate module titles if present
    .replace(/^Welcome to the.*module!/im, "") // Remove generic welcome messages if they duplicate intro
    .trim();

  // Split by paragraphs (double newlines or <br><br>)
  const paragraphs = cleanContent.split(/\n\n|\\<br\/?\\>\s*\\<br\/?\\>/gi).filter(p => p.trim());

  const pages: string[] = [];
  let currentPage = "";
  let wordCount = 0;
  const wordsPerPage = 400;

  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.split(/\s+/).length;

    if (wordCount + paragraphWords > wordsPerPage && currentPage) {
      pages.push(currentPage.trim());
      currentPage = paragraph;
      wordCount = paragraphWords;
    } else {
      currentPage += (currentPage ? "\n\n" : "") + paragraph;
      wordCount += paragraphWords;
    }
  }

  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }

  return pages.length > 0 ? pages : [""];
}

// Generate a brief summary from content
function generateSummary(content: string): string {
  if (!content) return "";

  // Strip markdown formatting
  const plainText = content
    .replace(/#{1,6}\s/g, "") // Headers
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // Bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // Italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
    .replace(/`([^`]+)`/g, "$1") // Inline code
    .replace(/^\s*[-+*]\s/gm, "") // List items
    .replace(/^\s*>\s/gm, "") // Blockquotes
    .replace(/!\[.*?\]\(.*?\)/g, "") // Images
    .replace(/\n+/g, " ") // Collapse newlines
    .trim();

  // Take the first 150 words as a summary
  const words = plainText.split(/\s+/).slice(0, 150);
  return words.join(" ") + (words.length >= 150 ? "..." : "");
}

// Confetti celebration
function triggerConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: ReturnType<typeof setInterval> = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
}

export default function Learn() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const moduleId = params?.id;

  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pagesRead, setPagesRead] = useState<Set<number>>(new Set());
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [showTierComplete, setShowTierComplete] = useState(false);
  const [tierCompleteShown, setTierCompleteShown] = useState(false);
  const [isOverviewCollapsed, setIsOverviewCollapsed] = useState(true); // Collapsed by default on mobile

  // Time tracking
  const startTimeRef = useRef<number>(Date.now());
  const lastSyncTimeRef = useRef<number>(0);
  const [timeSpentMinutes, setTimeSpentMinutes] = useState(0);

  const { data: module, isLoading: moduleLoading } = useQuery<Module>({
    queryKey: ["/api/modules", moduleId],
    enabled: !!moduleId,
  });

  // Time tracking - sync every 30 seconds, pause when inactive
  useEffect(() => {
    if (!moduleId) return;

    // Reset start time when module changes
    startTimeRef.current = Date.now();
    lastSyncTimeRef.current = 0;
    let lastActiveTime = Date.now();
    let isTabActive = true;
    const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    const syncTimeSpent = async () => {
      // Don't count time if tab was inactive for more than 5 minutes
      if (!isTabActive) return;

      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActiveTime;

      // If more than 5 minutes since last activity, reset the timer
      if (timeSinceLastActivity > INACTIVITY_THRESHOLD) {
        startTimeRef.current = currentTime;
        lastSyncTimeRef.current = 0;
        return;
      }

      const minutesElapsed = Math.floor((currentTime - startTimeRef.current) / 60000);

      // Only sync if we've spent at least 1 minute since last sync
      if (minutesElapsed > lastSyncTimeRef.current) {
        const additionalMinutes = minutesElapsed - lastSyncTimeRef.current;
        lastSyncTimeRef.current = minutesElapsed;
        setTimeSpentMinutes(minutesElapsed);

        try {
          await apiRequest("POST", `/api/progress/${moduleId}/time`, {
            additionalMinutes
          });
        } catch (error) {
          console.error("Failed to sync time:", error);
        }
      }
    };

    // Track user activity
    const handleActivity = () => {
      lastActiveTime = Date.now();
    };

    // Sync every 30 seconds
    const interval = setInterval(syncTimeSpent, 30000);

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isTabActive = false;
        syncTimeSpent(); // Sync before going inactive
      } else {
        isTabActive = true;
        // If returning after being away for a while, reset the timer
        const timeSinceLastActivity = Date.now() - lastActiveTime;
        if (timeSinceLastActivity > INACTIVITY_THRESHOLD) {
          startTimeRef.current = Date.now();
          lastSyncTimeRef.current = 0;
        }
        lastActiveTime = Date.now();
      }
    };

    // Listen for activity
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("mousemove", handleActivity);
    document.addEventListener("keydown", handleActivity);
    document.addEventListener("scroll", handleActivity);

    // Cleanup
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("mousemove", handleActivity);
      document.removeEventListener("keydown", handleActivity);
      document.removeEventListener("scroll", handleActivity);
      // Final sync on unmount
      syncTimeSpent();
    };
  }, [moduleId]);

  // Handle TTS cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Split content into pages
  const contentPages = useMemo(() => {
    return splitContentIntoPages(module?.content || "");
  }, [module?.content]);

  const toggleSpeech = () => {
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      // Start speaking current page
      const textToSpeak = contentPages[currentPageIndex]?.replace(/<[^>]*>/g, '') || "";
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      utterance.onerror = (e) => {
        console.error("Speech error:", e);
        setIsPlaying(false);
        setIsPaused(false);
      };

      setSpeechUtterance(utterance);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Stop speech when changing pages
  useEffect(() => {
    stopSpeech();
  }, [currentPageIndex]);

  const { data: flashcards, isLoading: flashcardsLoading, refetch: refetchFlashcards } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards", moduleId],
    enabled: !!moduleId,
  });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery<Assessment[]>({
    queryKey: [`/api/modules/${moduleId}/assessments`],
    enabled: !!moduleId,
  });

  const { data: userProgress, refetch: refetchProgress } = useQuery<UserProgress>({
    queryKey: ["/api/progress/module", moduleId],
    enabled: !!moduleId,
    refetchInterval: 5000, // Poll every 5 seconds to keep progress in sync
  });

  const isModuleCompleted = !!userProgress?.completed;

  // Get sibling modules for next module navigation
  const { data: siblingModules, refetch: refetchSiblings } = useQuery<Module[]>({
    queryKey: ["/api/tiers", module?.tierId, "modules"],
    enabled: !!module?.tierId,
  });

  // Get tier info for course navigation
  const { data: tierInfo } = useQuery<Tier>({
    queryKey: ["/api/tiers", module?.tierId],
    enabled: !!module?.tierId,
  });

  // Find current and next module
  const currentModuleIndex = siblingModules?.findIndex(m => m.id === moduleId) ?? -1;
  const nextModule = currentModuleIndex >= 0 && siblingModules
    ? siblingModules[currentModuleIndex + 1]
    : undefined;

  // Check if this is the last module in the tier
  const isLastModuleInTier = currentModuleIndex >= 0 && siblingModules
    ? currentModuleIndex === siblingModules.length - 1
    : false;

  // Check if all modules in tier are complete
  const { data: tierProgress } = useQuery<UserProgress[]>({
    queryKey: [`/api/progress/${tierInfo?.courseId}/details`],
    enabled: !!tierInfo?.courseId,
  });

  const allTierModulesComplete = useMemo(() => {
    if (!siblingModules || !tierProgress) return false;
    return siblingModules.every(mod =>
      tierProgress.some(p => p.moduleId === mod.id && p.completed)
    );
  }, [siblingModules, tierProgress]);

  // Trigger confetti when tier is complete for the first time
  useEffect(() => {
    if (allTierModulesComplete && isModuleCompleted && isLastModuleInTier && !tierCompleteShown) {
      setTierCompleteShown(true);
      setShowTierComplete(true);
      triggerConfetti();
    }
  }, [allTierModulesComplete, isModuleCompleted, isLastModuleInTier, tierCompleteShown]);

  const totalPages = contentPages.length;
  const contentSummary = useMemo(() => {
    return generateSummary(module?.content || "");
  }, [module?.content]);

  // Track page reading
  useEffect(() => {
    if (currentPageIndex >= 0) {
      setPagesRead(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.add(currentPageIndex);
        return newSet;
      });
    }
  }, [currentPageIndex]);

  // Calculate reading progress
  const readingProgress = totalPages > 0 ? Math.round((pagesRead.size / totalPages) * 100) : 0;
  const allPagesRead = pagesRead.size >= totalPages;

  const updateProgressMutation = useMutation({
    mutationFn: async (data: { progressPercent: number; completed?: boolean }) => {
      return await apiRequest("POST", `/api/progress/${moduleId}`, data);
    },
    onSuccess: () => {
      // Immediately refetch progress to show updated state
      refetchProgress();
      queryClient.invalidateQueries({ queryKey: ["/api/progress/module", moduleId] });
      if (tierInfo?.courseId) {
        queryClient.invalidateQueries({ queryKey: [`/api/progress/${tierInfo.courseId}/details`] });
      }
    },
  });

  const recordFlashcardMutation = useMutation({
    mutationFn: async (data: { flashcardId: string; correct: boolean }) => {
      return await apiRequest("POST", "/api/flashcard-progress", data);
    },
  });

  const generateFlashcardsMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingFlashcards(true);
      return await apiRequest("POST", `/api/modules/${moduleId}/generate-flashcards`, {});
    },
    onSuccess: () => {
      setIsGeneratingFlashcards(false);
      refetchFlashcards();
      toast({
        title: "Flashcards Generated!",
        description: "Your flashcards are ready for practice.",
      });
    },
    onError: () => {
      setIsGeneratingFlashcards(false);
      toast({
        title: "Error",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFlashcardResponse = (correct: boolean) => {
    const flashcard = flashcards?.[currentFlashcardIndex];
    if (flashcard) {
      recordFlashcardMutation.mutate({
        flashcardId: flashcard.id,
        correct,
      });
    }

    if (currentFlashcardIndex < (flashcards?.length || 0) - 1) {
      setCurrentFlashcardIndex(currentFlashcardIndex + 1);
      setShowAnswer(false);
    }
  };

  const handleCompleteModule = useCallback(() => {
    updateProgressMutation.mutate({ progressPercent: 100, completed: true });

    // Check if this completes the tier
    if (isLastModuleInTier) {
      toast({
        title: "🎉 Tier Complete!",
        description: "Amazing work! You've completed all modules in this tier.",
      });
    } else {
      toast({
        title: "Module completed!",
        description: "Great work! Move on to the next module when you're ready.",
      });
    }
  }, [isLastModuleInTier, toast, updateProgressMutation]);

  const nextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
      // Update progress as user reads
      const newProgress = Math.round(((currentPageIndex + 2) / totalPages) * 100);
      updateProgressMutation.mutate({ progressPercent: Math.min(newProgress, 99) });
    }
  };

  const prevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  if (moduleLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 mb-4" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Module not found</h2>
        <Button onClick={() => setLocation("/courses")}>Back to Courses</Button>
      </div>
    );
  }

  const progressPercent = userProgress?.progressPercent || readingProgress;
  const currentFlashcard = flashcards?.[currentFlashcardIndex];
  const quiz = assessments?.find(a => a.type === 'quiz');
  const understandingCheck = assessments?.find(a => a.type === 'understanding');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Tier Complete Celebration Modal */}
      {showTierComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4 text-center">
            <CardHeader>
              <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500">
                <Trophy className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="text-2xl">🎉 Tier Complete!</CardTitle>
              <CardDescription>
                Congratulations! You've completed all modules in this tier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You can now unlock the next tier to continue your learning journey.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setShowTierComplete(false);
                    if (tierInfo?.courseId) {
                      setLocation(`/course/${tierInfo.courseId}`);
                    }
                  }}
                  className="gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Go to Course & Unlock Next Tier
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowTierComplete(false)}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Stay Here
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-xl sm:text-3xl font-bold mb-2 font-heading" data-testid="text-module-title">
          {module.title}
        </h1>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          <Badge variant="outline">{module.estimatedMinutes} min</Badge>
          {userProgress?.completed && (
            <Badge className="bg-emerald-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="flex w-full items-center p-1 bg-muted rounded-xl overflow-x-auto">
          <TabsTrigger value="content" data-testid="tab-content" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>

          <div className="mx-2 h-4 w-px bg-border/50 self-center" />

          <TabsTrigger value="flashcards" disabled={!isModuleCompleted} data-testid="tab-flashcards" className="gap-2" title={!isModuleCompleted ? "Complete module to unlock" : "Flashcards"}>
            {!isModuleCompleted ? <Lock className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
            <span className="hidden sm:inline">Flashcards</span>
            {(flashcards?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {flashcards?.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="quiz" disabled={!isModuleCompleted} data-testid="tab-quiz" className="gap-2" title={!isModuleCompleted ? "Complete module to unlock" : "Quiz"}>
            {!isModuleCompleted ? <Lock className="h-4 w-4" /> : <FileQuestion className="h-4 w-4" />}
            <span className="hidden sm:inline">Quiz</span>
          </TabsTrigger>
          <TabsTrigger value="understanding" disabled={!isModuleCompleted} data-testid="tab-understanding" className="gap-2" title={!isModuleCompleted ? "Complete module to unlock" : "Check"}>
            {!isModuleCompleted ? <Lock className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
            <span className="hidden sm:inline">Check</span>
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          {/* Header Image */}
          {module.imageUrl && (
            <div className="rounded-xl overflow-hidden shadow-md aspect-[21/9] w-full relative group">
              <img
                src={module.imageUrl}
                alt={module.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  // Hide image parent on error
                  e.currentTarget.parentElement!.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Summary Card - Collapsible on Mobile */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader
              className="pb-3 cursor-pointer sm:cursor-default"
              onClick={() => setIsOverviewCollapsed(!isOverviewCollapsed)}
            >
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Module Overview</span>
                </div>
                <Button variant="ghost" size="sm" className="sm:hidden h-8 w-8 p-0">
                  {isOverviewCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </CardTitle>
              {/* Always show stats on mobile header */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden mt-2">
                <span>{totalPages} pages</span>
                <span>•</span>
                <span>{module.estimatedMinutes} min</span>
                <span>•</span>
                <span className="text-primary font-medium">{pagesRead.size}/{totalPages} read</span>
              </div>
            </CardHeader>
            <CardContent className={`${isOverviewCollapsed ? 'hidden sm:block' : 'block'}`}>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {contentSummary}
              </p>
              <div className="hidden sm:flex items-center gap-4 mt-4 text-sm">
                <span>{totalPages} pages</span>
                <span>•</span>
                <span>{module.estimatedMinutes} min read</span>
                <span>•</span>
                <span className="text-primary font-medium">{pagesRead.size}/{totalPages} pages read</span>
              </div>
            </CardContent>
          </Card>

          {/* Page Navigation Header with Audio Controls */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Page {currentPageIndex + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={`h-8 w-8 p-0 ${isPlaying ? 'text-primary border-primary' : ''}`}
                onClick={toggleSpeech}
                title={isPlaying ? "Pause" : "Listen to page"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              {isPlaying && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={stopSpeech}
                  title="Stop"
                >
                  <VolumeX className="h-4 w-4" />
                </Button>
              )}

              {allPagesRead && (
                <Badge className="bg-emerald-500 ml-2">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  All pages read
                </Badge>
              )}
            </div>
          </div>

          {/* Content Card */}
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed">
                <ReactMarkdown>
                  {contentPages[currentPageIndex] || ""}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Page Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={prevPage}
              disabled={currentPageIndex === 0}
              className="flex-shrink-0"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Mobile: Simple page indicator */}
            <div className="flex sm:hidden items-center gap-2 text-sm">
              <span className="font-medium">{currentPageIndex + 1}</span>
              <span className="text-muted-foreground">of</span>
              <span>{totalPages}</span>
            </div>

            {/* Desktop: Page buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
                <Button
                  key={i}
                  variant={currentPageIndex === i ? "default" : pagesRead.has(i) ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPageIndex(i)}
                  className="w-8 h-8 p-0"
                >
                  {i + 1}
                </Button>
              ))}
              {totalPages > 10 && <span className="text-muted-foreground">...</span>}
            </div>

            {currentPageIndex < totalPages - 1 ? (
              <Button onClick={nextPage} size="sm" className="flex-shrink-0">
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" />
              </Button>
            ) : userProgress?.completed && nextModule ? (
              <Button
                onClick={() => setLocation(`/learn/${nextModule.id}`)}
                className="bg-primary hover:bg-primary/90"
              >
                Next Module
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : userProgress?.completed && isLastModuleInTier ? (
              <Button
                onClick={() => tierInfo?.courseId && setLocation(`/course/${tierInfo.courseId}`)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Trophy className="mr-2 h-4 w-4" />
                View Course & Unlock Next Tier
              </Button>
            ) : (
              <Button
                onClick={handleCompleteModule}
                disabled={userProgress?.completed}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {userProgress?.completed ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Completed
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Module
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Reading Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reading progress</span>
              <span className="font-medium">{readingProgress}%</span>
            </div>
            <Progress value={readingProgress} className="h-2" />
          </div>
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="space-y-6">
          {flashcardsLoading ? (
            <Skeleton className="h-96" />
          ) : !flashcards || flashcards.length === 0 ? (
            <Card className="p-12 text-center">
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
              <p className="text-muted-foreground mb-6">
                Generate flashcards based on this module's content to help you study.
              </p>
              <Button
                onClick={() => generateFlashcardsMutation.mutate()}
                disabled={isGeneratingFlashcards}
                className="gap-2"
              >
                {isGeneratingFlashcards ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Flashcards
                  </>
                )}
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Card {currentFlashcardIndex + 1} of {flashcards.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentFlashcardIndex(0);
                    setShowAnswer(false);
                  }}
                  data-testid="button-reset-flashcards"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restart
                </Button>
              </div>

              <Card
                className="min-h-64 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setShowAnswer(!showAnswer)}
                data-testid="flashcard"
              >
                <CardContent className="p-12 text-center">
                  <Badge variant="outline" className="mb-4">
                    {showAnswer ? "Answer" : "Question"}
                  </Badge>
                  <p className="text-xl font-medium mb-4">
                    {showAnswer ? currentFlashcard?.answer : currentFlashcard?.question}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click to {showAnswer ? "see question" : "reveal answer"}
                  </p>
                </CardContent>
              </Card>

              {showAnswer && (
                <div className="flex gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => handleFlashcardResponse(false)}
                    data-testid="button-incorrect"
                    className="flex-1 max-w-32"
                  >
                    Need Review
                  </Button>
                  <Button
                    onClick={() => handleFlashcardResponse(true)}
                    data-testid="button-correct"
                    className="flex-1 max-w-32 bg-emerald-500 hover:bg-emerald-600"
                  >
                    Got It!
                  </Button>
                </div>
              )}

              <Progress value={((currentFlashcardIndex + 1) / flashcards.length) * 100} className="h-2" />
            </div>
          )}
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="space-y-6">
          {assessmentsLoading ? (
            <Skeleton className="h-96" />
          ) : quiz ? (
            <QuizComponent
              questions={quiz.questions || []}
              onComplete={(score) => {
                toast({
                  title: "Quiz Completed!",
                  description: `You scored ${score}%. Great job!`,
                });
              }}
            />
          ) : (
            <Card className="p-12 text-center">
              <FileQuestion className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No quiz available</h3>
              <p className="text-muted-foreground">
                A quiz for this module hasn't been created yet.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Understanding Check Tab */}
        <TabsContent value="understanding" className="space-y-6">
          {assessmentsLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <UnderstandingCheckComponent
              moduleId={moduleId!}
              prompt={understandingCheck?.prompt || "Explain the key concepts from this module in your own words."}
              onComplete={(score) => {
                toast({
                  title: "Assessment Passed!",
                  description: `You scored ${score}/100. Module marked as complete!`,
                });
                handleCompleteModule();
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

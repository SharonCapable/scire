import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Module, Flashcard, UserProgress, Assessment } from "@shared/types";
import { QuizComponent } from "@/components/assessment/QuizComponent";
import { UnderstandingCheckComponent } from "@/components/assessment/UnderstandingCheckComponent";

export default function Learn() {
  const [, params] = useRoute("/learn/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const moduleId = params?.id;

  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const { data: module, isLoading: moduleLoading } = useQuery<Module>({
    queryKey: ["/api/modules", moduleId],
    enabled: !!moduleId,
  });

  const { data: flashcards, isLoading: flashcardsLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards", moduleId],
    enabled: !!moduleId,
  });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery<Assessment[]>({
    queryKey: [`/api/modules/${moduleId}/assessments`],
    enabled: !!moduleId,
  });

  const { data: userProgress } = useQuery<UserProgress>({
    queryKey: ["/api/progress/module", moduleId],
    enabled: !!moduleId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: { progressPercent: number; completed?: boolean }) => {
      return await apiRequest("POST", `/api/progress/${moduleId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress/module", moduleId] });
    },
  });

  const recordFlashcardMutation = useMutation({
    mutationFn: async (data: { flashcardId: string; correct: boolean }) => {
      return await apiRequest("POST", "/api/flashcard-progress", data);
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

  const handleCompleteModule = () => {
    updateProgressMutation.mutate({ progressPercent: 100, completed: true });
    toast({
      title: "Module completed!",
      description: "Great work! Move on to the next module when you're ready.",
    });
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

  const progressPercent = userProgress?.progressPercent || 0;
  const currentFlashcard = flashcards?.[currentFlashcardIndex];

  const quiz = assessments?.find(a => a.type === 'quiz');
  const understandingCheck = assessments?.find(a => a.type === 'understanding');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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

        <h1 className="text-3xl font-bold mb-2 font-heading" data-testid="text-module-title">
          {module.title}
        </h1>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          <Badge variant="outline">{module.estimatedMinutes} min</Badge>
        </div>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
          <TabsTrigger value="flashcards" data-testid="tab-flashcards">
            Flashcards {(flashcards?.length || 0) > 0 && `(${flashcards?.length})`}
          </TabsTrigger>
          <TabsTrigger value="quiz" data-testid="tab-quiz">Quiz</TabsTrigger>
          <TabsTrigger value="understanding" data-testid="tab-understanding">Check</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardContent className="p-8">
              <div className="prose prose-slate dark:prose-invert max-w-prose mx-auto leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: module.content.replace(/\n/g, '<br/>') }} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => updateProgressMutation.mutate({ progressPercent: Math.min(progressPercent + 25, 100) })}
              data-testid="button-mark-progress"
            >
              Mark as Read
            </Button>
            <Button
              onClick={handleCompleteModule}
              disabled={userProgress?.completed}
              data-testid="button-complete"
            >
              {userProgress?.completed ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completed
                </>
              ) : (
                "Complete Module"
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="flashcards" className="space-y-6">
          {flashcardsLoading ? (
            <Skeleton className="h-96" />
          ) : !flashcards || flashcards.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No flashcards available for this module yet.</p>
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
                className="min-h-64 flex items-center justify-center cursor-pointer hover-elevate active-elevate-2"
                onClick={() => setShowAnswer(!showAnswer)}
                data-testid="flashcard"
              >
                <CardContent className="p-12 text-center">
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
                  >
                    Need Review
                  </Button>
                  <Button
                    onClick={() => handleFlashcardResponse(true)}
                    data-testid="button-correct"
                  >
                    Got It!
                  </Button>
                </div>
              )}

              <Progress value={((currentFlashcardIndex + 1) / flashcards.length) * 100} className="h-1" />
            </div>
          )}
        </TabsContent>

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
                // Optionally mark progress here
              }}
            />
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No quiz available for this module yet.</p>
            </Card>
          )}
        </TabsContent>

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

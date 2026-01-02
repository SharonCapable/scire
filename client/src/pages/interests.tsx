import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GenerationProgress } from "@/components/generation-progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Loader2, Sparkles, Brain, BookOpen, Target } from "lucide-react";
import type { UserInterest } from "@shared/types";

const interestSchema = z.object({
  learningGoals: z.string().min(10, "Please describe your learning goals (at least 10 characters)"),
  preferredPace: z.enum(["slow", "moderate", "fast"]),
});

export default function Interests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [showGeneration, setShowGeneration] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedCourseTitle, setGeneratedCourseTitle] = useState("");

  const { data: existingInterests } = useQuery<UserInterest>({
    queryKey: ["/api/interests"],
  });

  // Load existing topics when data is available
  useEffect(() => {
    if (existingInterests?.topics?.length) {
      setTopics(existingInterests.topics);
    }
  }, [existingInterests]);

  const form = useForm<z.infer<typeof interestSchema>>({
    resolver: zodResolver(interestSchema),
    defaultValues: {
      learningGoals: existingInterests?.learningGoals || "",
      preferredPace: (existingInterests?.preferredPace as "slow" | "moderate" | "fast") || "moderate",
    },
  });

  // Update form when existing interests load
  useEffect(() => {
    if (existingInterests) {
      form.reset({
        learningGoals: existingInterests.learningGoals || "",
        preferredPace: (existingInterests.preferredPace as "slow" | "moderate" | "fast") || "moderate",
      });
    }
  }, [existingInterests, form]);

  const generateCourseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof interestSchema>) => {
      // Save interests first
      await apiRequest("POST", "/api/interests", {
        topics,
        ...data,
      });

      // Start generation with progress simulation
      setShowGeneration(true);
      setGenerationStep(0);
      setGeneratedCourseTitle(topics[0] || "Your Course");

      // Simulate step progress - 15 seconds per step for better UX
      const stepInterval = setInterval(() => {
        setGenerationStep((prev) => Math.min(prev + 1, 4));
      }, 15000);

      try {
        // Generate course from interests
        const result = await apiRequest("POST", "/api/courses/generate-from-interests", {
          topics,
          learningGoals: data.learningGoals,
        });

        clearInterval(stepInterval);
        setGenerationStep(5); // Mark as complete
        return result;
      } catch (error) {
        clearInterval(stepInterval);
        throw error;
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/interests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/enrolled-courses"] });

      // Wait longer for user to see the completion message
      setTimeout(() => {
        setShowGeneration(false);
        toast({
          title: "🎉 Course Created!",
          description: "Your personalized course is ready! Head to your dashboard to start learning.",
        });

        // Redirect to dashboard
        setLocation("/dashboard");
      }, 5000); // 5 seconds to read the completion message
    },
    onError: (error: any) => {
      setShowGeneration(false);
      setGenerationStep(0);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate your course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddTopic = () => {
    if (topicInput.trim() && !topics.includes(topicInput.trim())) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput("");
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic));
  };

  const onSubmit = (data: z.infer<typeof interestSchema>) => {
    if (topics.length === 0) {
      toast({
        title: "Add at least one topic",
        description: "Please add topics you're interested in learning about.",
        variant: "destructive",
      });
      return;
    }
    generateCourseMutation.mutate(data);
  };

  return (
    <>
      {/* Generation Progress Overlay */}
      <GenerationProgress
        isVisible={showGeneration}
        courseTitle={generatedCourseTitle}
        tierLevel="start"
        currentStep={generationStep}
        totalSteps={5}
        onComplete={() => { }}
      />

      <motion.div
        className="max-w-2xl mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold font-heading" data-testid="text-page-title">
              Your Learning Interests
            </h1>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Tell us what you want to learn, and we'll create a personalized course tailored to your goals.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <Sparkles className="h-5 w-5 mx-auto mb-1 text-violet-500" />
              <p className="text-xs text-muted-foreground">AI-Powered</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <BookOpen className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Custom Course</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <Target className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-xs text-muted-foreground">Goal-Focused</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Your Learning Path</CardTitle>
            <CardDescription>
              We'll generate a complete course with Tier 1 ready immediately
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Topics Input */}
                <div className="space-y-4">
                  <FormLabel>Topics of Interest *</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Machine Learning, Web Development, Data Science"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTopic();
                        }
                      }}
                      data-testid="input-topic"
                    />
                    <Button
                      type="button"
                      onClick={handleAddTopic}
                      variant="secondary"
                      data-testid="button-add-topic"
                    >
                      Add
                    </Button>
                  </div>
                  {topics.length > 0 && (
                    <div className="flex flex-wrap gap-2" data-testid="topics-list">
                      {topics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="gap-1 py-1.5 px-3">
                          {topic}
                          <button
                            type="button"
                            onClick={() => handleRemoveTopic(topic)}
                            className="ml-1 hover:bg-background/50 rounded-full p-0.5"
                            data-testid={`button-remove-topic-${topic}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Add the topics you want to learn about. The first topic will be the primary focus.
                  </p>
                </div>

                {/* Learning Goals */}
                <FormField
                  control={form.control}
                  name="learningGoals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning Goals *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What do you want to achieve? Be specific about your objectives..."
                          className="min-h-32 resize-none"
                          {...field}
                          data-testid="input-goals"
                        />
                      </FormControl>
                      <FormDescription>
                        Be specific about your objectives to get a more tailored course.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Learning Pace */}
                <FormField
                  control={form.control}
                  name="preferredPace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Learning Pace</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-pace">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="slow">Relaxed (15-30 min/day)</SelectItem>
                          <SelectItem value="moderate">Moderate (30-60 min/day)</SelectItem>
                          <SelectItem value="fast">Intensive (60+ min/day)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How much time can you dedicate to learning each day?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full gap-2"
                  size="lg"
                  disabled={generateCourseMutation.isPending || topics.length === 0}
                  data-testid="button-save-interests"
                >
                  {generateCourseMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Your Course...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate My Personalized Course
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  This will create a personalized course with Tier 1 (Beginner) ready immediately.
                  You can unlock Tier 2 and 3 later as you progress.
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

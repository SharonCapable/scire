import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Loader2 } from "lucide-react";

const interestSchema = z.object({
  learningGoals: z.string().min(10, "Please describe your learning goals (at least 10 characters)"),
  preferredPace: z.enum(["slow", "moderate", "fast"]),
});

export default function Interests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");

  const { data: existingInterests } = useQuery({
    queryKey: ["/api/interests"],
  });

  const form = useForm({
    resolver: zodResolver(interestSchema),
    defaultValues: {
      learningGoals: existingInterests?.learningGoals || "",
      preferredPace: existingInterests?.preferredPace || "moderate",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: z.infer<typeof interestSchema>) => {
      return await apiRequest("POST", "/api/interests", {
        topics,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interests"] });
      toast({
        title: "Interests saved!",
        description: "We'll curate personalized course recommendations for you.",
      });
      setLocation("/courses");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your interests. Please try again.",
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
    saveMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 font-heading" data-testid="text-page-title">
          Your Learning Interests
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Tell us what you want to learn, and we'll recommend courses tailored to your goals.
        </p>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormLabel>Topics of Interest</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Mathematics, Programming, Biology"
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
                  data-testid="button-add-topic"
                >
                  Add
                </Button>
              </div>
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2" data-testid="topics-list">
                  {topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="gap-1">
                      {topic}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(topic)}
                        className="hover-elevate rounded-full"
                        data-testid={`button-remove-topic-${topic}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="learningGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you want to achieve through learning..."
                      className="min-h-32 resize-none"
                      {...field}
                      data-testid="input-goals"
                    />
                  </FormControl>
                  <FormDescription>
                    Be specific about your objectives to get better recommendations.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <SelectItem value="slow">Slow (15-30 min/day)</SelectItem>
                      <SelectItem value="moderate">Moderate (30-60 min/day)</SelectItem>
                      <SelectItem value="fast">Fast (60+ min/day)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How much time can you dedicate to learning each day?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={saveMutation.isPending}
                data-testid="button-save-interests"
              >
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save & Get Recommendations
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}

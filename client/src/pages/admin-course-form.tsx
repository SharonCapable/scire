import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  sourceType: z.enum(["manual", "openstax", "youtube", "other"]),
  sourceUrl: z.string().optional(),
  content: z.string().min(50, "Content must be at least 50 characters"),
});

export default function AdminCourseForm() {
  const [, params] = useRoute("/admin/course/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const courseId = params?.id === "new" ? null : params?.id;
  const [generatingTiers, setGeneratingTiers] = useState(false);

  const { data: course } = useQuery({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const form = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: course?.title || "",
      description: course?.description || "",
      sourceType: course?.sourceType || "manual",
      sourceUrl: course?.sourceUrl || "",
      content: course?.content || "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: z.infer<typeof courseSchema>) => {
      if (courseId) {
        return await apiRequest("PUT", `/api/courses/${courseId}`, data);
      } else {
        return await apiRequest("POST", "/api/courses", data);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({
        title: courseId ? "Course updated" : "Course created",
        description: "The course has been saved successfully.",
      });
      setLocation(`/admin/course/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateTiersMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiRequest("POST", `/api/courses/${courseId}/generate-tiers`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      toast({
        title: "Tiers generated!",
        description: "AI has created learning tiers for this course.",
      });
      setGeneratingTiers(false);
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Could not generate tiers. Please try again.",
        variant: "destructive",
      });
      setGeneratingTiers(false);
    },
  });

  const fetchFromUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      return await apiRequest("POST", "/api/fetch-content", { url });
    },
    onSuccess: (data) => {
      form.setValue("content", data.content);
      form.setValue("title", data.title || form.getValues("title"));
      toast({
        title: "Content fetched",
        description: "Content has been loaded from the URL.",
      });
    },
    onError: () => {
      toast({
        title: "Fetch failed",
        description: "Could not fetch content from URL. Please try manually.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof courseSchema>) => {
    saveMutation.mutate(data);
  };

  const handleFetchFromUrl = () => {
    const url = form.getValues("sourceUrl");
    if (url) {
      fetchFromUrlMutation.mutate(url);
    }
  };

  const handleGenerateTiers = () => {
    if (courseId) {
      setGeneratingTiers(true);
      generateTiersMutation.mutate(courseId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/admin/courses">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading" data-testid="text-page-title">
          {courseId ? "Edit Course" : "Create New Course"}
        </h1>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Course Details</TabsTrigger>
          {courseId && <TabsTrigger value="tiers">Learning Tiers</TabsTrigger>}
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>
                Add or fetch educational content to create a new course.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Introduction to Programming" {...field} data-testid="input-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of the course..."
                            {...field}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sourceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-source-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manual">Manual Entry</SelectItem>
                            <SelectItem value="openstax">OpenStax</SelectItem>
                            <SelectItem value="youtube">YouTube / MIT OCW</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sourceUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source URL (Optional)</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="https://..." {...field} data-testid="input-source-url" />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleFetchFromUrl}
                            disabled={!field.value || fetchFromUrlMutation.isPending}
                            data-testid="button-fetch-content"
                          >
                            {fetchFromUrlMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Fetch
                          </Button>
                        </div>
                        <FormDescription>
                          Provide a URL to automatically fetch content (OpenStax, YouTube, etc.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste or type course content here..."
                            className="min-h-64 font-mono text-sm"
                            {...field}
                            data-testid="input-content"
                          />
                        </FormControl>
                        <FormDescription>
                          Full text content that will be used to generate learning modules.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={saveMutation.isPending}
                      data-testid="button-save-course"
                    >
                      {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {courseId ? "Update Course" : "Create Course"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {courseId && (
          <TabsContent value="tiers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Learning Tiers</CardTitle>
                <CardDescription>
                  Generate structured learning paths from your course content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGenerateTiers}
                  disabled={generatingTiers}
                  data-testid="button-generate-tiers"
                >
                  {generatingTiers ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Learning Tiers
                    </>
                  )}
                </Button>

                {course?.tiers?.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-semibold">Current Tiers</h3>
                    {course.tiers.map((tier: any) => (
                      <Card key={tier.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{tier.title}</CardTitle>
                          <CardDescription>{tier.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {tier.modules?.length || 0} modules
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

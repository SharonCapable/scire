import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, BookOpen, ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminCourses() {
  const { toast } = useToast();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/admin/courses"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiRequest("DELETE", `/api/courses/${courseId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({
        title: "Course deleted",
        description: "The course has been removed from the platform.",
      });
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12">
      <div className="mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold font-heading" data-testid="text-page-title">
          Manage Courses
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : courses?.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first course to get started.
          </p>
          <Link href="/admin/course/new">
            <Button>Create Course</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course: any) => (
            <Card key={course.id} data-testid={`card-course-${course.id}`}>
              <CardHeader className="gap-2">
                <CardTitle className="text-xl font-heading line-clamp-2">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{course.sourceType}</Badge>
                  <Badge variant="secondary">{course.tierCount || 0} tiers</Badge>
                </div>
              </CardContent>
              <CardFooter className="gap-2 flex-wrap">
                <Link href={`/admin/course/${course.id}`} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm" data-testid={`button-edit-${course.id}`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" data-testid={`button-delete-${course.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete course?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{course.title}" and all its content. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(course.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

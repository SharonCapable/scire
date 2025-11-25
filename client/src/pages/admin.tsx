import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, TrendingUp, Plus } from "lucide-react";

export default function Admin() {
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading" data-testid="text-page-title">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage courses and track platform activity</p>
        </div>
        <Link href="/admin/course/new">
          <Button data-testid="button-create-course">
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="gap-1 pb-4">
            <CardDescription>Total Courses</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalCourses || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1 pb-4">
            <CardDescription>Active Learners</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalUsers || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Users className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1 pb-4">
            <CardDescription>Total Enrollments</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalEnrollments || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-auto p-6 justify-start"
            onClick={() => setLocation("/admin/courses")}
            data-testid="button-manage-courses"
          >
            <div className="text-left">
              <h3 className="font-semibold mb-1">Manage Courses</h3>
              <p className="text-sm text-muted-foreground">View, edit, or delete existing courses</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-6 justify-start"
            onClick={() => setLocation("/admin/course/new")}
            data-testid="button-add-course"
          >
            <div className="text-left">
              <h3 className="font-semibold mb-1">Add New Course</h3>
              <p className="text-sm text-muted-foreground">Create from URL or upload content</p>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

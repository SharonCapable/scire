import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  BarChart3,
  Upload,
  Settings,
  GraduationCap,
  Clock,
  Eye,
  Edit,
  ArrowRight
} from "lucide-react";

interface AdminStats {
  totalCourses: number;
  totalUsers: number;
  totalEnrollments: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  moduleCount: number;
  tierCount: number;
}

export default function Admin() {
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
  });

  const recentCourses = courses?.slice(0, 5) || [];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="mb-8" variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <GraduationCap className="h-6 w-6 text-violet-500" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading" data-testid="text-page-title">
                Educator Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground">Manage your courses and monitor student progress</p>
          </div>
          <Link href="/admin/course/new">
            <Button size="lg" className="gap-2 shadow-lg" data-testid="button-create-course">
              <Plus className="h-5 w-5" />
              Create Course
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={itemVariants}>
        <Card className="relative overflow-hidden hover-elevate">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="gap-1 pb-2">
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Courses
            </CardDescription>
            <CardTitle className="text-4xl font-bold">{stats?.totalCourses || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Active courses in your library
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover-elevate">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="gap-1 pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Students
            </CardDescription>
            <CardTitle className="text-4xl font-bold">{stats?.totalUsers || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Learning on your platform
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover-elevate">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="gap-1 pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Enrollments
            </CardDescription>
            <CardTitle className="text-4xl font-bold">{stats?.totalEnrollments || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Course enrollments this month
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" variants={itemVariants}>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and management tools</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="h-auto p-6 w-full justify-start hover:bg-violet-500/5 hover:border-violet-500/50 transition-all"
                  onClick={() => setLocation("/admin/courses")}
                  data-testid="button-manage-courses"
                >
                  <BookOpen className="h-10 w-10 mr-4 text-violet-500" />
                  <div className="text-left">
                    <h3 className="font-semibold mb-1">Manage Courses</h3>
                    <p className="text-sm text-muted-foreground">View, edit, or delete courses</p>
                  </div>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="h-auto p-6 w-full justify-start hover:bg-emerald-500/5 hover:border-emerald-500/50 transition-all"
                  onClick={() => setLocation("/admin/course/new")}
                  data-testid="button-add-course"
                >
                  <Upload className="h-10 w-10 mr-4 text-emerald-500" />
                  <div className="text-left">
                    <h3 className="font-semibold mb-1">Upload Content</h3>
                    <p className="text-sm text-muted-foreground">Create course from URL or file</p>
                  </div>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="h-auto p-6 w-full justify-start hover:bg-blue-500/5 hover:border-blue-500/50 transition-all"
                  onClick={() => setLocation("/admin/analytics")}
                >
                  <BarChart3 className="h-10 w-10 mr-4 text-blue-500" />
                  <div className="text-left">
                    <h3 className="font-semibold mb-1">View Analytics</h3>
                    <p className="text-sm text-muted-foreground">Student progress & insights</p>
                  </div>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="h-auto p-6 w-full justify-start hover:bg-orange-500/5 hover:border-orange-500/50 transition-all"
                  onClick={() => setLocation("/admin/students")}
                >
                  <Users className="h-10 w-10 mr-4 text-orange-500" />
                  <div className="text-left">
                    <h3 className="font-semibold mb-1">Student Management</h3>
                    <p className="text-sm text-muted-foreground">View and manage students</p>
                  </div>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "New enrollment", course: "Machine Learning", time: "2 min ago" },
                { action: "Course completed", course: "Data Science", time: "15 min ago" },
                { action: "New enrollment", course: "Python Basics", time: "1 hour ago" },
                { action: "Module completed", course: "AI Fundamentals", time: "2 hours ago" },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.action}</p>
                    <p className="text-muted-foreground truncate">{activity.course}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Courses */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Courses</CardTitle>
                <CardDescription>Recently created and updated courses</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setLocation("/admin/courses")} className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentCourses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first course to start teaching
                </p>
                <Button onClick={() => setLocation("/admin/course/new")} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Course
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/admin/course/${course.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{course.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{course.description}</p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {course.tierCount || 0} Tiers
                      </Badge>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {course.moduleCount || 0} Modules
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth-modal";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import OnboardingPage from "@/pages/onboarding";
import Home from "@/pages/home";
import Interests from "@/pages/interests";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import Learn from "@/pages/learn";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import AdminCourses from "@/pages/admin-courses";
import AdminCourseForm from "@/pages/admin-course-form";
import Notifications from "@/pages/notifications";
import SettingsPage from "@/pages/settings";
import SSOCallback from "@/pages/sso-callback";
import { StudentOnly, AdminOnly } from "@/components/role-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings as SettingsIcon } from "lucide-react";

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isLoaded } = useClerkAuth();

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

// Onboarding guard - redirects if not onboarded
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If user hasn't completed onboarding, redirect
  if (user && !user.onboardingCompleted && !user.role) {
    return <Redirect to="/onboarding" />;
  }

  return <>{children}</>;
}

// User menu component
function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.username?.[0]?.toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.picture} alt={user.name || user.username} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || user.username}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.location.href = "/settings"}>
          <SettingsIcon className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// App router with protected routes
function AppRouter() {
  const { isAuthenticated, user } = useAuth();

  // Wrapper for protected routes with the main layout
  const ProtectedWithLayout = ({ children }: { children: React.ReactNode }) => (
    <ProtectedRoute>
      <OnboardingGuard>
        <MainAppLayout>{children}</MainAppLayout>
      </OnboardingGuard>
    </ProtectedRoute>
  );

  return (
    <Switch>
      {/* Public landing page - shown only when not authenticated */}
      <Route path="/">
        {isAuthenticated ? (
          <Redirect to={user?.role === "educator" ? "/admin" : "/dashboard"} />
        ) : (
          <LandingPage />
        )}
      </Route>

      {/* Onboarding - protected but outside main layout */}
      <Route path="/onboarding">
        <ProtectedRoute>
          <OnboardingPage />
        </ProtectedRoute>
      </Route>

      {/* SSO Callback for OAuth */}
      <Route path="/sso-callback" component={SSOCallback} />

      {/* Protected routes with main layout */}
      <Route path="/home">
        <ProtectedWithLayout><Home /></ProtectedWithLayout>
      </Route>

      <Route path="/interests">
        <ProtectedWithLayout>
          <StudentOnly fallbackPath="/admin"><Interests /></StudentOnly>
        </ProtectedWithLayout>
      </Route>

      <Route path="/courses">
        <ProtectedWithLayout><Courses /></ProtectedWithLayout>
      </Route>

      <Route path="/course/:id">
        <ProtectedWithLayout><CourseDetail /></ProtectedWithLayout>
      </Route>

      <Route path="/learn/:id">
        <ProtectedWithLayout><Learn /></ProtectedWithLayout>
      </Route>

      <Route path="/dashboard">
        <ProtectedWithLayout>
          <StudentOnly fallbackPath="/admin"><Dashboard /></StudentOnly>
        </ProtectedWithLayout>
      </Route>

      <Route path="/profile">
        <ProtectedWithLayout><Profile /></ProtectedWithLayout>
      </Route>

      <Route path="/settings">
        <ProtectedWithLayout><SettingsPage /></ProtectedWithLayout>
      </Route>

      <Route path="/admin">
        <ProtectedWithLayout>
          <AdminOnly fallbackPath="/dashboard"><Admin /></AdminOnly>
        </ProtectedWithLayout>
      </Route>

      <Route path="/admin/courses">
        <ProtectedWithLayout>
          <AdminOnly fallbackPath="/dashboard"><AdminCourses /></AdminOnly>
        </ProtectedWithLayout>
      </Route>

      <Route path="/admin/course/:id">
        <ProtectedWithLayout>
          <AdminOnly fallbackPath="/dashboard"><AdminCourseForm /></AdminOnly>
        </ProtectedWithLayout>
      </Route>

      <Route path="/notifications">
        <ProtectedWithLayout><Notifications /></ProtectedWithLayout>
      </Route>

      {/* 404 */}
      <Route>
        <ProtectedWithLayout><NotFound /></ProtectedWithLayout>
      </Route>
    </Switch>
  );
}

// Main app layout with sidebar
function MainAppLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-xl font-bold font-heading">SCIRE</h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  if (!clerkPubKey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-destructive mb-4">Configuration Error</h1>
          <p className="text-muted-foreground">
            Missing Clerk Publishable Key. Please add <code className="bg-muted px-2 py-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> to your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <AppRouter />
              <AuthModal />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

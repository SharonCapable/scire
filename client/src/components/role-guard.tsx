import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: ('student' | 'educator')[];
    fallbackPath?: string;
    showAccessDenied?: boolean;
}

export function RoleGuard({
    children,
    allowedRoles,
    fallbackPath,
    showAccessDenied = true,
}: RoleGuardProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!user) {
        return <Redirect to="/" />;
    }

    const hasAccess = user.role && allowedRoles.includes(user.role);

    if (!hasAccess) {
        if (fallbackPath) {
            return <Redirect to={fallbackPath} />;
        }

        if (showAccessDenied) {
            return <AccessDenied userRole={user.role} allowedRoles={allowedRoles} />;
        }

        return null;
    }

    return <>{children}</>;
}

// Student-only route wrapper
export function StudentOnly({ children, fallbackPath }: { children: ReactNode; fallbackPath?: string }) {
    return (
        <RoleGuard allowedRoles={["student"]} fallbackPath={fallbackPath}>
            {children}
        </RoleGuard>
    );
}

// Educator/Admin-only route wrapper
export function AdminOnly({ children, fallbackPath }: { children: ReactNode; fallbackPath?: string }) {
    return (
        <RoleGuard allowedRoles={["educator"]} fallbackPath={fallbackPath}>
            {children}
        </RoleGuard>
    );
}

// Access Denied component
function AccessDenied({
    userRole,
    allowedRoles,
}: {
    userRole?: string;
    allowedRoles: string[];
}) {
    const { user } = useAuth();

    const roleLabels: Record<string, string> = {
        student: "Student",
        educator: "Educator",
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                    <CardDescription>
                        This page is only accessible to{" "}
                        {allowedRoles.map((role) => roleLabels[role] || role).join(" or ")} users.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-amber-500">Your current role:</p>
                            <p className="text-muted-foreground">
                                {userRole ? roleLabels[userRole] || userRole : "Not assigned"}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.history.back()}
                        >
                            Go Back
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => {
                                window.location.href = user?.role === "educator" ? "/admin" : "/dashboard";
                            }}
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Hook to check role access
export function useRoleAccess() {
    const { user } = useAuth();

    return {
        isStudent: user?.role === "student",
        isEducator: user?.role === "educator",
        hasRole: (role: "student" | "educator") => user?.role === role,
        canAccessStudentFeatures: user?.role === "student",
        canAccessAdminFeatures: user?.role === "educator",
    };
}

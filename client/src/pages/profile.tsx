import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    User,
    Mail,
    Shield,
    Calendar,
    GraduationCap,
    BookOpen,
    Pencil,
    Check,
    X,
} from "lucide-react";

export default function Profile() {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(user?.name || "");

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">Please sign in to view your profile.</p>
            </div>
        );
    }

    const initials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
        : user.username?.[0]?.toUpperCase() || "U";

    const roleInfo = {
        student: {
            label: "Student",
            icon: GraduationCap,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        educator: {
            label: "Educator",
            icon: BookOpen,
            color: "text-violet-500",
            bgColor: "bg-violet-500/10",
        },
    };

    const role = user.role ? roleInfo[user.role] : null;

    return (
        <motion.div
            className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2">Profile</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card className="md:col-span-1">
                    <CardContent className="pt-6 text-center">
                        <div className="relative inline-block mb-4">
                            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                <AvatarImage src={user.picture} alt={user.name || user.username} />
                                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            {role && (
                                <div
                                    className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full ${role.bgColor} ${role.color} text-xs font-medium flex items-center gap-1`}
                                >
                                    <role.icon className="h-3 w-3" />
                                    {role.label}
                                </div>
                            )}
                        </div>

                        <h2 className="text-xl font-semibold mb-1">{user.name || user.username}</h2>
                        <p className="text-sm text-muted-foreground mb-4">{user.email}</p>

                        <Separator className="my-4" />

                        <div className="space-y-3 text-left">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Provider</span>
                                <Badge variant="outline" className="capitalize">
                                    {user.provider || "Local"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Onboarding</span>
                                <Badge variant={user.onboardingCompleted ? "default" : "secondary"}>
                                    {user.onboardingCompleted ? "Completed" : "Pending"}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Details */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Account Details
                        </CardTitle>
                        <CardDescription>Your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Display Name
                                </Label>
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <Input
                                            id="name"
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            placeholder="Your name"
                                        />
                                        <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" onClick={() => setIsEditing(false)}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="name"
                                            value={user.name || user.username}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    Email
                                </Label>
                                <Input id="email" value={user.email || "Not set"} disabled className="bg-muted" />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    Role
                                </Label>
                                <Input
                                    value={role?.label || "Not assigned"}
                                    disabled
                                    className="bg-muted capitalize"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    Member Since
                                </Label>
                                <Input value="December 2024" disabled className="bg-muted" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Security Settings
                        </CardTitle>
                        <CardDescription>Manage your account security</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 rounded-lg border bg-muted/30">
                                <h4 className="font-medium mb-2">Authentication Method</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                    You are signed in with {user.provider === "clerk" ? "Clerk" : user.provider}.
                                </p>
                                <Badge variant="outline" className="capitalize">
                                    {user.provider || "Email"}
                                </Badge>
                            </div>

                            <div className="p-4 rounded-lg border bg-muted/30">
                                <h4 className="font-medium mb-2">Account Status</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Your account is active and in good standing.
                                </p>
                                <Badge className="bg-emerald-500">Active</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Settings,
    Bell,
    Clock,
    BookOpen,
    Brain,
    Save,
    Loader2,
    Database,
    AlertTriangle,
} from "lucide-react";
import type { UserSettings } from "@shared/types";

export default function SettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    // Fetch current settings
    const { data: settings, isLoading } = useQuery<UserSettings>({
        queryKey: ["/api/user/settings"],
    });

    // Local state for form
    const [formState, setFormState] = useState<Partial<UserSettings>>({});

    // Get current value with fallback to settings or default
    const getValue = <K extends keyof UserSettings>(key: K, defaultValue: UserSettings[K]): UserSettings[K] => {
        if (key in formState) return formState[key] as UserSettings[K];
        if (settings && key in settings) return settings[key];
        return defaultValue;
    };

    // Update settings mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (data: Partial<UserSettings>) => {
            return await apiRequest("PUT", "/api/user/settings", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
            toast({
                title: "Settings Saved",
                description: "Your preferences have been updated.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to save settings.",
                variant: "destructive",
            });
        },
    });

    const handleSave = () => {
        updateSettingsMutation.mutate(formState);
    };

    const updateField = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        setFormState(prev => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div
            className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Settings className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold font-heading">Settings</h1>
                </div>
                <p className="text-muted-foreground">
                    Manage your notification preferences and learning reminders.
                </p>
            </div>

            <div className="space-y-6">
                {/* Notification Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notification Preferences
                        </CardTitle>
                        <CardDescription>
                            Choose what notifications you want to receive.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* New Courses */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    New Courses
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Get notified when new courses are available from educators.
                                </p>
                            </div>
                            <Switch
                                checked={getValue("notifyNewCourses", true)}
                                onCheckedChange={(checked) => updateField("notifyNewCourses", checked)}
                            />
                        </div>

                        <Separator />

                        {/* Flashcard Reminders */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base flex items-center gap-2">
                                    <Brain className="h-4 w-4" />
                                    Flashcard Reminders
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Reminders to practice your flashcards.
                                </p>
                            </div>
                            <Switch
                                checked={getValue("notifyFlashcardReminders", true)}
                                onCheckedChange={(checked) => updateField("notifyFlashcardReminders", checked)}
                            />
                        </div>

                        <Separator />

                        {/* Assessment Reminders */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Assessment Reminders
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Reminders to complete pending assessments.
                                </p>
                            </div>
                            <Switch
                                checked={getValue("notifyAssessmentReminders", true)}
                                onCheckedChange={(checked) => updateField("notifyAssessmentReminders", checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Reminder Frequency */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Reminder Frequency
                        </CardTitle>
                        <CardDescription>
                            How often would you like to receive learning reminders?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Flashcard Frequency */}
                        <div className="grid gap-2">
                            <Label>Flashcard Review Frequency</Label>
                            <Select
                                value={getValue("flashcardReminderFrequency", "daily")}
                                onValueChange={(value) => updateField("flashcardReminderFrequency", value as any)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="never">Never</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assessment Frequency */}
                        <div className="grid gap-2">
                            <Label>Assessment Reminder Frequency</Label>
                            <Select
                                value={getValue("assessmentReminderFrequency", "daily")}
                                onValueChange={(value) => updateField("assessmentReminderFrequency", value as any)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="never">Never</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Preferred Time */}
                        <div className="grid gap-2">
                            <Label>Preferred Reminder Time</Label>
                            <Input
                                type="time"
                                value={getValue("preferredReminderTime", "09:00") || "09:00"}
                                onChange={(e) => updateField("preferredReminderTime", e.target.value)}
                                className="max-w-[200px]"
                            />
                            <p className="text-sm text-muted-foreground">
                                We'll send reminders around this time.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={updateSettingsMutation.isPending || Object.keys(formState).length === 0}
                        className="gap-2"
                    >
                        {updateSettingsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

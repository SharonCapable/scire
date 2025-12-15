import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface UnderstandingCheckProps {
    moduleId: string;
    prompt: string;
    onComplete: (score: number) => void;
}

interface FeedbackResponse {
    score: number;
    feedback: string;
    areasForImprovement: string[];
}

export function UnderstandingCheckComponent({ moduleId, prompt, onComplete }: UnderstandingCheckProps) {
    const [response, setResponse] = useState("");
    const [result, setResult] = useState<FeedbackResponse | null>(null);

    const submitMutation = useMutation({
        mutationFn: async (text: string) => {
            const res = await apiRequest("POST", `/api/modules/${moduleId}/validate`, {
                explanation: text,
            });
            return res.json();
        },
        onSuccess: (data: FeedbackResponse) => {
            setResult(data);
            if (data.score >= 70) {
                onComplete(data.score);
            }
        },
    });

    const handleSubmit = () => {
        if (response.trim().length < 20) return;
        submitMutation.mutate(response);
    };

    if (result) {
        const passed = result.score >= 70;

        return (
            <Card className="w-full max-w-2xl mx-auto mt-8 border-2" style={{ borderColor: passed ? "var(--green-500)" : "var(--orange-500)" }}>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        {passed ? (
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        ) : (
                            <AlertCircle className="h-8 w-8 text-orange-500" />
                        )}
                        <CardTitle>{passed ? "Great Job!" : "Keep Trying"}</CardTitle>
                    </div>
                    <CardDescription>
                        You scored {result.score}/100 on this understanding check.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center">
                            <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                            AI Feedback
                        </h4>
                        <p className="text-sm leading-relaxed">{result.feedback}</p>
                    </div>

                    {result.areasForImprovement && result.areasForImprovement.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2 text-sm">Areas for Improvement:</h4>
                            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                                {result.areasForImprovement.map((area, i) => (
                                    <li key={i}>{area}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        {!passed ? (
                            <Button onClick={() => setResult(null)} variant="outline">
                                Try Again
                            </Button>
                        ) : (
                            <Button onClick={() => onComplete(result.score)} className="bg-green-600 hover:bg-green-700">
                                Continue Learning
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto mt-8">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <span>Understanding Check</span>
                </CardTitle>
                <CardDescription>
                    Explain the concept in your own words to verify your understanding.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="font-medium">{prompt}</p>
                </div>

                <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your explanation here... (min 20 characters)"
                    className="min-h-[150px] resize-none"
                />

                {response.length > 0 && response.length < 20 && (
                    <p className="text-xs text-orange-500">
                        Please enter at least {20 - response.length} more characters.
                    </p>
                )}

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={response.length < 20 || submitMutation.isPending}
                        className="w-full sm:w-auto"
                    >
                        {submitMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            "Submit Explanation"
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

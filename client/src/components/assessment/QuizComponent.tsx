import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QuizQuestion } from "@shared/types";

interface QuizProps {
    questions: QuizQuestion[];
    onComplete: (score: number) => void;
}

export function QuizComponent({ questions, onComplete }: QuizProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    const handleSubmit = () => {
        if (selectedAnswer === null) return;

        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        if (isCorrect) {
            setScore(score + 1);
        }
        setIsSubmitted(true);
        setShowExplanation(true);
    };

    const handleNext = () => {
        if (isLastQuestion) {
            const finalScore = Math.round(((score + (selectedAnswer === currentQuestion.correctAnswer ? 1 : 0)) / questions.length) * 100);
            onComplete(finalScore);
        } else {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
            setIsSubmitted(false);
            setShowExplanation(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto mt-8">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Quiz</span>
                    <span className="text-sm font-normal text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-lg font-medium">{currentQuestion.question}</div>

                <RadioGroup
                    value={selectedAnswer?.toString()}
                    onValueChange={(value) => !isSubmitted && setSelectedAnswer(parseInt(value))}
                    className="space-y-3"
                >
                    {currentQuestion.options.map((option, index) => (
                        <div
                            key={index}
                            className={`flex items-center space-x-2 p-4 rounded-lg border transition-colors ${isSubmitted
                                    ? index === currentQuestion.correctAnswer
                                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900"
                                        : index === selectedAnswer
                                            ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900"
                                            : "border-transparent"
                                    : selectedAnswer === index
                                        ? "border-primary bg-primary/5"
                                        : "border-transparent hover:bg-muted"
                                }`}
                        >
                            <RadioGroupItem value={index.toString()} id={`option-${index}`} disabled={isSubmitted} />
                            <Label
                                htmlFor={`option-${index}`}
                                className="flex-grow cursor-pointer font-normal"
                            >
                                {option}
                            </Label>
                            {isSubmitted && index === currentQuestion.correctAnswer && (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {isSubmitted && index === selectedAnswer && index !== currentQuestion.correctAnswer && (
                                <XCircle className="h-5 w-5 text-red-500" />
                            )}
                        </div>
                    ))}
                </RadioGroup>

                <AnimatePresence>
                    {showExplanation && currentQuestion.explanation && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="p-4 bg-muted rounded-lg text-sm"
                        >
                            <span className="font-semibold">Explanation: </span>
                            {currentQuestion.explanation}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-end pt-4">
                    {!isSubmitted ? (
                        <Button onClick={handleSubmit} disabled={selectedAnswer === null}>
                            Check Answer
                        </Button>
                    ) : (
                        <Button onClick={handleNext}>
                            {isLastQuestion ? "Finish Quiz" : "Next Question"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

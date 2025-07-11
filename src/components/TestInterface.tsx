"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as Tone from 'tone';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTestConfigStore } from '@/store/testConfigStore';
import { useUserStore } from '@/store/userStore';
import { useQuestionStore } from '@/store/questionStore'; // Import question store
import type { Question } from '@/types/question';
import { cn } from '@/lib/utils'; // Import cn utility
import { CheckCircle, XCircle, Smile, Frown, Clock, FileQuestion, Percent, Loader2, AlertTriangle, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AnswerStatus = 'correct' | 'incorrect' | 'unanswered';
type TestState = 'loading' | 'running' | 'paused' | 'finished' | 'reviewing' | 'error';

export function TestInterface() {
  const router = useRouter();
  const { config } = useTestConfigStore();
  const { user } = useUserStore();
  const { questions } = useQuestionStore(); // Get questions from the store
  const { toast } = useToast();


  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, { answer: string; status: AnswerStatus }>>({});
  const [timeLeft, setTimeLeft] = useState(config.timer || 0); // Initialize with config or 0
  const [testState, setTestState] = useState<TestState>('loading'); // Start in loading state
  const [showResultModal, setShowResultModal] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [isPassed, setIsPassed] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewStartTime, setReviewStartTime] = useState<number | null>(null);

  const synth = useRef<Tone.Synth | null>(null);
  const loop = useRef<Tone.Loop | null>(null);

  // --- Initial Setup & Validation ---
  useEffect(() => {
    // 1. Check for user and basic config
    if (!user) {
        console.warn('User missing, redirecting to login.');
        toast({ title: "Authentication Required", description: "Please log in first.", variant: "destructive" });
        router.push('/');
        return;
    }
    if (!config.timer || !config.questionLimit || !config.passingPercentage) {
        console.warn('Configuration missing, redirecting to configure.');
        toast({ title: "Configuration Missing", description: "Please configure the test settings first.", variant: "destructive" });
        router.push('/configure');
        return;
    }

    // 2. Check if questions are loaded from the store
    if (questions.length === 0) {
        console.warn('No questions found in store, redirecting to configure.');
        toast({ title: "No Questions Loaded", description: "Please upload a question file on the configuration page.", variant: "destructive" });
        router.push('/configure');
        return; // Prevent further execution if no questions
    }

    // 3. If checks pass, set initial state
    setTimeLeft(config.timer);
    setTestState('running'); // Move to running state only after checks

  }, [config, user, router, questions, toast]); // Add questions to dependency array


  // --- Audio Setup ---
  useEffect(() => {
      // Initialize synth on component mount
    const initializeAudio = async () => {
        try {
            await Tone.start(); // Required for audio context in browsers
            synth.current = new Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.1, sustain: 0.01, release: 0.1 },
                volume: -20 // Adjust volume as needed
            }).toDestination();

            loop.current = new Tone.Loop((time) => {
            if (synth.current && testState === 'running' && timeLeft > 0) {
                synth.current.triggerAttackRelease('C5', '16n', time); // Play a short 'C5' note
            }
            }, '1s').start(0); // Run every 1 second

            Tone.Transport.start();
        } catch (error) {
            console.error("Failed to initialize audio:", error);
             toast({ title: "Audio Error", description: "Could not initialize timer sound.", variant:"destructive"});
        }
    };

    // Only initialize audio if the test is actually running
    if(testState === 'running') {
         initializeAudio();
    }


    // Cleanup audio resources on unmount
    return () => {
      loop.current?.stop();
      loop.current?.dispose();
      synth.current?.dispose();
       // Only stop transport if it was started
       if (Tone.Transport.state === 'started') {
            Tone.Transport.stop();
            Tone.Transport.cancel(); // Clear any scheduled events
       }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testState]); // Run audio setup when testState changes to 'running'


  // --- Calculated Values ---
  const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);
  const totalQuestions = questions.length; // Now derived from the store's questions

  const { correctAnswersCount, incorrectAnswers } = useMemo(() => {
      let correct = 0;
      const incorrect: (Question & { userAnswer?: string })[] = [];

      questions.forEach((q, index) => {
          const answerData = answers[index];
          if (answerData) {
              if (answerData.status === 'correct') {
                  correct++;
              } else if (answerData.status === 'incorrect') {
                  incorrect.push({ ...q, userAnswer: answerData.answer });
              }
          }
          // Unanswered questions are neither correct nor incorrect for counting purposes here
      });
      return { correctAnswersCount: correct, incorrectAnswers: incorrect };
  }, [answers, questions]);


  const scorePercentage = useMemo(() => {
      // Calculate score based on total questions in the loaded set
      return totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0;
  }, [correctAnswersCount, totalQuestions]);


  // --- Test Finish Logic (triggered by timer or last question submission) ---
   const finishTest = useCallback(() => {
     console.log("Attempting to finish test. Current state:", testState);
     if (testState !== 'running') return; // Prevent multiple finishes

     console.log("Finishing test...");
     setTestState('finished');
     const finalScorePercentage = totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0;
     const passed = finalScorePercentage >= config.passingPercentage;
     setIsPassed(passed);
     setShowResultModal(true);
      // Stop the timer sound explicitly when the test finishes
     loop.current?.stop();
     Tone.Transport.pause();
   }, [testState, correctAnswersCount, totalQuestions, config.passingPercentage]);


  // --- Timer Logic ---
  useEffect(() => {
    if (testState !== 'running' || timeLeft <= 0 || questions.length === 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
              clearInterval(timerId); // Stop interval when time reaches 0
              // Use a flag to ensure finishTest is called only once from the timer
              if (testState === 'running') {
                  finishTest();
              }
              return 0;
          }
          return newTime;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [testState, timeLeft, questions.length, finishTest]); // Dependencies


  // --- Event Handlers ---
  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQuestion || testState !== 'running') return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const status: AnswerStatus = isCorrect ? 'correct' : 'incorrect';

    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: { answer: selectedAnswer, status: status }
    }));

    setSelectedAnswer(null); // Reset selection for next question

    if (!isCorrect) {
       setShowExplanationModal(true); // Show explanation immediately on wrong answer
    } else {
      // Move to next question or finish if last one
       if (currentQuestionIndex < totalQuestions - 1) {
         setCurrentQuestionIndex(prev => prev + 1);
       } else {
         finishTest();
       }
    }
  };

  const handleNextQuestion = () => {
     setShowExplanationModal(false); // Close explanation modal
     if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        finishTest(); // Finish if it was the last question
      }
  }

   const startReview = () => {
     setShowResultModal(false);
     if (incorrectAnswers.length > 0) {
       setTestState('reviewing');
       setReviewIndex(0);
       setReviewStartTime(Date.now());
     } else {
        // If no incorrect answers, navigate back to configuration
        toast({ title: "Excellent!", description: "No incorrect answers to review. Great job!", duration: 5000});
        router.push('/configure');
     }
   };

    // --- Review Logic ---
   useEffect(() => {
    if (testState !== 'reviewing' || !reviewStartTime || incorrectAnswers.length === 0) return;

    const reviewDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
    const reviewInterval = 15000; // Show each question for 15 seconds

    const timerId = setInterval(() => {
      const elapsedTime = Date.now() - reviewStartTime;
      if (elapsedTime >= reviewDuration) {
        setTestState('finished'); // End review after 30 mins
        toast({title: "Review Complete", description: "Review session finished."});
        router.push('/configure'); // Or navigate elsewhere
      } else {
        // Cycle through incorrect questions
        setReviewIndex(prev => (prev + 1) % incorrectAnswers.length);
      }
    }, reviewInterval);

    return () => clearInterval(timerId);
  }, [testState, reviewStartTime, incorrectAnswers, router, toast]);


  // --- Rendering Logic ---

   // Loading State
   if (testState === 'loading') {
       return (
           <Card className="w-full max-w-2xl shadow-lg">
               <CardContent className="p-10 text-center flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                   <p className="text-muted-foreground">Loading test setup...</p>
               </CardContent>
           </Card>
       );
   }

   // Error State (e.g., if initial checks fail - although redirects handle most cases)
   if (testState === 'error') {
        return (
            <Card className="w-full max-w-2xl shadow-lg border-destructive">
                <CardHeader className="text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
                    <CardTitle>Error Loading Test</CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center">
                    <p className="text-destructive">Could not load the test questions or configuration.</p>
                    <p className="text-muted-foreground text-sm mt-2">Please return to the configuration page and ensure a valid question file is uploaded.</p>
                    <Button onClick={() => router.push('/configure')} className="mt-4">
                        Go to Configuration
                    </Button>
                </CardContent>
            </Card>
        );
    }


  // Reviewing State
  if (testState === 'reviewing') {
    const reviewQuestion = incorrectAnswers[reviewIndex];
     if (!reviewQuestion) {
        // This case should ideally not be reached if incorrectAnswers > 0
        console.error("Review state error: No review question found at index", reviewIndex);
         toast({ title: "Review Error", description: "Could not display the question for review.", variant: "destructive"});
        router.push('/configure'); // Navigate away safely
        return <p>Error loading review question.</p>;
     }

    const originalQuestionIndex = questions.findIndex(q => q.id === reviewQuestion.id);

    return (
      <Card className="w-full max-w-2xl shadow-lg border border-primary/50 animate-pulse-slow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <span>Reviewing Incorrect Answer ({reviewIndex + 1}/{incorrectAnswers.length})</span>
          </CardTitle>
           <CardDescription>Focus on this question. It will change automatically every 15 seconds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-semibold text-lg">{reviewQuestion.questionText}</p>
           {reviewQuestion.options.map((option, index) => (
            <div key={index} className={`flex items-center justify-between space-x-2 p-3 rounded border ${
                 option === reviewQuestion.correctAnswer
                    ? 'bg-accent/10 border-accent/30' // Highlight correct answer subtly
                    : reviewQuestion.userAnswer === option // Use the stored user answer
                    ? 'bg-destructive/10 border-destructive/30' // Highlight user's incorrect answer
                    : 'bg-muted/30 border-transparent'
            }`}>
               <span className={`font-medium ${option === reviewQuestion.correctAnswer ? 'text-accent' : ''}`}>
                   {option}
                </span>
               <div>
                 {reviewQuestion.userAnswer === option && <XCircle className="w-5 h-5 text-destructive inline-block mr-2" />}
                 {option === reviewQuestion.correctAnswer && <CheckCircle className="w-5 h-5 text-accent inline-block" />}
               </div>

            </div>
          ))}
          <div className="mt-4 p-4 border rounded bg-muted/50">
             <p className="font-semibold text-primary">Explanation:</p>
             <p className="text-sm text-foreground">
                 {reviewQuestion.explanation || <span className="italic text-muted-foreground">Explanation not available.</span>}
             </p>
          </div>
        </CardContent>
         <CardFooter className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Review session: 30 minutes total.</p>
            <Button variant="outline" size="sm" onClick={() => router.push('/configure')}>End Review Early</Button>
         </CardFooter>
      </Card>
    );
  }


  // Running State (Main Test Interface)
  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader>
        <div className="flex flex-wrap justify-between items-center mb-4 gap-y-2">
           <CardTitle>Study Session</CardTitle>
            <div className="flex items-center space-x-3 md:space-x-4 text-sm text-muted-foreground">
                 <div className="flex items-center gap-1" title="Time Remaining">
                    <Clock className="w-4 h-4" />
                    <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                 </div>
                <div className="flex items-center gap-1" title="Question Progress">
                    <FileQuestion className="w-4 h-4" />
                    {/* Ensure we don't show question number > total questions */}
                    <span>{totalQuestions > 0 ? Math.min(currentQuestionIndex + 1, totalQuestions) : 0} / {totalQuestions}</span>
                 </div>
                 <div className="flex items-center gap-1" title="Current Score">
                    <Percent className="w-4 h-4" />
                     <span>{scorePercentage}%</span>
                 </div>
            </div>
        </div>
        {/* Ensure progress doesn't exceed 100 */}
        <Progress value={totalQuestions > 0 ? Math.min(((currentQuestionIndex + 1) / totalQuestions) * 100, 100) : 0} className="w-full" />
         {currentQuestion ? (
            <CardDescription className="mt-4 text-lg font-semibold pt-4">{currentQuestion.questionText}</CardDescription>
         ) : (
             <CardDescription className="mt-4 text-lg font-semibold pt-4 text-muted-foreground">Loading question...</CardDescription>
         ) }
      </CardHeader>
      <CardContent>
         {currentQuestion ? (
             <RadioGroup
              key={currentQuestion.id} // Add key to force re-render on question change
              value={selectedAnswer ?? ''} // Ensure value is controlled, use '' for no selection
              onValueChange={handleAnswerSelect}
              className="space-y-3"
              disabled={showExplanationModal || testState !== 'running'}
            >
              {currentQuestion.options.map((option, index) => (
                <Label
                    key={index}
                    htmlFor={`option-${currentQuestion.id}-${index}`}
                    className={cn(
                        "flex items-center space-x-3 p-3 rounded-md border border-input cursor-pointer transition-colors hover:bg-accent/50",
                        selectedAnswer === option ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-background',
                        (showExplanationModal || testState !== 'running') ? 'cursor-not-allowed opacity-70' : ''
                    )}
                    >
                  <RadioGroupItem value={option} id={`option-${currentQuestion.id}-${index}`} disabled={showExplanationModal || testState !== 'running'} />
                  <span className="text-base font-normal flex-1"> {/* Flex-1 to take available space */}
                    {option}
                  </span>
                   {/* Show smiley/sad emoji based on answer status after submission */}
                    {answers[currentQuestionIndex] && answers[currentQuestionIndex].answer === option && (
                        answers[currentQuestionIndex].status === 'correct'
                        ? <Smile className="w-5 h-5 text-accent ml-auto" />
                        : <Frown className="w-5 h-5 text-destructive ml-auto" />
                    )}
                </Label>
              ))}
            </RadioGroup>
          ) : (
             testState === 'running' && <p className="text-center text-muted-foreground">Preparing question...</p>
          )}
      </CardContent>
      <CardFooter className="flex justify-end">
         <Button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer || showExplanationModal || testState !== 'running'}
          >
           {currentQuestionIndex === totalQuestions - 1 ? 'Finish Test' : 'Submit Answer'}
         </Button>
      </CardFooter>

        {/* --- Modals --- */}

        {/* Explanation Modal (for incorrect answers) */}
        <AlertDialog open={showExplanationModal} onOpenChange={setShowExplanationModal}>
            <AlertDialogContent className="bg-background border border-primary shadow-xl min-w-[300px] min-h-[200px]">
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                    <Frown className="w-6 h-6 text-destructive" />
                    <span>Incorrect Answer</span>
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                    <div className="space-y-4">
                        <p className="text-sm">Let's review why.</p>
                        <div className="p-4 border rounded bg-muted/70 dark:bg-muted/40">
                            <p className="font-semibold text-primary mb-1">Explanation:</p>
                            <p className="text-sm text-foreground">
                               {currentQuestion?.explanation?.trim() ? currentQuestion.explanation : <span className="italic text-muted-foreground">Explanation not available.</span>}
                            </p>
                        </div>
                         <p className="font-semibold">The correct answer is: <span className="text-accent">{currentQuestion?.correctAnswer}</span></p>
                     </div>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={handleNextQuestion}>
                    {currentQuestionIndex === totalQuestions - 1 ? 'Show Results' : 'Next Question'}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


        {/* Result Modal */}
        <AlertDialog open={showResultModal} onOpenChange={setShowResultModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
               {isPassed ? <Smile className="w-7 h-7 text-accent" /> : <Frown className="w-7 h-7 text-destructive" />}
              <span>Test Finished!</span>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                  <p>Here are your results:</p>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                    <li>Total Questions: {totalQuestions}</li>
                    <li>Correct Answers: {correctAnswersCount}</li>
                    <li>Incorrect Answers: {incorrectAnswers.length}</li>
                    <li>Your Score: {scorePercentage}%</li>
                    <li>Passing Score: {config.passingPercentage}%</li>
                    <li className={`font-bold ${isPassed ? 'text-accent' : 'text-destructive'}`}>
                      Result: {isPassed ? 'Passed' : 'Failed'}
                    </li>
                  </ul>
                {incorrectAnswers.length > 0 && (
                    <p className="mt-4 text-sm text-muted-foreground">
                        {isPassed
                            ? "You passed! You can review the questions you got wrong." // Modified text for passed state
                            : "You didn't pass. You will now review the questions you got wrong for the next 30 minutes."
                        }
                    </p>
                )}
                {incorrectAnswers.length === 0 && (
                    <p className="mt-4 text-sm text-accent">
                        Perfect score! Great job!
                    </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
             {/* Offer review if failed OR if passed but there are incorrect answers */}
             {(incorrectAnswers.length > 0) ? (
                 <AlertDialogAction onClick={startReview}>
                     {isPassed ? "Review Incorrect Answers" : "Start Review Session"}
                 </AlertDialogAction>
             ) : null}
              {/* Always offer to configure new test */}
             <AlertDialogCancel onClick={() => router.push('/configure')}>Configure New Test</AlertDialogCancel>


          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// Add a simple pulsing animation class if not already present in globals.css
const styles = `
  @keyframes pulse-slow {
    50% {
      opacity: 0.7;
    }
  }
  .animate-pulse-slow {
    animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

// Inject styles - use a more robust method in production if needed
if (typeof window !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

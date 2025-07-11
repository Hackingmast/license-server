
"use client";

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useTestConfigStore } from '@/store/testConfigStore';
import { useUserStore } from '@/store/userStore';
import { useQuestionStore } from '@/store/questionStore';
import { parseQuestionsFromFileContent } from '@/lib/questionParser';
import { Settings, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


const configSchema = z.object({
  timer: z.coerce.number().int().positive({ message: 'Timer must be a positive number of minutes.' }).min(1, {message: 'Minimum time is 1 minute.'}),
  questionLimit: z.coerce.number().int().positive({ message: 'Question limit must be a positive number.' }).min(1, {message: 'Minimum 1 question.'}),
  passingPercentage: z.coerce.number().int().min(1, { message: 'Passing percentage must be between 1 and 100.' }).max(100, { message: 'Passing percentage must be between 1 and 100.' }),
  questionFile: z.any().refine(
    (val) => (typeof window === 'undefined' || val instanceof FileList),
    "Invalid file input"
  ),
});


type ConfigFormData = z.infer<typeof configSchema>;

export function ConfigureTest() {
  const router = useRouter();
  const setConfig = useTestConfigStore((state) => state.setConfig);
  const configStore = useTestConfigStore((state) => state.config); // Renamed to avoid conflict
  const { user } = useUserStore();
  const setQuestions = useQuestionStore((state) => state.setQuestions);
  const clearQuestions = useQuestionStore((state) => state.clearQuestions);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

   React.useEffect(() => {
    const unsubscribe = useUserStore.persist.onHydrate(() => {
        console.log("[ConfigureTest] Zustand hydrated.");
        setIsLoading(false);
        const currentUser = useUserStore.getState().user;
        if (!currentUser) {
            console.log("[ConfigureTest] No user found after hydration, redirecting.");
            toast({ title: "Authentication Required", description: "Please log in first.", variant: "destructive" });
            router.push('/');
        } else {
             console.log("[ConfigureTest] User found after hydration:", currentUser.name);
        }
    });

     const timeoutId = setTimeout(() => {
         if (!useUserStore.persist.hasHydrated()) {
             console.log("[ConfigureTest] Zustand not hydrated yet, waiting...");
         } else {
            setIsLoading(false);
            const currentUser = useUserStore.getState().user;
            if (!currentUser) {
                console.log("[ConfigureTest] No user found (immediate check after hydration/timeout), redirecting.");
                toast({ title: "Authentication Required", description: "Please log in first.", variant: "destructive" });
                router.push('/');
            } else {
                 console.log("[ConfigureTest] User found (immediate check after hydration/timeout):", currentUser.name);
            }
         }
     }, 100);


    clearQuestions();

    return () => {
        unsubscribe();
        clearTimeout(timeoutId);
    }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [router, toast]);


  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      timer: configStore.timer / 60 || 10,
      questionLimit: configStore.questionLimit || 10,
      passingPercentage: configStore.passingPercentage || 70,
      questionFile: undefined,
    },
  });

  const onSubmit = async (data: ConfigFormData) => {
     if (!(data.questionFile instanceof FileList) || data.questionFile.length !== 1) {
         form.setError("questionFile", { type: "manual", message: "Question file is required." });
         toast({ title: "Error", description: "Please select one question file.", variant: "destructive" });
         return;
     }
     const file = data.questionFile[0];

     if (file.type !== 'text/plain') {
          form.setError("questionFile", { type: "manual", message: "File must be a .txt file." });
         toast({ title: "Invalid File Type", description: "File must be a .txt file.", variant: "destructive" });
         return;
     }

     const maxSize = 5 * 1024 * 1024; // 5MB
     if (file.size > maxSize) {
          form.setError("questionFile", { type: "manual", message: `File size must be less than ${maxSize / 1024 / 1024}MB.` });
         toast({ title: "File Too Large", description: `File size must be less than ${maxSize / 1024 / 1024}MB.`, variant: "destructive" });
         return;
     }

     const reader = new FileReader();

     reader.onload = async (e) => {
         const content = e.target?.result as string;
         if (!content) {
             toast({ title: "Error", description: "Could not read file content.", variant: "destructive" });
             return;
         }

         try {
            const parsedQuestions = parseQuestionsFromFileContent(content);
            if (parsedQuestions.length === 0) {
                 toast({ title: "No Questions Parsed", description: "No valid questions found in the file. Please check the format and ensure questions are separated by blank lines.", variant: "destructive" });
                clearQuestions();
                 return;
            }

             const shuffled = parsedQuestions.sort(() => 0.5 - Math.random());
             const actualQuestionLimit = Math.min(data.questionLimit, shuffled.length);
             const limitedQuestions = shuffled.slice(0, actualQuestionLimit);


             if (actualQuestionLimit < data.questionLimit) {
                 toast({ title: "Notice", description: `Loaded only ${actualQuestionLimit} questions because the file contains fewer questions than requested (${data.questionLimit}).`, variant: "default"});
             }


             setQuestions(limitedQuestions);

            setConfig({
                timer: data.timer * 60,
                questionLimit: actualQuestionLimit,
                passingPercentage: data.passingPercentage,
             });

            toast({ title: "Success", description: `Loaded ${limitedQuestions.length} questions. Starting test.` });
            router.push('/test');

         } catch (error) {
             console.error("Error parsing questions:", error);
             toast({ title: "Error Parsing File", description: `Failed to parse questions. Check format (Question, 1) Option, Answer: Number, Explanation: ...). Separate questions with blank lines. ${error instanceof Error ? error.message : ''}`, variant: "destructive", duration: 10000 });
            clearQuestions();
         }
     };

     reader.onerror = () => {
         toast({ title: "Error", description: "Failed to read the file.", variant: "destructive" });
     };

     reader.readAsText(file);
  };

   if (isLoading) {
       return (
           <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
               <Card className="w-full max-w-lg shadow-lg">
                   <CardContent className="p-10 text-center flex flex-col items-center justify-center space-y-4">
                       <Loader2 className="w-12 h-12 animate-spin text-primary" />
                       <p className="text-muted-foreground">Loading configuration...</p>
                   </CardContent>
               </Card>
           </main>
       );
   }

   if (!user) {
     return <p>Redirecting to login...</p>;
   }

  const fileRef = form.register("questionFile");


  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
            <Settings className="w-12 h-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Configure Your Test</CardTitle>
        <CardDescription>Welcome, {user?.name || 'User'}! Set up your study session.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                control={form.control}
                name="timer"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Timer (min)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 15" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="questionLimit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Max Questions</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 20" {...field} />
                    </FormControl>
                     <FormDescription className="text-xs">Actual number may be lower if file has fewer questions.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="passingPercentage"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Passing %</FormLabel>
                    <FormControl>
                        <Input type="number" min="1" max="100" placeholder="e.g., 80" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
                control={form.control}
                name="questionFile"
                render={({ fieldState, formState }) => (
                    <FormItem>
                    <FormLabel>Question File (.txt)</FormLabel>
                    <FormControl>
                         <Input
                            type="file"
                            accept=".txt"
                            {...fileRef}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </FormControl>
                     <FormDescription className="flex items-center gap-1 text-xs">
                        <Upload className="w-3 h-3" /> Upload a TXT file (max 5MB). Format: Question, 1) Option, Answer: Number, Explanation: (optional). Separate blocks with blank lines.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
               {form.formState.isSubmitting ? 'Processing...' : 'Start Test'}
            </Button>
          </form>
        </Form>
      </CardContent>
       <CardFooter className="text-center text-xs text-muted-foreground">
        <p>Customize your learning experience.</p>
      </CardFooter>
    </Card>
  );
}


"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUserStore } from '@/store/userStore';
import { BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Import toast

// Removed CNIC validation
const authSchema = z.object({
  rollNo: z.string().min(1, { message: 'Roll Number is required.' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  // cnic: z.string().regex(cnicRegex, { message: 'Invalid CNIC format (e.g., 12345-1234567-1).' }), // Removed CNIC
});

type AuthFormData = z.infer<typeof authSchema>;

export function Auth() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const { toast } = useToast(); // Get toast function

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      rollNo: '',
      name: '',
      // cnic: '', // Removed CNIC default
    },
  });

   const onSubmit = (data: AuthFormData) => {
    console.log('[Auth] Submitting form data:', data);
    try {
      // Removed CNIC from user object
      setUser({ rollNo: data.rollNo, name: data.name });
      console.log('[Auth] User set in store.');

      // Short delay to allow state update and persistence if needed
      setTimeout(() => {
        const updatedUser = useUserStore.getState().user;
        console.log('[Auth] User in store after set (async check):', updatedUser);
        if (updatedUser && updatedUser.rollNo === data.rollNo) {
            console.log('[Auth] Navigating to /configure...');
            router.push('/configure'); // Navigate to configuration page
            console.log('[Auth] Navigation initiated.');
        } else {
             console.error("[Auth] User state not updated correctly in store.");
             toast({
                 title: "Login Error",
                 description: "Failed to save user details. Please try again.",
                 variant: "destructive",
             });
        }
      }, 100); // 100ms delay


    } catch (error) {
        console.error("[Auth] Error during form submission:", error);
         toast({
             title: "Login Error",
             description: "An unexpected error occurred during login. Please try again.",
             variant: "destructive",
         });
    }
  };


  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
         <div className="flex justify-center mb-4">
           <BrainCircuit className="w-12 h-12 text-primary" />
         </div>
        <CardTitle className="text-2xl font-bold">StudyBuddy Pro</CardTitle>
        <CardDescription>Please enter your details to begin.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rollNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your roll number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {/* CNIC Field Removed */}
             <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </Form>
      </CardContent>
       <CardFooter className="text-center text-xs text-muted-foreground">
        <p>Your personal study assistant.</p>
      </CardFooter>
    </Card>
  );
}

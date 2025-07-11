import { TestInterface } from '@/components/TestInterface';
import { Suspense } from 'react';

export default function TestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
       {/* Suspense for client components */}
      <Suspense fallback={<div>Loading Test...</div>}>
        <TestInterface />
      </Suspense>
    </main>
  );
}

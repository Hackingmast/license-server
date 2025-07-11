import { Auth } from '@/components/Auth';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <Auth />
    </main>
  );
}

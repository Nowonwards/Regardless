'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, RadioTower, Sparkles } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/chat';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-6 lg:grid-cols-[1fr_420px]">
        <section className="signal-surface hidden min-h-[560px] rounded-lg border bg-card p-8 shadow-sm lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-md border bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <RadioTower className="h-3.5 w-3.5 text-primary" />
              Live content desk
            </div>
            <h1 className="max-w-xl font-display text-5xl font-semibold leading-[0.95] tracking-tight">
              Turn noisy tech signals into posts ready to ship.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
              Regardless keeps ideas, drafts, approvals, publishing, and history in one focused workspace.
            </p>
          </div>

          <div className="grid gap-2 font-mono text-xs text-muted-foreground">
            {['Scan headlines', 'Choose angles', 'Draft platform posts', 'Schedule the queue'].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-md border bg-background/75 px-3 py-2">
                <span>{item}</span>
                <span className="text-primary">{String(index + 1).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </section>

        <Card className="w-full border border-border/70 rounded-2xl shadow-xl bg-card/90 backdrop-blur-md" elevation="low">
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white shadow-md shadow-purple-500/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="font-display text-2xl font-bold">Sign in to Regardless</CardTitle>
          <CardDescription>Open your AI content & publishing workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs font-medium text-red-700 dark:text-red-300" role="alert">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-10 text-sm rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-10 text-sm rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-md shadow-purple-500/20 transition-all"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline font-semibold">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}

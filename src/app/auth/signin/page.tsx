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
import { RadioTower } from 'lucide-react';
import { RegardlessMark } from '@/components/icons/RegardlessMark';

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
        setError(result.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-4xl grid gap-8 lg:grid-cols-2 items-center">
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-none border border-border bg-card text-xs font-mono text-muted-foreground">
            <RadioTower className="h-3.5 w-3.5 text-foreground dark:text-primary" />
            <span>Autonomous Intelligence Loop</span>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Regardless</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Generate high-signal tech social content from live news feeds, orchestrate visual carousel decks, and schedule cross-platform distribution without the busywork.
          </p>
          <div className="pt-2 space-y-2 text-xs text-muted-foreground font-mono">
            {['Idea Discovery', 'Slide Generation', 'Autonomous Queue'].map((item, index) => (
              <div key={item} className="flex items-center justify-between border-b border-border pb-1.5">
                <span>{item}</span>
                <span className="text-primary font-bold">{String(index + 1).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </section>

        <Card className="w-full border border-border rounded-none bg-card" elevation="none">
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-primary text-primary-foreground border border-primary">
            <RegardlessMark size={26} strokeColor="#0B0B0C" />
          </div>
          <CardTitle className="font-display text-2xl font-bold">Sign in to Regardless</CardTitle>
          <CardDescription className="text-xs font-mono">Open your AI content & publishing workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-none border border-destructive bg-surface p-3.5 text-xs font-mono text-destructive" role="alert">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-mono font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-10 text-sm rounded-none border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-mono font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-10 text-sm rounded-none border-border"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10.5 rounded-none bg-primary text-primary-foreground font-mono font-bold uppercase tracking-wider hover:opacity-90 border border-primary transition-all"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs font-mono text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline font-bold">
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

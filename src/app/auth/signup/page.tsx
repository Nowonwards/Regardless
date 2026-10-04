'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, RadioTower } from 'lucide-react';
import { Logo } from '@/components/layout/logo';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: cleanEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      // Automatically sign in upon registration
      const signInResult = await signIn('credentials', {
        email: cleanEmail,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        window.location.href = '/auth/signin';
      } else {
        window.location.href = '/chat';
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during registration. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="hidden min-h-[560px] rounded-none border border-border bg-card p-8 lg:flex lg:flex-col lg:justify-between shadow-[4px_4px_0_0_#0B0B0C] dark:shadow-[4px_4px_0_0_#F4F1EA]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-none border border-border bg-muted px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              <RadioTower className="h-3.5 w-3.5 text-primary" />
              New publishing desk
            </div>
            <div className="mb-6">
              <Logo size={42} showWordmark={true} />
            </div>
            <h1 className="max-w-xl font-sans text-4xl font-extrabold uppercase leading-[1.05] tracking-tight">
              Build a content pipeline with less tab switching.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground font-sans">
              Start with one account, then connect Instagram, LinkedIn, and Pinterest when you are ready to publish.
            </p>
          </div>

          <div className="grid gap-2 font-mono text-xs text-muted-foreground">
            {['Create workspace', 'Generate ideas', 'Approve drafts', 'Publish schedule'].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-none border border-border bg-muted px-3 py-2 uppercase font-bold tracking-wider">
                <span>{item}</span>
                <span className="text-primary font-bold">{String(index + 1).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </section>

        <Card className="w-full border border-border rounded-none bg-card shadow-[4px_4px_0_0_#0B0B0C] dark:shadow-[4px_4px_0_0_#F4F1EA]" elevation="none">
          <CardHeader>
            <div className="mb-4">
              <Logo size={36} showWordmark={false} />
            </div>
            <CardTitle className="font-sans text-2xl font-extrabold uppercase tracking-tight">Create your workspace</CardTitle>
            <CardDescription className="text-xs font-mono uppercase tracking-wider">Set up Regardless for your social publishing flow.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-none border border-destructive bg-destructive/10 p-3.5 text-xs font-mono text-destructive uppercase tracking-wider font-bold" role="alert">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-mono font-bold uppercase tracking-wider">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="h-10 text-sm rounded-none border border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-mono font-bold uppercase tracking-wider">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-10 text-sm rounded-none border border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-mono font-bold uppercase tracking-wider">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  className="h-10 text-sm rounded-none border border-border"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10.5 rounded-none bg-primary text-primary-foreground font-mono font-bold uppercase tracking-wider hover:opacity-90 border border-border transition-all shadow-[2px_2px_0_0_#0B0B0C] dark:shadow-[2px_2px_0_0_#F4F1EA] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create workspace'}
              </Button>
            </form>

            <div className="mt-6 text-center text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-primary hover:underline font-bold">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

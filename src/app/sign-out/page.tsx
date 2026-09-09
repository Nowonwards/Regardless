'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { LogOut, ArrowLeft, Loader2, RadioTower } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SignOutPage() {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut({ redirectUrl: '/sign-in' });
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block group">
            <span className="font-wordmark font-normal text-4xl sm:text-5xl text-foreground select-none leading-none group-hover:opacity-85 transition-opacity">
              Regardless
            </span>
          </Link>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-none border border-border bg-card text-xs font-mono text-muted-foreground">
            <RadioTower className="h-3.5 w-3.5 text-foreground dark:text-primary" />
            <span>Autonomous Intelligence Loop</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-none p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground">
              <LogOut className="h-5 w-5 text-foreground dark:text-primary" />
              <h1 className="font-display text-xl font-bold tracking-tight">Sign Out</h1>
            </div>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">
              {isLoaded && user
                ? `You are currently signed in as ${user.primaryEmailAddress?.emailAddress || user.username || 'User'}.`
                : 'Are you sure you want to end your session?'}
            </p>
          </div>

          <div className="p-3 border border-border bg-background space-y-1">
            <p className="text-xs font-mono font-medium text-foreground">Active Session</p>
            <p className="text-[11px] font-mono text-muted-foreground">
              Signing out will end access to your content pipelines, drafts, and automated schedule queue on this browser.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs font-bold uppercase tracking-wider h-10"
            >
              {signingOut ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Confirm Sign Out
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/chat')}
              disabled={signingOut}
              className="w-full rounded-none border-border font-mono text-xs h-10 hover:bg-surface"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-2" />
              Cancel & Return to Workspace
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

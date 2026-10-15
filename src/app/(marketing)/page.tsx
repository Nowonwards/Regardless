import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, getAuthUser } from '@/lib/auth';
import {
  LandingNav,
  HeroSection,
  TickerStrip,
  IdeateSection,
  SlidesSection,
  FeaturesSection,
  PipelineSection,
  LandingFooter,
} from '@/components/landing';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Regardless: turn tech news into carousels',
  description:
    'A content studio that finds what is happening in tech, turns the ideas you pick into finished carousels, and publishes them to your accounts.',
};

export default async function LandingPage() {
  // Check authenticated session with NextAuth server session helper
  let isAuthenticated = false;
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      isAuthenticated = true;
    }
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
  }

  // Fallback to getAuthUser (which also handles Clerk sessions)
  if (!isAuthenticated) {
    try {
      const user = await getAuthUser();
      if (user) {
        isAuthenticated = true;
      }
    } catch (err: any) {
      if (err?.digest === 'DYNAMIC_SERVER_USAGE') {
        throw err;
      }
    }
  }

  if (isAuthenticated) {
    redirect('/chat');
  }

  const loginHref = '/sign-in';

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-rg-yellow selection:text-ink font-sans">
      <LandingNav loginHref={loginHref} />
      <HeroSection loginHref={loginHref} />
      <TickerStrip />
      <IdeateSection />
      <SlidesSection />
      <FeaturesSection />
      <PipelineSection />
      <LandingFooter loginHref={loginHref} />
    </div>
  );
}

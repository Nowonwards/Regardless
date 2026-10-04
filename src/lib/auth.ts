import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes('[SENSITIVE]')) {
  process.env.NEXTAUTH_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  // 1. Try Clerk authentication first
  try {
    const { auth, currentUser } = await import('@clerk/nextjs/server');
    const authObj = await auth();
    const clerkId = authObj?.userId;

    if (clerkId) {
      let email: string | undefined;
      let name: string | undefined;
      let imageUrl: string | undefined;

      // Extract from sessionClaims if available
      const claims = authObj.sessionClaims as Record<string, any> | undefined;
      if (claims) {
        email = claims.email || claims.primary_email || claims.email_address;
        name =
          claims.name ||
          claims.full_name ||
          (claims.first_name || claims.last_name
            ? [claims.first_name, claims.last_name].filter(Boolean).join(' ')
            : undefined);
        imageUrl = claims.image_url || claims.picture;
      }

      // If missing email, fetch currentUser()
      if (!email) {
        try {
          const clerkUser = await currentUser();
          if (clerkUser) {
            email =
              clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
              clerkUser.emailAddresses?.[0]?.emailAddress;
            name =
              name ||
              [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
              clerkUser.username ||
              'User';
            imageUrl = imageUrl || clerkUser.imageUrl || undefined;
          }
        } catch (e) {
          console.error('[getAuthUser] Error fetching currentUser:', e);
        }
      }

      const normalizedEmail = (email || `${clerkId}@clerk.local`).toLowerCase().trim();

      // Find user by id: clerkId OR email: normalizedEmail
      let user = null;
      try {
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { id: clerkId },
              { email: normalizedEmail },
            ],
          },
        });

        if (!user) {
          try {
            user = await prisma.user.create({
              data: {
                id: clerkId,
                email: normalizedEmail,
                name: name || 'User',
                image: imageUrl || null,
              },
            });
          } catch {
            user = await prisma.user.findFirst({
              where: {
                OR: [
                  { id: clerkId },
                  { email: normalizedEmail },
                ],
              },
            });
          }
        }
      } catch (dbErr) {
        console.error('[getAuthUser] Database error looking up/creating user:', dbErr);
      }

      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }

      // Fallback: return a valid AuthUser with clerkId if database lookup failed
      return {
        id: clerkId,
        email: normalizedEmail,
        name: name || 'User',
        image: imageUrl || null,
      };
    }
  } catch (clerkErr: any) {
    if (clerkErr?.digest === 'DYNAMIC_SERVER_USAGE' || clerkErr?.message?.includes('Dynamic server usage')) {
      throw clerkErr;
    }
    console.error('[getAuthUser] Clerk auth error:', clerkErr);
  }

  // 2. Fall back to NextAuth session
  try {
    const { getServerSession } = await import('next-auth');
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      return {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name,
        image: session.user.image,
      };
    }
  } catch (nextAuthErr: any) {
    if (nextAuthErr?.digest === 'DYNAMIC_SERVER_USAGE' || nextAuthErr?.message?.includes('Dynamic server usage')) {
      throw nextAuthErr;
    }
    console.error('[getAuthUser] NextAuth session error:', nextAuthErr);
  }

  return null;
}
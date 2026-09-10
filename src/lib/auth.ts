import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

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
    const { userId: clerkId } = await auth();

    if (clerkId) {
      const clerkUser = await currentUser();
      const primaryEmail =
        clerkUser?.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
        clerkUser?.emailAddresses?.[0]?.emailAddress;

      if (primaryEmail) {
        const normalizedEmail = primaryEmail.toLowerCase().trim();
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: normalizedEmail },
              { id: clerkId },
            ],
          },
        });

        if (!user) {
          const fullName =
            [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
            clerkUser?.username ||
            'User';
          user = await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: fullName,
              image: clerkUser?.imageUrl || null,
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      } else {
        let user = await prisma.user.findUnique({ where: { id: clerkId } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              id: clerkId,
              email: `${clerkId}@clerk.local`,
              name: clerkUser?.username || 'User',
              image: clerkUser?.imageUrl || null,
            },
          });
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    }
  } catch (clerkErr) {
    // Clerk session not available or not configured in this context
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
  } catch {
    // NextAuth session not available
  }

  return null;
}
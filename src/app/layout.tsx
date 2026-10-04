import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Regardless - AI Social Media Content Pipeline',
  description: 'Chat-driven social media content creation for Instagram, Pinterest, and LinkedIn',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${archivo.variable} ${jetBrainsMono.variable} font-sans antialiased`}>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
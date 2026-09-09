import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk, Fraunces } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '900'],
  style: ['normal'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Regardless - AI Social Media Content Pipeline',
  description: 'Chat-driven social media content creation for Instagram, Pinterest, and LinkedIn',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} ${fraunces.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

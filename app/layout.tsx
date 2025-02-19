import { Inter } from 'next/font/google';
import './globals.css';
import '@farcaster/auth-kit/styles.css';
import { Providers } from '@/components/Providers';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Builddit - Someone Build It!',
    description: 'A platform for discovering and claiming Farcaster build requests',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}

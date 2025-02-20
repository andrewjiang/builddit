import { Inter } from 'next/font/google';
import './globals.css';
import '@farcaster/auth-kit/styles.css';
import { Providers } from '@/components/Providers';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Someone Build It!',
    description: 'A platform for discovering and claiming Farcaster build requests',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" data-oid="-c7jvc_">
            <body className={inter.className} data-oid="czgqetj">
                <Providers data-oid="foq03zf">{children}</Providers>
            </body>
        </html>
    );
}

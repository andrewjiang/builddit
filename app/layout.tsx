import { Inter } from 'next/font/google';
import './globals.css';
import '@farcaster/auth-kit/styles.css';
import { Providers } from '@/components/Providers';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Someone Build It!',
    description: 'A platform for discovering and claiming Farcaster build requests',
    icons: {
        icon: [
            { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon/favicon.ico', sizes: 'any' }
        ],
        apple: [
            { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
        ]
    }
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

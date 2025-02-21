'use client';

import { AuthKitProvider } from '@farcaster/auth-kit';
import { authConfig } from '@/lib/authConfig';
import { useEffect, useState } from 'react';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return null;
    }

    return (
        <SessionProvider>
            <AuthKitProvider config={authConfig}>
                {children}
            </AuthKitProvider>
        </SessionProvider>
    );
}

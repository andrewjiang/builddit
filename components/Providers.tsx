'use client';

import { AuthKitProvider } from "@farcaster/auth-kit";
import { authConfig } from "@/lib/authConfig";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthKitProvider config={authConfig}>
      {children}
    </AuthKitProvider>
  );
} 
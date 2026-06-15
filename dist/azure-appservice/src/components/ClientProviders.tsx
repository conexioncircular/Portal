"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false} refetchWhenOffline={false}>
      {children}
    </SessionProvider>
  );
}

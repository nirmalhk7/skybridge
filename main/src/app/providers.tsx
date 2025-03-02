"use client";

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export function Providers({ session, children }: { session: Session | null, children: React.ReactNode }) {
  return (

    <SessionProvider session={session}>
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark">
      {children}
    </ThemeProvider>
     </SessionProvider> 
  );
}

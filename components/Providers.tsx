"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { Authenticated, ConvexReactClient, Unauthenticated } from "convex/react";
import { ThemeProvider } from "./theme-provider";
import LoginPage from "./LoginPage";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ConvexAuthNextjsProvider client={convex}>
            <ThemeProvider>
                <Unauthenticated>
                    <LoginPage />
                </Unauthenticated>
                <Authenticated>{children}</Authenticated>
            </ThemeProvider>
        </ConvexAuthNextjsProvider>
    );
}
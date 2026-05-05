"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { queryClient } from "@/lib/queryClient";
import { bodyFont, displayFont } from "@/lib/fonts";
import { ToastContainer } from "@/components/ui/Toast";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Church Management System</title>
        <meta name="description" content="Production-grade church management portal" />
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable} bg-[var(--page-bg)] text-[var(--text-primary)] font-sans min-h-screen`}>
        <QueryClientProvider client={queryClient}>
          <NuqsAdapter>
            {children}
          </NuqsAdapter>
          <ReactQueryDevtools initialIsOpen={false} />
          <ToastContainer />
        </QueryClientProvider>
      </body>
    </html>
  );
}

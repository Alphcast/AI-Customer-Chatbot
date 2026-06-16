import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute inset-0 bg-grid opacity-[0.03] dark:opacity-[0.05]" />
      <div className="relative w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <svg
              className="h-7 w-7 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            AI Customer Chatbot
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Intelligent customer support platform
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm backdrop-blur-sm sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

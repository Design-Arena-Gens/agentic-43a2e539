import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Agentic Link Preview',
  description: 'Preview metadata for any URL',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <div className="max-w-3xl mx-auto px-4 py-10">
          {children}
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/store/providers/ReduxProvider';
import NotificationStreamManager from '@/notifications/NotificationStreamManager';

export const metadata: Metadata = {
  title: 'MyApp',
  description: 'E-commerce base with Next.js + TS + Tailwind',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh antialiased bg-white text-neutral-900">
        <ReduxProvider>
          <NotificationStreamManager />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}

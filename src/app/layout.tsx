import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/store/providers/ReduxProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'MyApp',
  description: 'E-commerce base with Next.js + TS + Tailwind',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh antialiased bg-white text-neutral-900">
        <ReduxProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <Footer />
        </ReduxProvider>
      </body>
    </html>
  );
}

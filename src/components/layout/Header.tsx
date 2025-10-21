import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="font-semibold text-lg">My App</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/">Inicio</Link>
          <Link href="/products">Productos</Link>
        </nav>
      </div>
    </header>
  );
}

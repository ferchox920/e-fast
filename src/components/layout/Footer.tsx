export default function Footer() {
  return (
    <footer className="w-full border-t">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
        © {new Date().getFullYear()} MyApp — All rights reserved.
      </div>
    </footer>
  );
}

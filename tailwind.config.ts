// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', // Cubre layout.tsx, page.tsx, etc.
    './src/components/**/*.{js,ts,jsx,tsx,mdx}', // Cubre Header.tsx, Footer.tsx, etc.
    // './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // Probablemente innecesario con App Router
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;

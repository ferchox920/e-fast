'use client';

const STORAGE_KEY = 'myapp_guest_token';

export const getOrCreateGuestToken = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);

    window.localStorage.setItem(STORAGE_KEY, generated);
    return generated;
  } catch {
    return undefined;
  }
};

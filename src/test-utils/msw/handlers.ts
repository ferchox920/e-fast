import type { RestHandler } from 'msw';

// Handlers array is exported so tests can compose or override them.
export const handlers: RestHandler[] = [];

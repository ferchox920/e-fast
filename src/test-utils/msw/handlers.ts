import type { RequestHandler } from 'msw';

// Handlers array is exported so tests can compose or override them.
export const handlers: RequestHandler[] = [];

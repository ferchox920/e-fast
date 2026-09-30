export function monitorContext(context, errors, allowances = []) {
  const permittedResources = [];
  const consoleResources = [];
  const successfulPaths = new Set();
  const cancelledNavigations = [];
  const pages = new Map();
  const allowed = (response) =>
    allowances.some(
      (rule) =>
        response.status() === rule.status &&
        response.request().method() === rule.method &&
        new URL(response.url()).pathname === rule.path,
    );
  const response = (res) => {
    if (res.status() === 200 && res.request().method() === 'GET') {
      const url = new URL(res.url());
      successfulPaths.add(url.origin + url.pathname);
    }
    if (res.status() < 400) return;
    if (allowed(res)) permittedResources.push({ url: res.url(), status: res.status() });
    else errors.push(`Unexpected HTTP ${res.status()} ${res.request().method()} ${res.url()}`);
  };
  const request = (req) => {
    const url = new URL(req.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname))
      errors.push(`Unexpected external request: ${url.href}`);
  };
  const failed = (req) => {
    // Next cancels speculative RSC prefetches when navigation supersedes them.
    // Require the framework header, local origin, GET and exact cancellation code.
    const url = new URL(req.url());
    if (
      req.method() === 'GET' &&
      ['127.0.0.1', 'localhost'].includes(url.hostname) &&
      url.searchParams.has('_rsc') &&
      req.headers?.().rsc === '1' &&
      req.failure()?.errorText === 'net::ERR_ABORTED'
    ) {
      if (req.headers()['next-router-prefetch'] !== '1')
        cancelledNavigations.push({ path: url.origin + url.pathname, url: url.href });
      return;
    }
    errors.push(`Failed request ${req.method()} ${req.url()}: ${req.failure()?.errorText}`);
  };
  const watchPage = (page) => {
    const pageerror = (error) => errors.push(`JavaScript: ${error.message}`);
    const console = (message) => {
      if (message.type() !== 'error') return;
      const match = /^Failed to load resource: the server responded with a status of (\d+)\b/.exec(
        message.text(),
      );
      if (match)
        consoleResources.push({
          url: message.location().url,
          status: Number(match[1]),
          message: message.text(),
        });
      else errors.push(`Console: ${message.text()}`);
    };
    page.on('pageerror', pageerror);
    page.on('console', console);
    pages.set(page, { pageerror, console });
  };
  context.pages().forEach(watchPage);
  context.on('page', watchPage);
  context.on('response', response);
  context.on('request', request);
  context.on('requestfailed', failed);
  return {
    allow(rule) {
      allowances.push(rule);
    },
    finish() {
      for (const cancelled of cancelledNavigations)
        if (!successfulPaths.has(cancelled.path))
          errors.push(`Unresolved cancelled navigation: ${cancelled.url}`);
      for (const resource of consoleResources) {
        if (
          !permittedResources.some(
            (permitted) => permitted.url === resource.url && permitted.status === resource.status,
          )
        )
          errors.push(`Broken resource: ${resource.url} ${resource.message}`);
      }
      context.off('page', watchPage);
      context.off('response', response);
      context.off('request', request);
      context.off('requestfailed', failed);
      for (const [page, handlers] of pages) {
        page.off('pageerror', handlers.pageerror);
        page.off('console', handlers.console);
      }
    },
  };
}

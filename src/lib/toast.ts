type ToastKind = 'error' | 'info';

const TOAST_TIMEOUT_MS = 4500;

const createContainer = () => {
  if (typeof document === 'undefined') return null;

  let container = document.getElementById('app-toast-container');
  if (container) return container;

  container = document.createElement('div');
  container.id = 'app-toast-container';
  container.setAttribute(
    'style',
    [
      'position:fixed',
      'bottom:1rem',
      'right:1rem',
      'display:flex',
      'flex-direction:column',
      'gap:0.5rem',
      'z-index:2147483647',
      'pointer-events:none',
    ].join(';'),
  );

  document.body.appendChild(container);
  return container;
};

const renderToast = (message: string, kind: ToastKind) => {
  if (typeof document === 'undefined') {
    const logger = kind === 'error' ? console.error : console.info;
    logger(`[toast] ${message}`);
    return;
  }

  const container = createContainer();
  if (!container) return;

  const toast = document.createElement('div');
  toast.setAttribute(
    'style',
    [
      'min-width:220px',
      'max-width:360px',
      'padding:0.75rem 1rem',
      'border-radius:0.5rem',
      'box-shadow:0 10px 20px -12px rgba(15,23,42,0.3)',
      'color:#fff',
      'font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'font-size:0.875rem',
      'line-height:1.25rem',
      'pointer-events:auto',
      'opacity:0',
      'transform:translateY(4px)',
      'transition:opacity 150ms ease, transform 150ms ease',
      kind === 'error' ? 'background:rgba(220,38,38,0.95)' : 'background:rgba(37,99,235,0.95)',
    ].join(';'),
  );
  toast.textContent = message;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(4px)';
    toast.addEventListener(
      'transitionend',
      () => {
        toast.remove();
        if (!container.childElementCount) {
          container.remove();
        }
      },
      { once: true },
    );
  }, TOAST_TIMEOUT_MS);
};

const showToast = (message: string, kind: ToastKind) => {
  renderToast(message, kind);
};

export const showErrorToast = (message: string) => {
  showToast(message, 'error');
};

export const showInfoToast = (message: string) => {
  showToast(message, 'info');
};

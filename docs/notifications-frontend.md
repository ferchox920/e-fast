# Notifications Frontend Guide

## Configuration

| Setting                                  | Description                                                                                                      | Example                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`               | REST base URL used for RTK Query requests. Trailing slash is trimmed automatically.                              | `https://api.example.com/api/v1` |
| `NEXT_PUBLIC_API_WS_BASE_URL` (optional) | Override WebSocket base. Fallback switches `http` → `ws` or `https` → `wss` based on `NEXT_PUBLIC_API_BASE_URL`. | `wss://ws.example.com/api/v1`    |

The WebSocket client automatically appends `/notifications/ws?token=<JWT>`. In production builds the URL **must** use `wss://`; non-secure schemes trigger an error.

JWTs are loaded from the Redux `user` slice. Refresh flows should dispatch `setToken` before calling `notificationWSClient.connect` (the hooks already re-use the token from the store).

## Notification Types

| `NotificationType`   | Expected payload fields                                                                              | Meta output                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `product_question`   | `{ question_id: string \| number; product_id: string \| number }`                                    | `href: /products/${product_id}?question=${question_id}`, `badge: "Q&A"`           |
| `product_answer`     | `{ question_id: string \| number; answer_id: string \| number; product_id: string \| number }`       | `href: /products/${product_id}?answer=${answer_id}`, `badge: "Q&A"`               |
| `order_status`       | `{ order_id: string \| number; status?: string; payment_status?: string; shipping_status?: string }` | `href: /orders/${order_id}`, `badge: status ?? payment_status ?? shipping_status` |
| `new_order`          | `{ order_id: string \| number }`                                                                     | `href: /orders/${order_id}`, `badge: "Nuevo pedido"`                              |
| `promotion`          | `{ promotion_id: string \| number }`                                                                 | `href: /promotions/${promotion_id}`, `badge: "Promocion"`                         |
| `loyalty`            | `{ level: string; previous_level?: string \| null; points: number }`                                 | `href: /loyalty`, `badge: \`Nivel ${level}\``                                     |
| `generic` \| unknown | Any `Record<string, unknown>` or `null`                                                              | No meta data is added, payload is returned as-is.                                 |

Type definitions live in `src/types/notifications.ts` and the normalizer is in `src/notifications/normalize.ts`.

> `loyalty` payload requires `points >= 0`. Missing or malformed payloads are discarded with a warning and never reach the UI.

## Hooks Overview

```tsx
import {
  useNotificationStream,
  useNotificationsList,
  useUnreadCounter,
} from '@/notifications/hooks';

export function NotificationsInitializer() {
  // Establishes the WS connection and listens for incoming payloads.
  useNotificationStream();
  return null;
}

export function NotificationsDropdown() {
  const unread = useUnreadCounter();
  const { items, isLoading, refetch } = useNotificationsList({ limit: 50, offset: 0 });

  if (isLoading) return <span>Cargando…</span>;

  return (
    <>
      <button onClick={() => refetch()}>Refrescar ({unread} sin leer)</button>
      <ul>
        {items.map((notification) => (
          <li key={notification.id}>{notification.title}</li>
        ))}
      </ul>
    </>
  );
}
```

Additional helpers:

- `useNotificationConnectionStatus()` returns `'connected' | 'connecting' | 'disconnected'`.
- `useMarkNotificationRead()` performs optimistic `markRead` mutations with rollback on failure.

## Reconnection & Error Strategy

The WebSocket client (`src/realtime/NotificationWSClient.ts`) implements:

- Exponential backoff starting at 1s, doubling per attempt with jitter (80–120% randomization), capped at 30s.
- Toast notifications (non-blocking) for transient errors and reconnection attempts with a 5s throttle.
- Automatic stop and token reset when the server closes with 401-style codes (`4001`, `4401`, `4010`, `401`, `4403`, `1008`) to prevent infinite loops.
- Production-only enforcement of secure `wss://` URLs.

`notificationWSClient.disconnect()` is invoked on logout (via `useNotificationStream` side effects) which clears reconnect timers and listeners.

## Changelog & Notes

- **Etapa 0–2**: Added shared types (`src/types/notifications.ts`), REST client (`notificationsApi`), and resilient WebSocket client with reconnection + status subscriptions.
- **Etapa 3–6**: Added payload normalization, Redux slice with optimistic updates, hooks (`useNotificationsList`, `useNotificationStream`, etc.), and UI components (`NotificationBell`, dropdown, `/notifications` page).
- **Etapa 7–8**: Hardened reconnection security, added toast infrastructure, and covered the module with unit/integration tests (normalize, slice, RTK Query, WebSocket).

### Security Notes

- Never log raw JWTs. The client strips query parameters in logs and sanitizes URLs before logging.
- Toasts and console messages contain only generic info; backend reasons are not surfaced if they might reveal sensitive data.
- Ensure refresh token flows re-trigger `useNotificationStream` by updating the Redux `user.token`.

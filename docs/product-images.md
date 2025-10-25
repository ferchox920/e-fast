# Product Images Module

> Reference for the product media workflows implemented in **e-fast**.

---

## Contracts & Data Shapes

### Types (`src/types/product.ts`)

```ts
interface ProductImageRead {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ProductImageCreate {
  url: string;
  alt_text?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

interface ProductRead extends ProductBase {
  images: ProductImageRead[];
  primary_image?: ProductImageRead | null;
}
```

> **Primary rule**
>
> 1. Take the image flagged with `is_primary === true`.
> 2. If none are flagged, use the smallest `sort_order`.
> 3. If several share the same order or multiple are flagged, fall back to the array order.

### Endpoints (FastAPI)

| Method | Path                                               | Description                                                  |
| ------ | -------------------------------------------------- | ------------------------------------------------------------ |
| `GET`  | `/products` / `/products/{slug}`                   | Returns `ProductRead` including `images`.                    |
| `POST` | `/products`                                        | Accepts initial `images: ProductImageCreate[]`.              |
| `POST` | `/products/{product_id}/images`                    | Adds an image (body: `ProductImageCreate`).                  |
| `POST` | `/products/{product_id}/images/{image_id}/primary` | Marks an image as primary and returns updated `ProductRead`. |

---

## RTK Query Hooks

Implemented in `src/store/api/productApi.ts`.

| Hook                         | Purpose                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| `useListProductsQuery`       | Fetch catalog overview with thumbnails. Invalidated on image changes.                        |
| `useGetProductQuery`         | Fetch PDP detail (images, anomalies, retry support).                                         |
| `useAddImageMutation`        | Wraps `POST /products/{id}/images`. Invalidates `Product` + `ProductList`.                   |
| `useSetPrimaryImageMutation` | Wraps `POST /products/{id}/images/{imageId}/primary`. Invalidates `Product` + `ProductList`. |

### Example

```ts
const { data: product, isLoading, refetch } = useGetProductQuery(slug);
const [addImage, addImageState] = useAddImageMutation();

async function handleAdd(url: string, alt?: string | null) {
  await addImage({
    productId: product.id,
    body: { url, alt_text: alt, is_primary: false },
  }).unwrap();
}
```

---

## UI Components

### ProductGallery (`src/components/product/ProductGallery.tsx`)

- Keyboard-friendly thumbnails (`aria-selected`, `aria-pressed`) with arrow navigation.
- Lazy loads all images and enforces `aspect-4/3` to prevent layout shifts.
- Displays anomaly warnings when the primary rules fall back.

### AdminProductImagesPanel (`src/components/product/AdminProductImagesPanel.tsx`)

- Form to paste a URL, optional alt text, and mark as primary.
- Integrates with RTK mutations, updates cache, and emits telemetry (`image_added`, `image_set_primary`).
- Shows warnings when no primary or multiple primaries exist.

---

## Quick Guide – Admin Workflow

1. **Añadir imagen**
   - Open the panel via Product Playground.
   - Paste a fully qualified URL (https://…).
   - Optionally add `alt_text`.
   - (Optional) mark as primary – only one will remain active.
2. **Marcar imagen como principal**
   - Click the action on the desired thumbnail; the panel refetches the product and updates indicators.
3. **Fallback behaviour**
   - If the backend sends no primary, the first by `sort_order` is automatically highlighted and a warning appears.

---

## Testing & Coverage

- Unit: `ProductGallery.test.tsx` covers selection, fallback, alt handling.
- Integration (MSW): `AdminProductImagesPanel.test.tsx` exercises add/primary mutations.
- Snapshots: `ProductDetailClient.test.tsx` for loading/error/anomaly states.

---

## Changelog

See [`docs/product-images-changelog.md`](./product-images-changelog.md) for a detailed list of updates, including breaking and non-breaking changes.

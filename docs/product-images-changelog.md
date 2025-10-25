# Product Images Changelog

## 2025-10-25

### Added

- `ProductGallery` accessibility improvements (aria pressed/selected, lazy loading, fallback alt text).
- `AdminProductImagesPanel` telemetry events (`image_added`, `image_set_primary`) and anomaly warnings.
- MSW-backed tests for add-image / set-primary flows.
- PDP retry + anomaly messaging in `ProductDetailClient`.

### Changed (non-breaking)

- `ProductImageRead` now requires `sort_order`.
- `ProductRead.images` is non-nullable in the frontend.
- Admin panel replaces manual form with integrated React workflow.

### Breaking

- Any consumer relying on optional `images` should update to handle the required array.
- Tests or scripts expecting silent console output should stub telemetry logs.

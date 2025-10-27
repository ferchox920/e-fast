'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import AdminProductImagesPanel from '@/components/product/AdminProductImagesPanel';
import {
  useLazyListProductsQuery,
  useLazyGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
} from '@/store/api/productApi';
import type {
  ProductRead,
  PaginatedProducts,
  ProductVariantRead,
  ProductImageRead,
  ProductVariantCreate,
  ProductVariantUpdate,
} from '@/types/product';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { CurrencyCode } from '@/types/common';

function isFetchBaseQueryError(err: unknown): err is FetchBaseQueryError {
  return typeof err === 'object' && err !== null && 'status' in err;
}

function handleRtkError(err: unknown, where: string) {
  if (isFetchBaseQueryError(err)) {
    const status = 'status' in err ? err.status : 'unknown';
    const data = 'data' in err ? (err as FetchBaseQueryError & { data?: unknown }).data : null;
    console.warn(`RTKQ error @ ${where}`, { status, data });
    alert(`Error ${String(status)}: ${JSON.stringify(data)}`);
  } else {
    console.warn(`Unknown error @ ${where}`, err);
    alert('Error inesperado. Ver consola.');
  }
}

export default function ProductPlayground() {
  const currentUser = useAppSelector((state) => state.user.current);
  const isAdmin = Boolean(currentUser?.is_superuser);

  // List products state
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [limit, setLimit] = useState('10');
  const [offset, setOffset] = useState('0');
  const [listResult, setListResult] = useState<PaginatedProducts | null>(null);
  const [hasListed, setHasListed] = useState(false);

  const [triggerListProducts, listProductsState] = useLazyListProductsQuery();

  // Get product by slug state
  const [slug, setSlug] = useState('');
  const [productDetail, setProductDetail] = useState<ProductRead | null>(null);
  const [triggerGetProduct, getProductState] = useLazyGetProductQuery();

  // Create product state
  const [createTitle, setCreateTitle] = useState('');
  const [createPrice, setCreatePrice] = useState('');
  const [createCurrency, setCreateCurrency] = useState('USD');
  const [createCategoryId, setCreateCategoryId] = useState('');
  const [createBrandId, setCreateBrandId] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createdProduct, setCreatedProduct] = useState<ProductRead | null>(null);
  const [createProduct, createProductState] = useCreateProductMutation();

  // Update product state
  const [updateProductId, setUpdateProductId] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateSlug, setUpdateSlug] = useState('');
  const [updatePrice, setUpdatePrice] = useState('');
  const [updateCurrency, setUpdateCurrency] = useState('');
  const [updateCategory, setUpdateCategory] = useState('');
  const [updateBrand, setUpdateBrand] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [updateProductResult, setUpdateProductResult] = useState<ProductRead | null>(null);
  const [updateProductMutation, updateProductState] = useUpdateProductMutation();

  // Variant creation/update/delete state
  const [variantProductId, setVariantProductId] = useState('');
  const [variantSku, setVariantSku] = useState('');
  const [variantSizeLabel, setVariantSizeLabel] = useState('');
  const [variantColorName, setVariantColorName] = useState('');
  const [variantColorHex, setVariantColorHex] = useState('');
  const [variantStockOnHand, setVariantStockOnHand] = useState('0');
  const [variantStockReserved, setVariantStockReserved] = useState('0');
  const [variantPriceOverride, setVariantPriceOverride] = useState('');
  const [variantBarcode, setVariantBarcode] = useState('');
  const [variantReorderPoint, setVariantReorderPoint] = useState('0');
  const [variantReorderQty, setVariantReorderQty] = useState('0');
  const [variantReleaseAt, setVariantReleaseAt] = useState('');
  const [variantPrimarySupplierId, setVariantPrimarySupplierId] = useState('');
  const [variantAllowBackorder, setVariantAllowBackorder] = useState(false);
  const [variantAllowPreorder, setVariantAllowPreorder] = useState(false);
  const [variantActive, setVariantActive] = useState(true);
  const [variantResult, setVariantResult] = useState<ProductVariantRead | null>(null);
  const [createVariant, createVariantState] = useCreateVariantMutation();

  const [updateVariantId, setUpdateVariantId] = useState('');
  const [updateVariantSizeLabel, setUpdateVariantSizeLabel] = useState('');
  const [updateVariantColorName, setUpdateVariantColorName] = useState('');
  const [updateVariantColorHex, setUpdateVariantColorHex] = useState('');
  const [updateVariantStockOnHand, setUpdateVariantStockOnHand] = useState('');
  const [updateVariantStockReserved, setUpdateVariantStockReserved] = useState('');
  const [updateVariantPriceOverride, setUpdateVariantPriceOverride] = useState('');
  const [updateVariantBarcode, setUpdateVariantBarcode] = useState('');
  const [updateVariantReorderPoint, setUpdateVariantReorderPoint] = useState('');
  const [updateVariantReorderQty, setUpdateVariantReorderQty] = useState('');
  const [updateVariantReleaseAt, setUpdateVariantReleaseAt] = useState('');
  const [updateVariantPrimarySupplierId, setUpdateVariantPrimarySupplierId] = useState('');
  const [updateVariantActive, setUpdateVariantActive] = useState<'unset' | 'true' | 'false'>(
    'unset',
  );
  const [updateVariantAllowBackorder, setUpdateVariantAllowBackorder] = useState<
    'unset' | 'true' | 'false'
  >('unset');
  const [updateVariantAllowPreorder, setUpdateVariantAllowPreorder] = useState<
    'unset' | 'true' | 'false'
  >('unset');
  const [updatedVariant, setUpdatedVariant] = useState<ProductVariantRead | null>(null);
  const [updateVariantMutation, updateVariantState] = useUpdateVariantMutation();

  const [deleteVariantId, setDeleteVariantId] = useState('');
  const [deleteVariantProductId, setDeleteVariantProductId] = useState('');
  const [deleteVariantSuccess, setDeleteVariantSuccess] = useState(false);
  const [deleteVariantMutation, deleteVariantState] = useDeleteVariantMutation();

  const listLoading = listProductsState.isLoading || listProductsState.isFetching;
  const getProductLoading = getProductState.isLoading || getProductState.isFetching;

  const adminDisabledMessage = isAdmin
    ? null
    : 'Necesitas un token de administrador para ejecutar esta acción.';

  const handleListProducts = async () => {
    try {
      setHasListed(true);
      const params = {
        search: search.trim() || undefined,
        category: categoryId.trim() || undefined,
        brand: brandId.trim() || undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      };
      const data = await triggerListProducts(params).unwrap();
      setListResult(data);
    } catch (err) {
      handleRtkError(err, 'list-products');
      setListResult(null);
    }
  };

  const handleGetProduct = async () => {
    if (!slug.trim()) {
      alert('Ingresa un slug válido.');
      return;
    }
    try {
      const data = await triggerGetProduct(slug.trim()).unwrap();
      setProductDetail(data);
    } catch (err) {
      handleRtkError(err, 'get-product');
      setProductDetail(null);
    }
  };

  const handleCreateProduct = async () => {
    if (!isAdmin) {
      alert(adminDisabledMessage ?? '');
      return;
    }
    if (!createTitle.trim() || !createPrice) {
      alert('Título y precio son obligatorios.');
      return;
    }
    try {
      const currency = (createCurrency.trim().toUpperCase() || 'USD') as CurrencyCode;
      const payload = {
        title: createTitle.trim(),
        price: Number(createPrice),
        currency,
        category_id: createCategoryId.trim() || undefined,
        brand_id: createBrandId.trim() || undefined,
        slug: createSlug.trim() || undefined,
      };
      const created = await createProduct(payload).unwrap();
      setCreatedProduct(created);
      alert('Producto creado correctamente.');
    } catch (err) {
      handleRtkError(err, 'create-product');
      setCreatedProduct(null);
    }
  };

  const handleUpdateProduct = async () => {
    if (!isAdmin) {
      alert(adminDisabledMessage ?? '');
      return;
    }
    if (!updateProductId.trim()) {
      alert('Ingresa el ID del producto a actualizar.');
      return;
    }
    const body: Record<string, unknown> = {};
    if (updateTitle.trim()) body.title = updateTitle.trim();
    if (updateSlug.trim()) body.slug = updateSlug.trim();
    if (updatePrice) body.price = Number(updatePrice);
    if (updateCurrency.trim()) {
      body.currency = updateCurrency.trim().toUpperCase() as CurrencyCode;
    }
    if (updateCategory.trim()) body.category_id = updateCategory.trim();
    if (updateBrand.trim()) body.brand_id = updateBrand.trim();
    if (updateDescription.trim()) body.description = updateDescription.trim();

    if (Object.keys(body).length === 0) {
      alert('Indica al menos un campo a actualizar.');
      return;
    }
    try {
      const updated = await updateProductMutation({
        productId: updateProductId.trim(),
        body,
      }).unwrap();
      setUpdateProductResult(updated);
      alert('Producto actualizado ✅');
    } catch (err) {
      handleRtkError(err, 'update-product');
      setUpdateProductResult(null);
    }
  };

  const handleCreateVariant = async () => {
    if (!isAdmin) {
      alert(adminDisabledMessage ?? '');
      return;
    }
    if (
      !variantProductId.trim() ||
      !variantSku.trim() ||
      !variantSizeLabel.trim() ||
      !variantColorName.trim()
    ) {
      alert('product_id, SKU, size_label y color_name son obligatorios.');
      return;
    }
    try {
      const stockOnHand = Number(variantStockOnHand || 0);
      const stockReserved = Number(variantStockReserved || 0);
      const reorderPoint = Number(variantReorderPoint || 0);
      const reorderQty = Number(variantReorderQty || 0);
      const priceOverride =
        variantPriceOverride.trim() !== '' ? Number(variantPriceOverride) : undefined;

      if (Number.isNaN(stockOnHand) || Number.isNaN(stockReserved)) {
        alert('Stock debe ser un número válido.');
        return;
      }
      if (stockReserved > stockOnHand) {
        alert('stock_reserved no puede exceder stock_on_hand.');
        return;
      }
      if (
        Number.isNaN(reorderPoint) ||
        Number.isNaN(reorderQty) ||
        reorderPoint < 0 ||
        reorderQty < 0
      ) {
        alert('Los campos de reposición deben ser números mayores o iguales a 0.');
        return;
      }
      if (priceOverride !== undefined && Number.isNaN(priceOverride)) {
        alert('price_override debe ser un número válido.');
        return;
      }

      const body: ProductVariantCreate = {
        sku: variantSku.trim(),
        size_label: variantSizeLabel.trim(),
        color_name: variantColorName.trim(),
        stock_on_hand: stockOnHand,
        stock_reserved: stockReserved,
        reorder_point: reorderPoint,
        reorder_qty: reorderQty,
        allow_backorder: variantAllowBackorder,
        allow_preorder: variantAllowPreorder,
        active: variantActive,
      };
      if (variantColorHex.trim()) body.color_hex = variantColorHex.trim();
      if (variantBarcode.trim()) body.barcode = variantBarcode.trim();
      if (priceOverride !== undefined) body.price_override = priceOverride;
      if (variantReleaseAt.trim()) body.release_at = variantReleaseAt.trim();
      if (variantPrimarySupplierId.trim())
        body.primary_supplier_id = variantPrimarySupplierId.trim();

      const created = await createVariant({
        productId: variantProductId.trim(),
        body,
      }).unwrap();
      setVariantResult(created);
      alert('Variante creada ✅');
    } catch (err) {
      handleRtkError(err, 'create-variant');
      setVariantResult(null);
    }
  };

  const handleUpdateVariant = async () => {
    if (!isAdmin) {
      alert(adminDisabledMessage ?? '');
      return;
    }
    if (!updateVariantId.trim()) {
      alert('Ingresa el ID de la variante.');
      return;
    }
    const body: ProductVariantUpdate = {};

    if (updateVariantSizeLabel.trim()) body.size_label = updateVariantSizeLabel.trim();
    if (updateVariantColorName.trim()) body.color_name = updateVariantColorName.trim();
    if (updateVariantColorHex.trim()) body.color_hex = updateVariantColorHex.trim();

    if (updateVariantStockOnHand.trim()) {
      const value = Number(updateVariantStockOnHand);
      if (Number.isNaN(value)) {
        alert('stock_on_hand debe ser numérico');
        return;
      }
      body.stock_on_hand = value;
    }

    if (updateVariantStockReserved.trim()) {
      const value = Number(updateVariantStockReserved);
      if (Number.isNaN(value)) {
        alert('stock_reserved debe ser numérico');
        return;
      }
      body.stock_reserved = value;
    }

    if (updateVariantPriceOverride.trim()) {
      const value = Number(updateVariantPriceOverride);
      if (Number.isNaN(value)) {
        alert('price_override debe ser numérico');
        return;
      }
      body.price_override = value;
    }

    if (updateVariantBarcode.trim()) body.barcode = updateVariantBarcode.trim();

    if (updateVariantReorderPoint.trim()) {
      const value = Number(updateVariantReorderPoint);
      if (Number.isNaN(value)) {
        alert('reorder_point debe ser numérico');
        return;
      }
      body.reorder_point = value;
    }

    if (updateVariantReorderQty.trim()) {
      const value = Number(updateVariantReorderQty);
      if (Number.isNaN(value)) {
        alert('reorder_qty debe ser numérico');
        return;
      }
      body.reorder_qty = value;
    }

    if (updateVariantReleaseAt.trim()) body.release_at = updateVariantReleaseAt.trim();
    if (updateVariantPrimarySupplierId.trim())
      body.primary_supplier_id = updateVariantPrimarySupplierId.trim();

    const activeValue =
      updateVariantActive === 'unset' ? undefined : updateVariantActive === 'true';
    if (activeValue !== undefined) body.active = activeValue;

    const allowBackorderValue =
      updateVariantAllowBackorder === 'unset' ? undefined : updateVariantAllowBackorder === 'true';
    if (allowBackorderValue !== undefined) body.allow_backorder = allowBackorderValue;

    const allowPreorderValue =
      updateVariantAllowPreorder === 'unset' ? undefined : updateVariantAllowPreorder === 'true';
    if (allowPreorderValue !== undefined) body.allow_preorder = allowPreorderValue;

    if (
      body.stock_on_hand !== undefined &&
      body.stock_reserved !== undefined &&
      body.stock_reserved > body.stock_on_hand
    ) {
      alert('stock_reserved no puede exceder stock_on_hand');
      return;
    }

    if (
      (body.reorder_point !== undefined && body.reorder_point < 0) ||
      (body.reorder_qty !== undefined && body.reorder_qty < 0)
    ) {
      alert('Los valores de reposición deben ser mayores o iguales a 0.');
      return;
    }

    if (Object.keys(body).length === 0) {
      alert('Indica al menos un campo a actualizar.');
      return;
    }
    try {
      const updated = await updateVariantMutation({
        variantId: updateVariantId.trim(),
        body,
      }).unwrap();
      setUpdatedVariant(updated);
      alert('Variante actualizada ✅');
    } catch (err) {
      handleRtkError(err, 'update-variant');
      setUpdatedVariant(null);
    }
  };

  const handleDeleteVariant = async () => {
    if (!isAdmin) {
      alert(adminDisabledMessage ?? '');
      return;
    }
    if (!deleteVariantId.trim()) {
      alert('Ingresa el ID de la variante a eliminar.');
      return;
    }
    setDeleteVariantSuccess(false);
    try {
      await deleteVariantMutation({
        variantId: deleteVariantId.trim(),
        productId: deleteVariantProductId.trim() || undefined,
      }).unwrap();
      setDeleteVariantSuccess(true);
      alert('Variante eliminada ✅');
    } catch (err) {
      handleRtkError(err, 'delete-variant');
      setDeleteVariantSuccess(false);
    }
  };

  const handleImagesChange = (nextImages: ProductImageRead[]) => {
    setProductDetail((prev) => {
      if (!prev) {
        return prev;
      }

      const primaryImage = nextImages.find((image) => image.is_primary) ?? null;

      return {
        ...prev,
        images: nextImages,
        primary_image: primaryImage,
      };
    });
  };

  return (
    <section className="space-y-8 border rounded-xl p-6 bg-white shadow-sm">
      <header>
        <h2 className="text-xl font-semibold text-gray-800">Product Playground</h2>
        <p className="text-sm text-gray-600">
          Herramienta de pruebas para los endpoints de catálogo (productos, variantes, imágenes).
        </p>
        {!isAdmin && (
          <p className="mt-2 text-xs text-amber-600">
            Algunas operaciones están deshabilitadas porque este usuario no es administrador.
          </p>
        )}
      </header>

      {/* Listar productos */}
      <section className="space-y-3 border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">Listar productos</h3>
          <button
            onClick={handleListProducts}
            disabled={listLoading}
            className="text-xs px-3 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            {listLoading ? 'Consultando...' : 'Listar productos'}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="brand"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="min_price"
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="max_price"
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="limit"
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="offset"
            type="number"
            value={offset}
            onChange={(e) => setOffset(e.target.value)}
          />
        </div>
        {hasListed && !listLoading && !listResult && (
          <p className="text-xs text-red-600">
            No se pudo obtener la lista. Revisa la consola para más detalles.
          </p>
        )}
        {listProductsState.error && (
          <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
            {JSON.stringify(listProductsState.error, null, 2)}
          </pre>
        )}
        {listResult && (
          <details className="bg-white border rounded p-3">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              Resultado ({listResult.items.length} items de {listResult.total})
            </summary>
            <pre className="mt-2 text-xs overflow-auto max-h-64">
              {JSON.stringify(listResult, null, 2)}
            </pre>
          </details>
        )}
      </section>

      {/* Obtener producto */}
      <section className="space-y-3 border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-700">Obtener producto por slug</h3>
          <input
            className="border px-3 py-2 rounded text-sm flex-1 max-w-sm"
            placeholder="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <button
            onClick={handleGetProduct}
            disabled={getProductLoading}
            className="text-xs px-3 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            {getProductLoading ? 'Buscando...' : 'Obtener'}
          </button>
        </div>
        {getProductState.error && (
          <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
            {JSON.stringify(getProductState.error, null, 2)}
          </pre>
        )}
        {productDetail && (
          <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-auto max-h-64">
            {JSON.stringify(productDetail, null, 2)}
          </pre>
        )}
      </section>

      {/* Crear producto */}
      <section className="space-y-3 border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">Crear producto (POST /products)</h3>
          <button
            onClick={handleCreateProduct}
            disabled={createProductState.isLoading || !isAdmin}
            className="text-xs px-3 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            {createProductState.isLoading ? 'Creando...' : 'Crear'}
          </button>
        </div>
        {!isAdmin && <p className="text-xs text-amber-600">{adminDisabledMessage}</p>}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="title*"
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="price*"
            type="number"
            value={createPrice}
            onChange={(e) => setCreatePrice(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="currency (USD)"
            value={createCurrency}
            onChange={(e) => setCreateCurrency(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="category_id"
            value={createCategoryId}
            onChange={(e) => setCreateCategoryId(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="brand_id"
            value={createBrandId}
            onChange={(e) => setCreateBrandId(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="slug (opcional)"
            value={createSlug}
            onChange={(e) => setCreateSlug(e.target.value)}
          />
        </div>
        {createProductState.error && (
          <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
            {JSON.stringify(createProductState.error, null, 2)}
          </pre>
        )}
        {createdProduct && (
          <pre className="text-xs bg-white border rounded p-3 overflow-auto max-h-64">
            {JSON.stringify(createdProduct, null, 2)}
          </pre>
        )}
      </section>

      {/* Actualizar producto */}
      <section className="space-y-3 border rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h3 className="font-semibold text-gray-700">
            {'Actualizar producto (PUT /products/{product_id})'}
          </h3>
          <div className="flex items-center gap-2">
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="product_id*"
              value={updateProductId}
              onChange={(e) => setUpdateProductId(e.target.value)}
            />
            <button
              onClick={handleUpdateProduct}
              disabled={updateProductState.isLoading || !isAdmin}
              className="text-xs px-3 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              {updateProductState.isLoading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
        {!isAdmin && <p className="text-xs text-amber-600">{adminDisabledMessage}</p>}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="title"
            value={updateTitle}
            onChange={(e) => setUpdateTitle(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="slug"
            value={updateSlug}
            onChange={(e) => setUpdateSlug(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="price"
            type="number"
            value={updatePrice}
            onChange={(e) => setUpdatePrice(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="currency"
            value={updateCurrency}
            onChange={(e) => setUpdateCurrency(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="category_id"
            value={updateCategory}
            onChange={(e) => setUpdateCategory(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="brand_id"
            value={updateBrand}
            onChange={(e) => setUpdateBrand(e.target.value)}
          />
          <textarea
            className="border px-3 py-2 rounded text-sm sm:col-span-2 lg:col-span-3"
            placeholder="description"
            rows={3}
            value={updateDescription}
            onChange={(e) => setUpdateDescription(e.target.value)}
          />
        </div>
        {updateProductState.error && (
          <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
            {JSON.stringify(updateProductState.error, null, 2)}
          </pre>
        )}
        {updateProductResult && (
          <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-auto max-h-64">
            {JSON.stringify(updateProductResult, null, 2)}
          </pre>
        )}
      </section>

      {/* Variantes */}
      <section className="space-y-6 border rounded-lg p-4 bg-gray-50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">
              {'Crear variante (POST /products/{product_id}/variants)'}
            </h3>
            <button
              onClick={handleCreateVariant}
              disabled={createVariantState.isLoading || !isAdmin}
              className="text-xs px-3 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              {createVariantState.isLoading ? 'Creando...' : 'Crear variante'}
            </button>
          </div>
          {!isAdmin && <p className="text-xs text-amber-600">{adminDisabledMessage}</p>}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="product_id*"
              value={variantProductId}
              onChange={(e) => setVariantProductId(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="sku*"
              value={variantSku}
              onChange={(e) => setVariantSku(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="size_label*"
              value={variantSizeLabel}
              onChange={(e) => setVariantSizeLabel(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="color_name*"
              value={variantColorName}
              onChange={(e) => setVariantColorName(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="color_hex (#RRGGBB)"
              value={variantColorHex}
              onChange={(e) => setVariantColorHex(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="barcode"
              value={variantBarcode}
              onChange={(e) => setVariantBarcode(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="stock_on_hand"
              type="number"
              value={variantStockOnHand}
              onChange={(e) => setVariantStockOnHand(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="stock_reserved"
              type="number"
              value={variantStockReserved}
              onChange={(e) => setVariantStockReserved(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="reorder_point"
              type="number"
              value={variantReorderPoint}
              onChange={(e) => setVariantReorderPoint(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="reorder_qty"
              type="number"
              value={variantReorderQty}
              onChange={(e) => setVariantReorderQty(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="price_override"
              type="number"
              value={variantPriceOverride}
              onChange={(e) => setVariantPriceOverride(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="release_at (ISO8601)"
              value={variantReleaseAt}
              onChange={(e) => setVariantReleaseAt(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="primary_supplier_id"
              value={variantPrimarySupplierId}
              onChange={(e) => setVariantPrimarySupplierId(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={variantAllowBackorder}
                onChange={(event) => setVariantAllowBackorder(event.target.checked)}
              />
              Permitir backorder
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={variantAllowPreorder}
                onChange={(event) => setVariantAllowPreorder(event.target.checked)}
              />
              Permitir preorder
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={variantActive}
                onChange={(event) => setVariantActive(event.target.checked)}
              />
              Variante activa
            </label>
          </div>
          {createVariantState.error && (
            <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
              {JSON.stringify(createVariantState.error, null, 2)}
            </pre>
          )}
          {variantResult && (
            <pre className="text-xs bg-white border rounded p-3 overflow-auto max-h-64">
              {JSON.stringify(variantResult, null, 2)}
            </pre>
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-2 justify-between">
            <h3 className="font-semibold text-gray-700">
              {'Actualizar variante (PUT /products/variants/{variant_id})'}
            </h3>
            <div className="flex gap-2 items-center">
              <input
                className="border px-3 py-2 rounded text-sm"
                placeholder="variant_id*"
                value={updateVariantId}
                onChange={(e) => setUpdateVariantId(e.target.value)}
              />
              <button
                onClick={handleUpdateVariant}
                disabled={updateVariantState.isLoading || !isAdmin}
                className="text-xs px-3 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
              >
                {updateVariantState.isLoading ? 'Actualizando...' : 'Actualizar variante'}
              </button>
            </div>
          </div>
          {!isAdmin && <p className="text-xs text-amber-600">{adminDisabledMessage}</p>}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="size_label"
              value={updateVariantSizeLabel}
              onChange={(e) => setUpdateVariantSizeLabel(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="color_name"
              value={updateVariantColorName}
              onChange={(e) => setUpdateVariantColorName(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="color_hex (#RRGGBB)"
              value={updateVariantColorHex}
              onChange={(e) => setUpdateVariantColorHex(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="stock_on_hand"
              type="number"
              value={updateVariantStockOnHand}
              onChange={(e) => setUpdateVariantStockOnHand(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="stock_reserved"
              type="number"
              value={updateVariantStockReserved}
              onChange={(e) => setUpdateVariantStockReserved(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="price_override"
              type="number"
              value={updateVariantPriceOverride}
              onChange={(e) => setUpdateVariantPriceOverride(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="barcode"
              value={updateVariantBarcode}
              onChange={(e) => setUpdateVariantBarcode(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="reorder_point"
              type="number"
              value={updateVariantReorderPoint}
              onChange={(e) => setUpdateVariantReorderPoint(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="reorder_qty"
              type="number"
              value={updateVariantReorderQty}
              onChange={(e) => setUpdateVariantReorderQty(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="release_at (ISO8601)"
              value={updateVariantReleaseAt}
              onChange={(e) => setUpdateVariantReleaseAt(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="primary_supplier_id"
              value={updateVariantPrimarySupplierId}
              onChange={(e) => setUpdateVariantPrimarySupplierId(e.target.value)}
            />
            <select
              className="border px-3 py-2 rounded text-sm"
              value={updateVariantAllowBackorder}
              onChange={(e) =>
                setUpdateVariantAllowBackorder(e.target.value as 'unset' | 'true' | 'false')
              }
            >
              <option value="unset">allow_backorder (sin cambio)</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
            <select
              className="border px-3 py-2 rounded text-sm"
              value={updateVariantAllowPreorder}
              onChange={(e) =>
                setUpdateVariantAllowPreorder(e.target.value as 'unset' | 'true' | 'false')
              }
            >
              <option value="unset">allow_preorder (sin cambio)</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
            <select
              className="border px-3 py-2 rounded text-sm"
              value={updateVariantActive}
              onChange={(e) => setUpdateVariantActive(e.target.value as 'unset' | 'true' | 'false')}
            >
              <option value="unset">active (sin cambio)</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>
          {updateVariantState.error && (
            <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
              {JSON.stringify(updateVariantState.error, null, 2)}
            </pre>
          )}
          {updatedVariant && (
            <pre className="text-xs bg-white border rounded p-3 overflow-auto max-h-64">
              {JSON.stringify(updatedVariant, null, 2)}
            </pre>
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-2 justify-between">
            <h3 className="font-semibold text-gray-700">
              {'Eliminar variante (DELETE /products/variants/{variant_id})'}
            </h3>
            <button
              onClick={handleDeleteVariant}
              disabled={deleteVariantState.isLoading || !isAdmin}
              className="text-xs px-3 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              {deleteVariantState.isLoading ? 'Eliminando...' : 'Eliminar variante'}
            </button>
          </div>
          {!isAdmin && <p className="text-xs text-amber-600">{adminDisabledMessage}</p>}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="variant_id*"
              value={deleteVariantId}
              onChange={(e) => setDeleteVariantId(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="product_id (opcional)"
              value={deleteVariantProductId}
              onChange={(e) => setDeleteVariantProductId(e.target.value)}
            />
          </div>
          {deleteVariantState.error && (
            <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
              {JSON.stringify(deleteVariantState.error, null, 2)}
            </pre>
          )}
          {deleteVariantSuccess && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              Variante eliminada correctamente.
            </p>
          )}
        </div>
      </section>

      {/* Imágenes */}
      <section className="space-y-4 border rounded-lg p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-gray-700">Gestión de imágenes</h3>
          <p className="text-sm text-gray-500">
            Añade nuevas imágenes por URL y define la imagen principal del producto.
          </p>
        </div>

        {productDetail ? (
          <AdminProductImagesPanel
            productId={String(productDetail.id)}
            slug={productDetail.slug}
            images={productDetail.images ?? []}
            onImagesChange={handleImagesChange}
            canEdit={isAdmin}
            disabledMessage={adminDisabledMessage ?? undefined}
          />
        ) : (
          <div className="rounded-md border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
            Obtén primero un producto mediante su slug para poder gestionar sus imágenes.
          </div>
        )}
      </section>
    </section>
  );
}

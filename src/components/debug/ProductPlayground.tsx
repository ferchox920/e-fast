'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  useLazyListProductsQuery,
  useLazyGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
  useAddImageMutation,
  useSetPrimaryImageMutation,
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
  const [variantTitle, setVariantTitle] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantCurrency, setVariantCurrency] = useState('USD');
  const [variantStock, setVariantStock] = useState('');
  const [variantAttributes, setVariantAttributes] = useState('');
  const [variantResult, setVariantResult] = useState<ProductVariantRead | null>(null);
  const [createVariant, createVariantState] = useCreateVariantMutation();

  const [updateVariantId, setUpdateVariantId] = useState('');
  const [updateVariantPrice, setUpdateVariantPrice] = useState('');
  const [updateVariantCurrency, setUpdateVariantCurrency] = useState('');
  const [updateVariantTitle, setUpdateVariantTitle] = useState('');
  const [updateVariantStock, setUpdateVariantStock] = useState('');
  const [updateVariantAttributes, setUpdateVariantAttributes] = useState('');
  const [updatedVariant, setUpdatedVariant] = useState<ProductVariantRead | null>(null);
  const [updateVariantMutation, updateVariantState] = useUpdateVariantMutation();

  const [deleteVariantId, setDeleteVariantId] = useState('');
  const [deleteVariantProductId, setDeleteVariantProductId] = useState('');
  const [deleteVariantSuccess, setDeleteVariantSuccess] = useState(false);
  const [deleteVariantMutation, deleteVariantState] = useDeleteVariantMutation();

  // Images state
  const [imageProductId, setImageProductId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageIsPrimary, setImageIsPrimary] = useState(false);
  const [imageResult, setImageResult] = useState<ProductImageRead | null>(null);
  const [addImage, addImageState] = useAddImageMutation();

  const [primaryImageProductId, setPrimaryImageProductId] = useState('');
  const [primaryImageId, setPrimaryImageId] = useState('');
  const [primaryImageResult, setPrimaryImageResult] = useState<ProductRead | null>(null);
  const [setPrimaryImage, setPrimaryImageState] = useSetPrimaryImageMutation();

  const listLoading = listProductsState.isLoading || listProductsState.isFetching;
  const getProductLoading = getProductState.isLoading || getProductState.isFetching;

  const adminDisabledMessage = isAdmin
    ? null
    : 'Necesitas un token de administrador para ejecutar esta acción.';

  const parseAttributes = (input: string) => {
    if (!input.trim()) return undefined;
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, string | number | boolean | null>;
      }
      alert('Las características deben ser un objeto JSON (ej: {"color":"rojo"})');
      return undefined;
    } catch (err) {
      alert('JSON inválido para atributos de la variante.');
      return undefined;
    }
  };

  const handleListProducts = async () => {
    try {
      setHasListed(true);
      const params = {
        search: search.trim() || undefined,
        category_id: categoryId.trim() || undefined,
        brand_id: brandId.trim() || undefined,
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
    if (!variantProductId.trim() || !variantSku.trim() || !variantPrice) {
      alert('product_id, SKU y precio son obligatorios.');
      return;
    }
    try {
      const attributes = parseAttributes(variantAttributes);
      if (variantAttributes.trim() && !attributes) return;
      const currency = (variantCurrency.trim().toUpperCase() || 'USD') as CurrencyCode;
      const body: ProductVariantCreate = {
        sku: variantSku.trim(),
        price: Number(variantPrice),
        currency,
      };
      if (variantTitle.trim()) body.title = variantTitle.trim();
      if (variantStock) body.stock_quantity = Number(variantStock);
      if (attributes) body.attributes = attributes;

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
    if (updateVariantTitle.trim()) body.title = updateVariantTitle.trim();
    if (updateVariantPrice) body.price = Number(updateVariantPrice);
    if (updateVariantCurrency.trim()) {
      body.currency = updateVariantCurrency.trim().toUpperCase() as CurrencyCode;
    }
    if (updateVariantStock) body.stock_quantity = Number(updateVariantStock);
    const attrs = parseAttributes(updateVariantAttributes);
    if (updateVariantAttributes.trim() && !attrs) return;
    if (attrs) body.attributes = attrs;

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

  const handleAddImage = async () => {
    if (!isAdmin) {
      alert(adminDisabledMessage ?? '');
      return;
    }
    if (!imageProductId.trim() || !imageUrl.trim()) {
      alert('product_id y url son obligatorios.');
      return;
    }
    try {
      const created = await addImage({
        productId: imageProductId.trim(),
        body: {
          url: imageUrl.trim(),
          alt_text: imageAlt.trim() || undefined,
          is_primary: imageIsPrimary || undefined,
        },
      }).unwrap();
      setImageResult(created);
      alert('Imagen añadida ✅');
    } catch (err) {
      handleRtkError(err, 'add-image');
      setImageResult(null);
    }
  };

  const handleSetPrimaryImage = async () => {
    if (!isAdmin) {
      alert(adminDisabledMessage ?? '');
      return;
    }
    if (!primaryImageProductId.trim() || !primaryImageId.trim()) {
      alert('product_id e image_id son obligatorios.');
      return;
    }
    try {
      const updated = await setPrimaryImage({
        productId: primaryImageProductId.trim(),
        imageId: primaryImageId.trim(),
      }).unwrap();
      setPrimaryImageResult(updated);
      alert('Imagen principal actualizada ✅');
    } catch (err) {
      handleRtkError(err, 'set-primary-image');
      setPrimaryImageResult(null);
    }
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
            placeholder="category_id"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded text-sm"
            placeholder="brand_id"
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
              placeholder="title"
              value={variantTitle}
              onChange={(e) => setVariantTitle(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="price*"
              type="number"
              value={variantPrice}
              onChange={(e) => setVariantPrice(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="currency (USD)"
              value={variantCurrency}
              onChange={(e) => setVariantCurrency(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="stock_quantity"
              type="number"
              value={variantStock}
              onChange={(e) => setVariantStock(e.target.value)}
            />
            <textarea
              className="border px-3 py-2 rounded text-sm sm:col-span-2 lg:col-span-3"
              placeholder='attributes JSON (ej. {"color":"rojo"})'
              rows={3}
              value={variantAttributes}
              onChange={(e) => setVariantAttributes(e.target.value)}
            />
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
              {'Actualizar variante (PUT /variants/{variant_id})'}
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
              placeholder="price"
              type="number"
              value={updateVariantPrice}
              onChange={(e) => setUpdateVariantPrice(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="currency"
              value={updateVariantCurrency}
              onChange={(e) => setUpdateVariantCurrency(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="title"
              value={updateVariantTitle}
              onChange={(e) => setUpdateVariantTitle(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="stock_quantity"
              type="number"
              value={updateVariantStock}
              onChange={(e) => setUpdateVariantStock(e.target.value)}
            />
            <textarea
              className="border px-3 py-2 rounded text-sm sm:col-span-2 lg:col-span-3"
              placeholder="attributes JSON"
              rows={3}
              value={updateVariantAttributes}
              onChange={(e) => setUpdateVariantAttributes(e.target.value)}
            />
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
              {'Eliminar variante (DELETE /variants/{variant_id})'}
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
      <section className="space-y-6 border rounded-lg p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">
              {'Añadir imagen (POST /products/{product_id}/images)'}
            </h3>
            <button
              onClick={handleAddImage}
              disabled={addImageState.isLoading || !isAdmin}
              className="text-xs px-3 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              {addImageState.isLoading ? 'Subiendo...' : 'Añadir imagen'}
            </button>
          </div>
          {!isAdmin && <p className="text-xs text-amber-600">{adminDisabledMessage}</p>}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="product_id*"
              value={imageProductId}
              onChange={(e) => setImageProductId(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="url*"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="alt_text"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={imageIsPrimary}
                onChange={(e) => setImageIsPrimary(e.target.checked)}
              />
              ¿Es principal?
            </label>
          </div>
          {addImageState.error && (
            <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
              {JSON.stringify(addImageState.error, null, 2)}
            </pre>
          )}
          {imageResult && (
            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-auto max-h-64">
              {JSON.stringify(imageResult, null, 2)}
            </pre>
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">
              {
                'Marcar imagen como principal (POST /products/{product_id}/images/{image_id}/primary)'
              }
            </h3>
            <button
              onClick={handleSetPrimaryImage}
              disabled={setPrimaryImageState.isLoading || !isAdmin}
              className="text-xs px-3 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              {setPrimaryImageState.isLoading ? 'Actualizando...' : 'Marcar como principal'}
            </button>
          </div>
          {!isAdmin && <p className="text-xs text-amber-600">{adminDisabledMessage}</p>}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="product_id*"
              value={primaryImageProductId}
              onChange={(e) => setPrimaryImageProductId(e.target.value)}
            />
            <input
              className="border px-3 py-2 rounded text-sm"
              placeholder="image_id*"
              value={primaryImageId}
              onChange={(e) => setPrimaryImageId(e.target.value)}
            />
          </div>
          {setPrimaryImageState.error && (
            <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
              {JSON.stringify(setPrimaryImageState.error, null, 2)}
            </pre>
          )}
          {primaryImageResult && (
            <pre className="text-xs bg-white border rounded p-3 overflow-auto max-h-64">
              {JSON.stringify(primaryImageResult, null, 2)}
            </pre>
          )}
        </div>
      </section>
    </section>
  );
}

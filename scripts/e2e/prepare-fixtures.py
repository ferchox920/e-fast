"""Local images and ample fictitious stock in the disposable E2E database only."""
import os

from sqlalchemy import update, select

from app.db.session import SessionLocal
from app.models.product import Category, Product, ProductImage, ProductVariant
from scripts import seed_dev_products  # noqa: F401 -- register related ORM models

if os.environ.get("APP_ENV") != "test" or os.environ.get("E2E_PROVIDER_MODE") != "local":
    raise RuntimeError("Explicit test mode required for disposable fixtures")

with SessionLocal() as db:
    db.execute(update(ProductImage).values(url="http://127.0.0.1:59001/image.svg"))
    db.execute(update(ProductVariant).values(stock_on_hand=500, stock_reserved=0))
    product = Product(title="Producto de prueba sin imagen", slug="e2e-sin-imagen", price=100, currency="ARS", active=True)
    db.add(product)
    db.flush()
    db.add(ProductVariant(product_id=product.id, sku="E2E-SIN-STOCK", size_label="Unico", color_name="Gris", stock_on_hand=0, stock_reserved=0))
    category = db.scalar(select(Category).where(Category.slug == "menswear"))
    cents = Product(title="Producto de centavos", slug="e2e-centavos", price="0.29", currency="ARS", category_id=category.id, active=True)
    db.add(cents)
    db.flush()
    db.add(ProductVariant(product_id=cents.id, sku="E2E-CENTAVOS", size_label="Unico", color_name="Gris", stock_on_hand=500, stock_reserved=0))
    db.commit()

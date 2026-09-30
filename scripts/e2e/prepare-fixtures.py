"""Local images and ample fictitious stock in the disposable E2E database only."""
import os

from sqlalchemy import update

from app.db.session import SessionLocal
from app.models.product import Product, ProductImage, ProductVariant
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
    db.commit()

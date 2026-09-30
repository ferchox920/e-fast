"""Explicit DB-only charges fixture; public checkout has no shipping/tax calculator."""
import os
import sys
import uuid
from decimal import Decimal
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.order import Order, OrderStatus, Payment
from scripts import seed_dev_products  # noqa: F401 -- register ORM relations
from app.models.promotion import Promotion  # noqa: F401 -- order foreign key
from app.models.cart import Cart  # noqa: F401 -- source cart foreign key
from app.models.user import User  # noqa: F401 -- owner foreign key

if os.environ.get("APP_ENV") != "test" or os.environ.get("E2E_PROVIDER_MODE") != "local":
    raise RuntimeError("Disposable local test database required")
order_id = uuid.UUID(sys.argv[1])
shipping, tax = (Decimal("0.11"), Decimal("0.02")) if sys.argv[2] == "rounding" else (Decimal("1.21"), Decimal("0.79"))
with SessionLocal() as db:
    order = db.get(Order, order_id, with_for_update=True)
    if order.status != OrderStatus.pending_payment or db.scalar(select(Payment.id).where(Payment.order_id == order_id)):
        raise RuntimeError("Charges fixture requires unpaid order without payment preference")
    order.shipping_amount = shipping
    order.tax_amount = tax
    order.total_amount = order.subtotal_amount - order.discount_amount + shipping + tax
    db.commit()

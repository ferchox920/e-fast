import { Suspense } from 'react';
import PaymentReturnClient from '@/components/payment/PaymentReturnClient';

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<p>Cargando retorno del pago…</p>}>
      <PaymentReturnClient />
    </Suspense>
  );
}

import { NextResponse } from 'next/server';

export async function GET() {
  const products = [
    { id: 'p1', name: 'Café', price: 10 },
    { id: 'p2', name: 'Tequeños', price: 12 },
  ];
  return NextResponse.json(products);
}

// src/types/common.ts

/** Alias utilitarios compartidos */
export type UUID = string;
export type Email = string;
export type Url = string;

/** Fecha “YYYY-MM-DD” (guía; no valida en runtime) */
export type ISODate = `${number}-${number}-${number}`;
/** ISO datetime, ej. 2025-10-21T12:34:56Z */
export type ISODateTime = string;

/** Monedas frecuentes en e-commerce LATAM/EU/US */
export type CurrencyCode =
  | 'ARS'
  | 'USD'
  | 'EUR'
  | 'BRL'
  | 'CLP'
  | 'COP'
  | 'MXN'
  | 'PEN'
  | 'VES'
  | 'UYU';

/** Números decimales (precio, importe, etc.) */
export type Decimal = number;

export type Nullable<T> = T | null;

export type WithTimestamps = {
  created_at?: ISODateTime | null;
  updated_at?: ISODateTime | null;
};

// src/types/user.ts
import type { UUID, Email, Url, ISODate } from './common';

/** Proveedores OAuth conocidos (ampliable) */
export type OAuthProvider =
  | 'google'
  | 'github'
  | 'apple'
  | 'facebook'
  | 'azuread'
  | 'auth0'
  | 'custom';

/** Dirección postal (según tu schema de backend) */
export interface AddressFields {
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  phone?: string | null;
}

/** UserBase (pydantic: UserBase) */
export interface UserBase extends AddressFields {
  email: Email;
  full_name?: string | null;
  /** "YYYY-MM-DD" según patrón del backend */
  birthdate?: ISODate | null;
  avatar_url?: Url | null;
}

/** UserCreate (pydantic: UserCreate) */
export interface UserCreate extends UserBase {
  /** min_length = 8 (validado en backend) */
  password: string;
}

/** UserCreateOAuth (pydantic: UserCreateOAuth) */
export interface UserCreateOAuth {
  email: Email;
  full_name?: string | null;
  oauth_provider: OAuthProvider | string;
  oauth_sub: string;
  oauth_picture?: Url | null;
  /** ej. claim de Google */
  email_verified_from_provider?: boolean | null;
}

/** UserUpdate (pydantic: UserUpdate) */
/** usamos type alias para evitar la regla no-empty-object-type */
export type UserUpdate = Partial<Omit<UserBase, 'email'>>;

/** UserRead (pydantic: UserRead) */
export interface UserRead extends UserBase {
  id: UUID | string;
  is_active: boolean;
  is_superuser: boolean;
  email_verified: boolean;

  oauth_provider?: OAuthProvider | string | null;
  oauth_sub?: string | null;
  oauth_picture?: Url | null;
}

export type TokenType = 'bearer' | string;

/** Token (pydantic: Token) */
export interface Token {
  access_token: string;
  token_type: TokenType;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: TokenType;
  expires_in: number;
  user: UserRead;
  scopes?: string[] | null;
}

export interface TokenRefresh {
  access_token: string;
  token_type: TokenType;
  expires_in: number;
  scopes?: string[] | null;
}

/** TokenPayload (pydantic: TokenPayload) */
export interface TokenPayload {
  sub?: string | null;
  exp?: number | null;
  iat?: number | null;
  jti?: string | null;
  /** "access" | "refresh" | "verify_email" — abierto por compat futura */
  type?: 'access' | 'refresh' | 'verify_email' | string | null;
  /** scopes opcionales */
  scopes?: string[] | null;

  /** Campos extra permitidos por el backend */
  [key: string]: unknown;
}

// src/store/api/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/store';

export const baseApi = createApi({
  reducerPath: 'api',
  // Añade 'UserList' a los tagTypes
  tagTypes: ['User', 'UserList'], // <-- Modifica esta línea
  baseQuery: fetchBaseQuery({
    baseUrl:
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: () => ({}),
});

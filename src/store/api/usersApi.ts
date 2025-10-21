import { baseApi } from './baseApi';
import type { UserCreate, UserRead } from '@/types/user';

export type RegisterBody = Pick<UserCreate, 'email' | 'password' | 'full_name'> &
  Partial<UserCreate>;

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * POST /users -> Crea usuario
     */
    register: build.mutation<UserRead, RegisterBody>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    /**
     * GET /users/me -> Perfil del usuario autenticado
     */
    me: build.query<UserRead, void>({
      query: () => ({ url: '/users/me' }),
      providesTags: ['User'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useMeQuery,
  useLazyMeQuery, // 👈 export del hook lazy
} = usersApi;

import { baseApi } from './baseApi';
import type { UserCreate, UserRead, UserUpdate } from '@/types/user';

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

    /**
     * PUT /users/me -> Actualiza el perfil del usuario autenticado
     */
    updateMe: build.mutation<UserRead, UserUpdate>({
      query: (body) => ({
        url: '/users/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useMeQuery,
  useLazyMeQuery, // 👈 export del hook lazy
  useUpdateMeMutation,
} = usersApi;

// src/store/api/adminApi.ts
import { baseApi } from './baseApi';
import type { UserRead, UserCreate } from '@/types/user';
import type { Paginated, PaginationParams } from '@/types/api';

// Antes: interface ListUsersParams extends PaginationParams {}
// Ahora: type (no dispara no-empty-object-type)
type ListUsersParams = PaginationParams;

type CreateUserAdminBody = Partial<UserCreate> &
  Pick<UserCreate, 'email' | 'password'> & {
    is_superuser?: boolean;
  };

interface SetUserRoleParams {
  userId: string;
  makeAdmin: boolean;
}

interface SetUserActiveParams {
  userId: string;
  active: boolean;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listUsers: build.query<Paginated<UserRead>, ListUsersParams>({
      query: ({ page = 1, page_size = 50 }) => {
        const offset = (page - 1) * page_size;
        return {
          url: '/admin/users',
          params: { limit: page_size, offset },
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'UserList' as const, id: 'LIST' },
            ]
          : [{ type: 'UserList' as const, id: 'LIST' }],
    }),

    createUserAdmin: build.mutation<UserRead, CreateUserAdminBody>({
      query: ({ is_superuser = false, ...body }) => ({
        url: '/admin/users',
        method: 'POST',
        params: { is_superuser },
        body,
      }),
      invalidatesTags: [{ type: 'UserList', id: 'LIST' }],
    }),

    setUserRole: build.mutation<UserRead, SetUserRoleParams>({
      query: ({ userId, makeAdmin }) => ({
        url: `/admin/users/${userId}/role`,
        method: 'PATCH',
        params: { make_admin: makeAdmin },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        { type: 'UserList', id: 'LIST' },
      ],
    }),

    setUserActiveStatus: build.mutation<UserRead, SetUserActiveParams>({
      query: ({ userId, active }) => ({
        url: `/admin/users/${userId}/active`,
        method: 'PATCH',
        params: { active },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        { type: 'UserList', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListUsersQuery,
  useCreateUserAdminMutation,
  useSetUserRoleMutation,
  useSetUserActiveStatusMutation,
} = adminApi;

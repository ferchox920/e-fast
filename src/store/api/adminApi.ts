// src/store/api/adminApi.ts
import { baseApi } from './baseApi';
import type { UserRead, UserCreate } from '@/types/user';
import type { Paginated, PaginationParams } from '@/types/api';
import type { Product, ProductCreate } from '@/types/product';
import type { AdminAnalyticsOverview, AdminPendingQuestionSummary } from '@/types/admin';

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
    getAnalyticsOverview: build.query<AdminAnalyticsOverview, void>({
      query: () => ({
        url: '/admin/analytics/overview',
      }),
      providesTags: [{ type: 'AdminAnalytics', id: 'OVERVIEW' }],
    }),

    listUsers: build.query<Paginated<UserRead>, ListUsersParams>({
      query: ({ page = 1, page_size = 50 }) => ({
        url: '/admin/users',
        params: { page, page_size },
      }),
      providesTags: (result) => {
        const items = result?.items ?? [];

        return [
          ...items.map(({ id }) => ({ type: 'User' as const, id })),
          { type: 'UserList' as const, id: 'LIST' },
        ];
      },
    }),

    createUserAdmin: build.mutation<UserRead, CreateUserAdminBody>({
      query: ({ is_superuser = false, ...body }) => ({
        url: '/admin/users',
        method: 'POST',
        body: { ...body, is_superuser },
      }),
      invalidatesTags: [{ type: 'UserList', id: 'LIST' }],
    }),

    setUserRole: build.mutation<UserRead, SetUserRoleParams>({
      query: ({ userId, makeAdmin }) => ({
        url: `/admin/users/${userId}/role`,
        method: 'PATCH',
        body: { make_admin: makeAdmin },
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
        body: { active },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        { type: 'UserList', id: 'LIST' },
      ],
    }),

    getPendingProductQuestions: build.query<
      Paginated<AdminPendingQuestionSummary>,
      { limit?: number } | void
    >({
      query: (params) => {
        const limit = params?.limit ?? 5;
        return {
          url: '/product-questions',
          params: {
            status: 'pending',
            limit,
          },
        };
      },
      providesTags: [{ type: 'AdminQuestion', id: 'PENDING' }],
    }),

    createProduct: build.mutation<Product, ProductCreate>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'ProductList', id: 'LIST' },
        { type: 'AdminAnalytics', id: 'OVERVIEW' },
      ],
    }),
  }),
});

export const {
  useGetAnalyticsOverviewQuery,
  useListUsersQuery,
  useLazyListUsersQuery,
  useCreateUserAdminMutation,
  useSetUserRoleMutation,
  useSetUserActiveStatusMutation,
  useGetPendingProductQuestionsQuery,
  useCreateProductMutation,
} = adminApi;

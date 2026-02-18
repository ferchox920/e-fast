import { baseApi } from './baseApi';
import type {
  ClearExposureCacheResponse,
  ExposureResponse,
  GetExposureParams,
} from '@/types/exposure';

export const exposureApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getExposure: build.query<ExposureResponse, GetExposureParams>({
      query: (params) => ({
        url: '/exposure',
        params,
      }),
      providesTags: (result, _error, params) => [
        { type: 'Exposure', id: result?.context ?? params.context },
        { type: 'Exposure', id: 'LATEST' },
      ],
    }),
    refreshExposure: build.mutation<ExposureResponse, GetExposureParams>({
      query: (params) => ({
        url: '/exposure/refresh',
        method: 'POST',
        params,
      }),
      invalidatesTags: (result, _error, params) => [
        { type: 'Exposure', id: result?.context ?? params.context },
        { type: 'Exposure', id: 'LATEST' },
      ],
    }),
    clearExposureCache: build.mutation<
      ClearExposureCacheResponse,
      Partial<GetExposureParams> | void
    >({
      query: (params) => ({
        url: '/exposure/cache',
        method: 'DELETE',
        params: params ?? undefined,
      }),
      invalidatesTags: [{ type: 'Exposure', id: 'LATEST' }],
    }),
  }),
});

export const {
  useGetExposureQuery,
  useLazyGetExposureQuery,
  useRefreshExposureMutation,
  useClearExposureCacheMutation,
} = exposureApi;

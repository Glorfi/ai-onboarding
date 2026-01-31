import { mainApi } from '@/shared/api';
import { API_PATHS } from '@/shared/config';

export const deleteSiteApi = mainApi.injectEndpoints({
  endpoints: (build) => ({
    deleteSite: build.mutation<void, string>({
      query: (id) => ({
        url: API_PATHS.SITES_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Site' as const, id: 'LIST' }],
    }),
  }),
});

export const { useDeleteSiteMutation } = deleteSiteApi;

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Базовый API с настройками
export const mainApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      // Здесь можно добавить токен авторизации
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
    credentials: 'include', // Для работы с cookies
  }),
  endpoints: () => ({}),
});

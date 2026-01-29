import { configureStore } from '@reduxjs/toolkit';

import { mainApi } from '@/shared/api';
import { errorMiddleware } from '@/shared/lib';
import { toastSlice } from '@/shared/ui';

export const store = configureStore({
  reducer: {
    [mainApi.reducerPath]: mainApi.reducer,
    [toastSlice.reducerPath]: toastSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(mainApi.middleware).concat(errorMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

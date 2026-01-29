import type React from 'react';
import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import type { ToastPlacement } from './redux-toast';

export type ToastVariant = 'default' | 'error' | 'success' | 'info';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
  placement?: ToastPlacement;
}

interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = {
  toasts: [],
};

export const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = nanoid();
      state.toasts.push({
        id,
        ...action.payload,
      });
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(
        (toast) => toast.id !== action.payload,
      );
    },
    dismissAllToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const { addToast, dismissToast, dismissAllToasts } = toastSlice.actions;

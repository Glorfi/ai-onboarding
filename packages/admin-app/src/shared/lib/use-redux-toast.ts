// use-redux-toast.ts
'use client';

import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from './redux-hooks';
import { addToast, dismissAllToasts, dismissToast, type Toast } from '../ui';

export function useReduxToast() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.toast.toasts);

  const toast = useCallback(
    (props: Omit<Toast, 'id'>) => {
      const newToast = {
        ...props,
        id: Math.random().toString(36).substring(2, 9),
      };

      dispatch(addToast(newToast));

      if (props.duration !== Number.POSITIVE_INFINITY) {
        const duration = props.duration || 5000;
        setTimeout(() => {
          dispatch(dismissToast(newToast.id));
        }, duration);
      }
    },
    [dispatch]
  );

  const dismiss = useCallback(
    (toastId: string) => {
      dispatch(dismissToast(toastId));
    },
    [dispatch]
  );

  const dismissAll = useCallback(() => {
    dispatch(dismissAllToasts());
  }, [dispatch]);

  return {
    toasts,
    toast,
    dismiss,
    dismissAll,
  };
}

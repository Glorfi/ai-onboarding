import { lazy, Suspense, type ComponentType } from 'react';

export function withSuspense<T extends object>(
  Component: ComponentType<T>,
  fallback?: React.ReactNode,
) {
  return (props: T) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}

export function withSuspenseLazy<T extends object>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode,
) {
  const LazyComponent = lazy(loader);

  return (props: T) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

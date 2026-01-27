
import React from 'react';
import type { IRouteConfig } from '@/shared/config';
import { Route } from 'react-router';


export function renderRoutes(config: IRouteConfig[]): React.ReactNode {
  return config.map((route, i) => {
    if (route.index) return <Route key={i} index element={route.element} />;

    return (
      <Route key={route.path || i} path={route.path} element={route.element}>
        {route.children && renderRoutes(route.children)}
      </Route>
    );
  });
}

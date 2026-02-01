import { Spinner } from '@/shared/ui';
import { useGetMySitesQuery } from '@/entities/site';

import { useEffect, useState } from 'react';
import SiteCardWithPolling from './SiteCardWithPolling';

export function SitesListWidget() {
  const { data, isLoading, error } = useGetMySitesQuery();

  useEffect(() => {
    console.log(data);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Failed to load sites. Please try again.
      </div>
    );
  }

  if (!data?.sites || data.sites.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No sites yet. Add your first site to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:flex-wrap items-stretch">
      {data.sites.map((site) => (
        <SiteCardWithPolling key={site.id} site={site} />
      ))}
    </div>
  );
}

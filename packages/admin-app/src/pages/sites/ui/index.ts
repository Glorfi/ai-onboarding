import { withSuspenseLazy } from '@/shared/ui/withSuspense.tsx';

export const SitesPage = withSuspenseLazy(() => import('./SitesPage'));

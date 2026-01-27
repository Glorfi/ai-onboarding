import { withSuspenseLazy } from '@/shared/ui/withSuspense.tsx';

export const MainPage = withSuspenseLazy(() => import('./MainPage.tsx'));

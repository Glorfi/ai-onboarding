export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface IWalkthroughStep {
  id: string;
  siteId: string;
  version: number;
  stepOrder: number;
  targetSelectors: string[];
  title: string;
  description: string;
  position: TooltipPosition;
  isActive: boolean;
  createdAt: Date;
}

export interface ICreateWalkthroughStepData {
  siteId: string;
  version?: number;
  stepOrder: number;
  targetSelectors: string[];
  title: string;
  description: string;
  position: TooltipPosition;
}

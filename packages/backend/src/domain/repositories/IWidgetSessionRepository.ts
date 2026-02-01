import type {
  IWidgetSession,
  ICreateWidgetSessionData,
  IUpdateWidgetSessionData,
} from '../models';

export interface IWidgetSessionRepository {
  findById(id: string): Promise<IWidgetSession | null>;
  findBySiteId(siteId: string): Promise<IWidgetSession[]>;
  create(data: ICreateWidgetSessionData): Promise<IWidgetSession>;
  update(id: string, data: IUpdateWidgetSessionData): Promise<IWidgetSession>;
  upsert(data: ICreateWidgetSessionData): Promise<IWidgetSession>;
  incrementMessageCount(id: string): Promise<IWidgetSession>;
}

import type {
  IUnansweredQuestion,
  ICreateUnansweredQuestionData,
  IUpdateUnansweredQuestionData,
  UnansweredQuestionStatus,
} from '../models';

export interface IUnansweredQuestionRepository {
  findById(id: string): Promise<IUnansweredQuestion | null>;
  findBySiteId(
    siteId: string,
    status?: UnansweredQuestionStatus
  ): Promise<IUnansweredQuestion[]>;
  create(data: ICreateUnansweredQuestionData): Promise<IUnansweredQuestion>;
  update(
    id: string,
    data: IUpdateUnansweredQuestionData
  ): Promise<IUnansweredQuestion>;
  delete(id: string): Promise<boolean>;
}

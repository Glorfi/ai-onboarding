import type {
  IWidgetChatResponse,
  IWidgetSaveEmailResponse,
  IWidgetRatingResponse,
} from '@ai-onboarding/shared';

export interface IProcessChatMessageOutput {
  response: string;
  responseTime: number;
  messageId?: string;
  sources?: Array<{ pageUrl: string; title?: string }>;
  canProvideEmail?: boolean;
  unansweredQuestionId?: string;
}

export interface ISaveEmailOutput {
  success: boolean;
  message: string;
}

export interface IRateResponseOutput {
  success: boolean;
}

export function toWidgetChatResponse(
  output: IProcessChatMessageOutput,
): IWidgetChatResponse {
  return {
    response: output.response,
    responseTime: output.responseTime,
    messageId: output.messageId,
    sources: output.sources,
    canProvideEmail: output.canProvideEmail,
    unansweredQuestionId: output.unansweredQuestionId,
  };
}

export function toWidgetSaveEmailResponse(
  output: ISaveEmailOutput,
): IWidgetSaveEmailResponse {
  return {
    success: output.success,
    message: output.message,
  };
}

export function toWidgetRatingResponse(
  output: IRateResponseOutput,
): IWidgetRatingResponse {
  return {
    success: output.success,
  };
}

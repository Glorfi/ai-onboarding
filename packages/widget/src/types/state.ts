export type MessageRole = 'user' | 'bot';
export type MessageStatus = 'sending' | 'sent' | 'error';
export type RatingValue = 'positive' | 'negative';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  /** Backend message ID, used for rating (bot messages only) */
  messageId?: string;
  /** Current rating value, undefined if not yet rated */
  rating?: RatingValue;
  /** Whether the user can provide an email for this unanswered question */
  canProvideEmail?: boolean;
  /** Backend question ID for email submission */
  unansweredQuestionId?: string;
  /** Source pages used to generate the answer */
  sources?: Array<{ pageUrl: string; title?: string }>;
  /** Whether email has been submitted for this message */
  emailSubmitted?: boolean;
}

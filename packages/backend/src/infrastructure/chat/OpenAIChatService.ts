import { injectable } from 'tsyringe';
import OpenAI from 'openai';
import type {
  IChatService,
  IChatResponse,
  IChatHistoryMessage,
} from '@/domain/services/chat';
import type { IKnowledgeChunk } from '@/domain/services/knowledge';

const CHAT_MODEL = 'gpt-4o-mini';
const TEMPERATURE = 0.3;
const MAX_TOKENS = 500;

const buildSystemPromptKnowledgeOnly = (siteName: string) =>
  `You are a helpful customer support assistant for ${siteName}. Answer questions ONLY using the provided knowledge base context. If context does not have the answer, return exactly: "noAnswer"
Do not write anything else.

When users ask about "this product", "it", "your service", or similar references - they are asking about ${siteName}.

Rules:
1. If the context contains the answer, provide a clear, concise response
2. Never make up information or use general knowledge
3. Keep responses under 300 words
4. Be friendly and professional
5. Speak as you're a customer support representative of ${siteName}.
`;

const buildSystemPromptWithGeneral = (siteName: string) =>
  `You are a helpful customer support assistant for ${siteName}. Answer questions using the provided knowledge base context. If the context doesn't contain the answer but you have relevant general knowledge, you may use it BUT you MUST prefix your response with:

"Based on general knowledge (not specific to ${siteName}): "

When users ask about "this product", "it", "your service", or similar references - they are asking about ${siteName}.

Rules:
1. Always prioritize knowledge base context
2. Keep responses under 300 words
3. Be friendly and professional
4. If you use general knowledge, make it very clear
`;

@injectable()
export class OpenAIChatService implements IChatService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateResponse(
    question: string,
    chunks: IKnowledgeChunk[],
    allowGeneralKnowledge: boolean,
    siteName?: string,
    chatHistory?: IChatHistoryMessage[],
  ): Promise<IChatResponse> {
    const siteContext = siteName || 'this product';
    const systemPrompt = allowGeneralKnowledge
      ? buildSystemPromptWithGeneral(siteContext)
      : buildSystemPromptKnowledgeOnly(siteContext);

    const context = chunks
      .map(
        (chunk, i) => `[Source ${i + 1} - ${chunk.pageUrl}]\n${chunk.content}`,
      )
      .join('\n\n---\n\n');

    const userMessage = `Context:\n${context}\n\nQuestion: ${question}`;

    // Build messages array with chat history for context
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add recent chat history (limit to last 6 messages to control token usage)
    if (chatHistory && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-6);
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: userMessage });

    const response = await this.client.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
    });

    const seenPageUrls = new Set();

    const sources = chunks
      .map((chunk) => ({
        pageUrl: chunk.pageUrl,
        title: chunk.heading,
      }))
      .filter((source) => {
        if (seenPageUrls.has(source.pageUrl)) return false;
        seenPageUrls.add(source.pageUrl);
        return true;
      });

    return {
      response: response.choices[0].message.content || '',
      sources,
      tokensUsed: {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
      },
    };
  }
}

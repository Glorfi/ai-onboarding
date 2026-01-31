import { injectable } from 'tsyringe';
import { DEFAULTS } from '@ai-onboarding/shared';
import type { ITextChunker, ITextChunk } from '../../domain/services/crawling';

@injectable()
export class TextChunker implements ITextChunker {
  chunk(
    text: string,
    chunkSize: number = DEFAULTS.CHUNK_SIZE_TOKENS,
    overlap: number = DEFAULTS.CHUNK_OVERLAP_TOKENS
  ): ITextChunk[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Approximate: 1 token ≈ 4 characters
    const charsPerToken = 4;
    const targetChunkChars = chunkSize * charsPerToken;
    const overlapChars = overlap * charsPerToken;

    // Clean and normalize text
    const cleanedText = this.cleanText(text);

    if (cleanedText.length <= targetChunkChars) {
      return [{ content: cleanedText, index: 0 }];
    }

    const chunks: ITextChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < cleanedText.length) {
      let endIndex = startIndex + targetChunkChars;

      // Don't exceed text length
      if (endIndex >= cleanedText.length) {
        endIndex = cleanedText.length;
      } else {
        // Try to break at sentence boundary
        endIndex = this.findSentenceBoundary(cleanedText, startIndex, endIndex);
      }

      const chunkContent = cleanedText.slice(startIndex, endIndex).trim();

      if (chunkContent.length > 0) {
        chunks.push({
          content: chunkContent,
          index: chunkIndex,
        });
        chunkIndex++;
      }

      // Move start index with overlap
      if (endIndex >= cleanedText.length) {
        break;
      }

      startIndex = endIndex - overlapChars;

      // Ensure we make progress
      if (startIndex <= chunks[chunks.length - 1]?.content.length) {
        startIndex = endIndex;
      }
    }

    return chunks;
  }

  private cleanText(text: string): string {
    return (
      text
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Remove excessive newlines
        .replace(/\n{3,}/g, '\n\n')
        // Trim
        .trim()
    );
  }

  private findSentenceBoundary(
    text: string,
    startIndex: number,
    targetEndIndex: number
  ): number {
    // Look for sentence endings near the target end index
    const searchStart = Math.max(startIndex, targetEndIndex - 200);
    const searchEnd = Math.min(text.length, targetEndIndex + 100);
    const searchText = text.slice(searchStart, searchEnd);

    // Find sentence endings (. ! ? followed by space or end)
    const sentenceEndRegex = /[.!?]\s/g;
    let lastMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;

    while ((match = sentenceEndRegex.exec(searchText)) !== null) {
      const absolutePosition = searchStart + match.index + 1;
      if (absolutePosition <= targetEndIndex + 50) {
        lastMatch = match;
      }
    }

    if (lastMatch) {
      return searchStart + lastMatch.index + 1;
    }

    // Fall back to word boundary
    const wordBoundary = text.lastIndexOf(' ', targetEndIndex);
    if (wordBoundary > startIndex) {
      return wordBoundary;
    }

    return targetEndIndex;
  }
}

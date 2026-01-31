export interface ITextChunk {
  content: string;
  index: number;
}

export interface ITextChunker {
  chunk(text: string, chunkSize?: number, overlap?: number): ITextChunk[];
}

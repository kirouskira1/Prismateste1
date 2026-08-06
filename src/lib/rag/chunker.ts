/**
 * Document Chunker (Prisma V5.0 - Vector Intelligence)
 * Splits documents into semantic chunks respecting paragraph boundaries.
 * Each chunk preserves structural metadata for citation traceability.
 */

/** Metadata attached to each chunk for citation and traceability. */
export interface ChunkMetadata {
  source_document: string;
  page?: number;
  section?: string;
  title?: string;
}

/** A single text chunk with its associated metadata. */
export interface Chunk {
  text: string;
  index: number;
  metadata: ChunkMetadata;
}

/** Configuration options for the text splitter. */
export interface ChunkerOptions {
  chunkSize: number;
  chunkOverlap: number;
}

const DEFAULT_OPTIONS: ChunkerOptions = { chunkSize: 800, chunkOverlap: 200 };

/**
 * Recursively splits text into semantic chunks, respecting paragraph
 * and sentence boundaries. Inspired by LangChain's RecursiveCharacterTextSplitter.
 */
export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  /** Separators ordered from largest semantic boundary to smallest. */
  private separators = ['\n\n', '\n', '. ', ' ', ''];

  constructor(options: ChunkerOptions = DEFAULT_OPTIONS) {
    this.chunkSize = options.chunkSize;
    this.chunkOverlap = options.chunkOverlap;
  }

  /**
   * Split text into chunks with metadata attached.
   * @param text - The raw document text to chunk.
   * @param baseMetadata - Metadata to attach to every chunk (source doc, page, etc).
   * @returns An array of Chunk objects with text, index, and metadata.
   */
  public splitText(text: string, baseMetadata: ChunkMetadata): Chunk[] {
    const rawChunks = this.splitRaw(text);

    return rawChunks.map((chunkText, index) => ({
      text: chunkText,
      index,
      metadata: { ...baseMetadata },
    }));
  }

  /**
   * Internal: split text into raw string fragments.
   */
  private splitRaw(text: string): string[] {
    const finalChunks: string[] = [];

    // Base case: if text fits within chunkSize, return it
    if (text.length <= this.chunkSize) {
      return [text];
    }

    const separator = this.findBestSeparator(text);
    const splits = text.split(separator).filter((s) => s.length > 0);

    let currentChunk = '';

    for (const split of splits) {
      // If adding this split exceeds size, push current and start new
      if (
        currentChunk.length + separator.length + split.length > this.chunkSize &&
        currentChunk.length > 0
      ) {
        finalChunks.push(currentChunk.trim());

        // Handle overlap: take the end of the current chunk
        const overlapStart = Math.max(0, currentChunk.length - this.chunkOverlap);
        currentChunk = currentChunk.substring(overlapStart) + separator + split;
      } else {
        currentChunk = currentChunk ? currentChunk + separator + split : split;
      }
    }

    if (currentChunk.trim().length > 0) {
      finalChunks.push(currentChunk.trim());
    }

    return finalChunks;
  }

  private findBestSeparator(text: string): string {
    for (const sep of this.separators) {
      if (sep === '') return sep;
      if (text.includes(sep)) return sep;
    }
    return '';
  }
}

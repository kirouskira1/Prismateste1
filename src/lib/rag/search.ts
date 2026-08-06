/**
 * Hybrid Search (Prisma V5.0 - Vector Intelligence)
 * Combines semantic search (pgvector cosine similarity) with keyword search (BM25).
 * Final Score = (0.7 × cosine_similarity) + (0.3 × bm25_rank)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Embedder } from './embedder';
import type { ChunkMetadata } from './chunker';

/** A single search result from the hybrid search RPC. */
export interface SearchResult {
  chunk_text: string;
  chunk_metadata: ChunkMetadata;
  similarity: number;
}

/**
 * HybridSearch: Queries the knowledge base using a combination of
 * vector similarity and keyword matching via a Supabase RPC function.
 */
export class HybridSearch {
  constructor(
    private supabaseClient: SupabaseClient,
    private embedder: Embedder
  ) {}

  /**
   * Search knowledge base using hybrid approach.
   * The RPC enforces RLS internally based on the authenticated user.
   *
   * @param query - The natural language query from the user.
   * @param projectConfigId - The project to scope the search to.
   * @param limit - Maximum number of results to return.
   */
  public async search(
    query: string,
    projectConfigId: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    const queryEmbedding = await this.embedder.embedText(query);

    const { data, error } = await this.supabaseClient.rpc('hybrid_search', {
      query_text: query,
      query_embedding: queryEmbedding,
      match_count: limit,
      project_id: projectConfigId,
    });

    if (error) {
      console.error('[HybridSearch] Error searching knowledge base:', error);
      throw error;
    }

    return (data ?? []) as SearchResult[];
  }
}

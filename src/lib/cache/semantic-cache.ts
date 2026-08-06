/**
 * Semantic Cache (Prisma V5.0 - Vector Intelligence)
 * Prevents redundant LLM calls by reusing responses to semantically identical queries.
 * Threshold: cosine similarity >= 0.95 → cache hit.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Embedder } from '../rag/embedder';

/**
 * PolicyDecisionPayload: The structured response from a Policy Agent call.
 * This is what gets cached and returned on cache hits.
 */
export interface PolicyDecisionPayload {
  decision: string;
  reasoning_text: string;
  citation_metadata: {
    source_document: string;
    page?: number;
    section?: string;
    snippet?: string;
  } | null;
  confidence: number;
}

export class SemanticCache {
  private readonly similarityThreshold: number = 0.95;

  constructor(
    private supabaseClient: SupabaseClient,
    private embedder: Embedder
  ) {}

  /**
   * Search for a cached response for the given query.
   * @returns The cached PolicyDecisionPayload if found, null otherwise.
   */
  public async get(
    query: string,
    projectConfigId: string
  ): Promise<PolicyDecisionPayload | null> {
    const queryEmbedding = await this.embedder.embedText(query);

    const { data, error } = await this.supabaseClient.rpc('check_semantic_cache', {
      query_embedding: queryEmbedding,
      project_id: projectConfigId,
      match_threshold: this.similarityThreshold,
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    // HIT — the RPC increments hit_count atomically
    console.log(`[SemanticCache] HIT for query: "${query}"`);
    return data[0].response as PolicyDecisionPayload;
  }

  /**
   * Store a new response in the cache.
   */
  public async set(
    query: string,
    projectConfigId: string,
    response: PolicyDecisionPayload
  ): Promise<void> {
    const queryEmbedding = await this.embedder.embedText(query);

    const { error } = await this.supabaseClient.from('semantic_cache').insert({
      project_config_id: projectConfigId,
      query_text: query,
      query_embedding: queryEmbedding,
      response: response,
    });

    if (error) {
      console.error('[SemanticCache] Failed to write to cache:', error);
    }
  }

  /**
   * Invalidate cache for a specific project (e.g., when a source document is updated).
   * Per spec §3.4: ALL entries for the project_config_id are deleted.
   */
  public async invalidateProject(projectConfigId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('semantic_cache')
      .delete()
      .eq('project_config_id', projectConfigId);

    if (error) {
      console.error(
        `[SemanticCache] Failed to invalidate cache for project ${projectConfigId}:`,
        error
      );
    } else {
      console.log(`[SemanticCache] Invalidated cache for project ${projectConfigId}`);
    }
  }
}

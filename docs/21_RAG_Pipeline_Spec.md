# RAG Pipeline & Semantic Cache Protocol

**Classification:** REFERENCE  
**Codename:** `Vector_Intelligence`  
**Version:** V5.0 (Harness Engineering Layer)  
**Context Layer:** Feature (Data Retrieval & Caching)  
**Est. Tokens:** ~800 tokens  

---

## 1. Purpose

The RAG (Retrieval-Augmented Generation) Pipeline empowers Prisma's Policy Agent to dynamically consult external knowledge (PDFs, docs) while enforcing tenant isolation. The Semantic Cache reduces LLM costs and latency by reusing responses for conceptually identical queries.

**Why this matters:**
- Without strict chunking and metadata: Citations are lost, hallucination risk spikes.
- Without RLS on vectors: Data leakage between tenants becomes inevitable.
- Without Semantic Cache: We pay OpenAI repeatedly for the exact same policy question.

---

## 2. Vector Pipeline (pgvector)

### 2.1 Embedding Model Selection

| Model | Dimensions | Target Use Case | Tradeoff |
|:---|:---:|:---|:---|
| `text-embedding-3-small` (OpenAI) | 1536 | Default for high-accuracy cloud deployments | High quality, low cost, requires API call |
| `gemma-embedding-2b` (Local/Ollama) | 2048 | Privacy-critical, air-gapped deployments | Zero API cost, higher compute/memory requirement |

*Decision:* Prisma V5.0 defaults to `text-embedding-3-small` for the canonical cloud architecture.

### 2.2 Schema Definition

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for document chunks and embeddings
CREATE TABLE public.document_embeddings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_config_id uuid REFERENCES public.project_configurations(id) ON DELETE CASCADE,
  source_document text NOT NULL,        -- Ex: "financial_rules_v2.pdf"
  chunk_index integer NOT NULL,         -- Position in original document
  chunk_text text NOT NULL,             -- The pure text content
  chunk_metadata jsonb,                 -- { page: 5, section: "Approvals", title: "..." }
  embedding vector(1536) NOT NULL,      -- The embedding vector
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate chunks for the same document
  CONSTRAINT unique_chunk UNIQUE(project_config_id, source_document, chunk_index)
);

-- Index for fast cosine similarity search (IVFFlat)
CREATE INDEX idx_embeddings_vector ON public.document_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 2.3 Row Level Security (RLS)

Strict tenant isolation is mandatory for embeddings.

```sql
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read embeddings from their own projects"
ON public.document_embeddings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_configurations pc
    WHERE pc.id = document_embeddings.project_config_id
    AND pc.owner_user_id = auth.uid()
  )
);
```

### 2.4 Chunking Strategy

We use `RecursiveCharacterTextSplitter` semantics:
- **`chunk_size`:** 800 characters
- **`chunk_overlap`:** 200 characters

**Rules:**
1. Always respect paragraph boundaries (`\n\n`) first, then sentences (`. `).
2. Never split in the middle of a word.
3. Every chunk MUST have `chunk_metadata` attached before embedding.

### 2.5 Hybrid Search

Pure vector search struggles with keyword matching (e.g., specific ID numbers). Prisma uses a Hybrid Search approach via Supabase Postgres functions:

`Final Score = (0.7 × cosine_similarity) + (0.3 × bm25_rank)`

### 2.6 Anti-Patterns (WRONG vs RIGHT)

- ❌ **ERRADO:** Chunkar por tamanho fixo de caracteres ignorando parágrafos (corta frases ao meio, destrói semântica).
- ❌ **ERRADO:** Embedding sem metadata (o agente usa a informação, mas não consegue citar a página ou seção para o usuário).
- ✅ **CERTO:** Chunks respeitam boundaries estruturais, e o `chunk_metadata` é injetado no prompt do LLM junto com o texto.

---

## 3. Semantic Cache

### 3.1 Purpose
Intercept identical or highly similar queries before they hit the LLM. If User A asks "What is the refund policy?" and User B asks "How do refunds work?", the cache serves the same verified answer instantly.

### 3.2 Schema & Interface

```typescript
/**
 * SemanticCacheEntry: Represents a cached LLM response.
 */
interface SemanticCacheEntry {
  query_embedding: number[];       // Vector of the original query
  query_text: string;              // Original text (for debugging/monitoring)
  response: PolicyDecisionPayload; // The complete, structured LLM response
  similarity_threshold: number;    // Minimum cosine similarity for a hit (default: 0.95)
  ttl_seconds: number;             // Time-to-live (default: 3600s / 1 hour)
  created_at: string;              // ISO-8601
  hit_count: number;               // Analytics: how many times it was reused
}
```

```sql
CREATE TABLE public.semantic_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_config_id uuid REFERENCES public.project_configurations(id) ON DELETE CASCADE,
  query_text text NOT NULL,
  query_embedding vector(1536) NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  hit_count integer DEFAULT 0
);

CREATE INDEX idx_semantic_cache_vector ON public.semantic_cache 
USING ivfflat (query_embedding vector_cosine_ops) WITH (lists = 100);
```

### 3.3 Flow

```
1. User submits Query Q.
2. System embeds Q → Vector V.
3. Cache Search: 
   Find entry in semantic_cache where (1 - (query_embedding <=> V)) >= 0.95
4. IF HIT:
   - Increment hit_count.
   - Return cached response (Latency: ~50ms).
5. IF MISS:
   - Execute standard RAG Pipeline (Search docs → Call LLM).
   - Store new response in semantic_cache.
   - Return response (Latency: ~2000ms).
```

### 3.4 Invalidation Protocol

Cache is only safe if it's accurate.
- **Rule:** When a source document in `document_embeddings` is updated or deleted, ALL entries in `semantic_cache` for that `project_config_id` MUST be invalidated (deleted or marked stale).
- **Rule:** TTL enforcement (default 1 hour) ensures that configuration changes not directly tied to documents eventually propagate.

### 3.5 Watcher Integration

Add to `08_Watcher_Agent.md`:
| Metric | Threshold | Action |
|:---|:---|:---|
| `cache_hit_rate` | < 10% over 24h | INFO: Cache underutilized, check similarity threshold |
| `cache_hit_rate` | > 80% over 24h | INFO: High efficiency |
| `stale_cache_reads` | > 0 | CRITICAL: Invalidation logic failed |

---

*Specification generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*

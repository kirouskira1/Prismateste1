# Resilience Protocol — Retry & Circuit Breaker for LLM APIs

**Classification:** REFERENCE  
**Codename:** `Resilience_Protocol`  
**Version:** V5.0 (Harness Engineering Layer)  
**Context Layer:** Always (Infrastructure Protection)  
**Est. Tokens:** ~600 tokens  

---

## 1. Purpose

LLM API calls are the lifeblood of the Prisma agent squad. When providers experience transient failures (rate limits, server overloads, network timeouts), the TRM Loop must NOT crash — it must retry intelligently and, if failures persist, fail gracefully with circuit protection.

**Why this matters:**
- Without retry: A single `429 Too Many Requests` kills the entire sprint mid-task.
- Without circuit breaker: A downed provider causes cascading retries that burn budget.
- Without Watcher integration: Outages go undetected until the human checks manually.

---

## 2. Retry Policy

### 2.1 Core Interface

```typescript
/**
 * RetryPolicy: Configures retry behavior for LLM API calls.
 * 
 * WHY each field exists:
 * - maxRetries: Caps total attempts to prevent infinite loops on permanent errors.
 * - baseDelayMs: Starting delay; too low = hammers the API, too high = wastes time.
 * - maxDelayMs: Upper bound prevents exponential growth from causing minute-long waits.
 * - backoffMultiplier: Exponential growth factor (2 = doubles each retry).
 * - jitterMs: Random noise prevents thundering herd when multiple agents retry simultaneously.
 * - retryableStatusCodes: Only specific errors should trigger retry; 4xx auth errors should NOT.
 */
interface RetryPolicy {
  maxRetries: number;              // Default: 3. Maximum: 5.
  baseDelayMs: number;             // Default: 1000 (1 second)
  maxDelayMs: number;              // Default: 30000 (30 seconds)
  backoffMultiplier: number;       // Default: 2 (exponential)
  jitterMs: number;                // Default: 500 (random 0-500ms added)
  retryableStatusCodes: number[];  // Provider-specific, see §2.2
  respectRetryAfter: boolean;      // Default: true. Honor provider's Retry-After header.
}
```

### 2.2 Provider-Specific Error Mapping

Each LLM provider returns different HTTP status codes for retryable vs. permanent errors. This mapping is **NOT generic** — it was extracted from each provider's official API documentation.

```typescript
/**
 * ProviderErrorMap: Maps each provider to its specific retryable/permanent error codes.
 * 
 * WHY this is provider-specific:
 * - OpenAI uses 429 for rate limits AND quota exceeded (different retry strategies).
 * - Anthropic uses 529 for API overload (unique to Anthropic, not a standard HTTP code).
 * - Google uses 503 for transient and 429 for quota, with different Retry-After semantics.
 */
const PROVIDER_ERROR_MAP: Record<string, ProviderErrors> = {
  anthropic: {
    retryable: [
      429,  // Rate limited — respect Retry-After header (typically 30-60s)
      500,  // Internal server error — transient, retry with backoff
      502,  // Bad gateway — infrastructure issue, retry with backoff
      503,  // Service unavailable — temporary overload
      529,  // API overloaded — UNIQUE TO ANTHROPIC, treat like 503
    ],
    permanent: [
      400,  // Bad request — malformed payload, do NOT retry
      401,  // Unauthorized — invalid API key, do NOT retry
      403,  // Forbidden — permission denied, do NOT retry
      404,  // Not found — invalid model name, do NOT retry
    ],
    retryAfterHeader: "retry-after",  // Standard header, seconds
  },

  openai: {
    retryable: [
      429,  // Rate limited OR quota exceeded — check response body
      500,  // Internal server error
      502,  // Bad gateway
      503,  // Service unavailable
    ],
    permanent: [
      400,  // Bad request
      401,  // Unauthorized
      403,  // Forbidden
      404,  // Model not found
      422,  // Unprocessable entity — invalid parameters
    ],
    retryAfterHeader: "retry-after",  // Standard header, seconds
    // SPECIAL: OpenAI 429 can mean "rate limit" (retry) or "quota exceeded" (don't retry).
    // Distinguish by checking response body for "insufficient_quota" error type.
  },

  google: {
    retryable: [
      429,  // Resource exhausted — quota/rate limit
      500,  // Internal error
      503,  // Service unavailable
    ],
    permanent: [
      400,  // Invalid argument
      401,  // Unauthenticated
      403,  // Permission denied
      404,  // Model not found
    ],
    retryAfterHeader: "retry-after",  // Standard header, seconds
  },
};

interface ProviderErrors {
  retryable: number[];
  permanent: number[];
  retryAfterHeader: string;
}
```

### 2.3 Retry Algorithm

```typescript
/**
 * calculateDelay: Computes the delay before the next retry attempt.
 *
 * Formula: min(baseDelay × multiplier^attempt + random(0, jitter), maxDelay)
 *
 * Example with defaults:
 *   Attempt 1: min(1000 × 2^0 + 250, 30000) = 1250ms
 *   Attempt 2: min(1000 × 2^1 + 400, 30000) = 2400ms
 *   Attempt 3: min(1000 × 2^2 + 100, 30000) = 4100ms
 *
 * If provider returns Retry-After header with value 45:
 *   → Use max(calculated_delay, 45000ms) to respect provider's instruction.
 */
function calculateDelay(
  attempt: number,
  policy: RetryPolicy,
  retryAfterSeconds?: number
): number {
  const exponentialDelay = policy.baseDelayMs * Math.pow(policy.backoffMultiplier, attempt);
  const jitter = Math.random() * policy.jitterMs;
  const calculatedDelay = Math.min(exponentialDelay + jitter, policy.maxDelayMs);

  // If provider sent Retry-After header, respect it (never go below their instruction)
  if (retryAfterSeconds && policy.respectRetryAfter) {
    return Math.max(calculatedDelay, retryAfterSeconds * 1000);
  }

  return calculatedDelay;
}
```

### 2.4 Anti-Patterns (WRONG vs RIGHT)

```
❌ WRONG: Retry cego sem backoff
   catch(error) {
     return callLLM(prompt);  // Hammers the API immediately, worsens rate limiting
   }

❌ WRONG: Retry sem checagem de tipo de erro
   catch(error) {
     if (error.status !== 200) retry();  // Retries on 401 (bad key) — will NEVER work
   }

❌ WRONG: Retry com delay fixo
   catch(error) {
     await sleep(1000);  // No exponential backoff, no jitter, no Retry-After respect
     retry();
   }

✅ RIGHT: Backoff exponencial com jitter + provider-aware error codes + Retry-After
   catch(error) {
     if (!isRetryable(error, provider)) throw error;     // Permanent → fail fast
     if (circuitBreaker.isOpen(provider)) throw error;   // Circuit open → fail fast
     const delay = calculateDelay(attempt, policy, error.retryAfterSeconds);
     await sleep(delay);
     circuitBreaker.recordFailure(provider);
     retry();
   }
```

---

## 3. Circuit Breaker

### 3.1 Purpose

The Circuit Breaker prevents the system from repeatedly calling a provider that is clearly down. Without it, all retry budgets get burned on a dead endpoint.

### 3.2 State Machine

```
                    ┌──────────────┐
                    │              │
           ┌──────►│   CLOSED     │◄──── Normal operation
           │       │  (Healthy)   │      All calls go through
           │       │              │
           │       └──────┬───────┘
           │              │
           │     failureCount >= failureThreshold (5)
           │              │
           │              ▼
           │       ┌──────────────┐
           │       │              │
           │       │    OPEN      │◄──── All calls BLOCKED
           │       │  (Tripped)   │      Returns error immediately
           │       │              │      Emits INCIDENT_BRIEFING to Watcher
           │       └──────┬───────┘
           │              │
           │     recoveryTimeMs elapsed (30000ms)
           │              │
           │              ▼
           │       ┌──────────────┐
           │       │              │
           └───────┤  HALF_OPEN   │◄──── ONE test call allowed
                   │  (Testing)   │      If succeeds → CLOSED
                   │              │      If fails → back to OPEN
                   └──────────────┘
```

### 3.3 Configuration Interface

```typescript
/**
 * CircuitBreakerConfig: Configures the circuit breaker per provider.
 * 
 * WHY each field exists:
 * - failureThreshold: Number of consecutive failures before tripping. 5 = tolerant enough
 *   for transient blips but catches sustained outages.
 * - recoveryTimeMs: How long to wait before testing if the provider recovered.
 *   30s = long enough for most transient issues to resolve.
 * - monitorWindowMs: Rolling window for counting failures. Prevents ancient failures
 *   from keeping the circuit open forever.
 */
interface CircuitBreakerConfig {
  failureThreshold: number;        // Default: 5 consecutive failures
  recoveryTimeMs: number;          // Default: 30000ms (30 seconds)
  monitorWindowMs: number;         // Default: 60000ms (1 minute rolling window)
}

/**
 * CircuitBreakerState: Internal state tracked per provider.
 */
interface CircuitBreakerState {
  provider: string;                // "anthropic" | "openai" | "google"
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failureCount: number;
  lastFailureTimestamp: string;    // ISO-8601
  lastSuccessTimestamp: string;    // ISO-8601
  totalTrips: number;             // How many times this circuit has tripped (for Watcher metrics)
}
```

### 3.4 Watcher Integration

When the circuit breaker transitions to `OPEN`, it MUST emit an `INCIDENT_BRIEFING` message to the Watcher Agent:

```typescript
/**
 * Emitted when circuit breaker trips (CLOSED → OPEN).
 * This integrates with the existing 17_Prisma_Message_Protocol.md
 * using the INCIDENT_BRIEFING MessageType.
 * 
 * MUST conform to IncidentBriefingPayload (08_Watcher_Agent.md §5.1).
 */
const circuitOpenIncident: IncidentBriefingPayload = {
  incident_id: crypto.randomUUID(),                     // UUID
  severity: "CRITICAL",                                 // Circuit open = critical
  domain: "PERFORMANCE",                                // Watcher domain (from 08_Watcher_Agent.md §3)
  summary: `Circuit Breaker OPEN: ${provider} failed ${failureCount} consecutive calls`,
  evidence: {
    metric_name: "consecutive_llm_failures",
    current_value: failureCount,
    threshold_value: circuitBreakerConfig.failureThreshold,
    trend: "RISING",
    time_window: `last_${circuitBreakerConfig.monitorWindowMs / 1000}s`,
  },
  affected_entities: [provider, activeTaskId],           // Provider + task impacted
  recommended_action: totalTrips >= 3
    ? "ESCALATE: Provider may be experiencing a major outage. Consider switching to fallback model via Model Asymmetry Protocol (Orchestrator §13)."
    : "MONITOR: Transient issue likely. Circuit will auto-test recovery in 30s.",
  auto_actionable: totalTrips < 3,                       // Auto-fallback if < 3 trips
  timestamp: new Date().toISOString(),                   // ISO-8601
};
```

---

## 4. New MessageType: `LLM_CALL_FAILURE`

Added to the `MessageType` union in `17_Prisma_Message_Protocol.md`:

```typescript
// V5.0 — Resilience Protocol
| "LLM_CALL_FAILURE"           // Any → Watcher: "LLM API call failed after all retries"
```

### Payload Schema

```typescript
/**
 * LlmCallFailurePayload: Emitted when an LLM call exhausts all retries
 * or is blocked by the circuit breaker.
 * 
 * WHY this exists:
 * - TELEMETRY_EVENT is for observable actions that succeeded.
 * - LLM_CALL_FAILURE is for actions that FAILED despite retry attempts.
 * - The Watcher needs this distinction to calculate reliability metrics.
 */
interface LlmCallFailurePayload {
  provider: string;                         // "anthropic" | "openai" | "google"
  model: string;                            // "claude-opus-4" | "gpt-4o" | etc.
  error_code: number;                       // HTTP status code
  error_message: string;                    // Provider error message
  retry_attempts: number;                   // How many retries were attempted
  total_delay_ms: number;                   // Total time spent waiting between retries
  circuit_breaker_state: "CLOSED" | "OPEN" | "HALF_OPEN";
  blocked_by_circuit: boolean;              // true if circuit prevented the call entirely
  fallback_triggered: boolean;              // true if Model Asymmetry kicked in
  fallback_provider?: string;               // The provider used as fallback (if any)
  task_id: string;                          // Links to the sprint task that was affected
  impact: "TASK_DELAYED" | "TASK_FAILED" | "TASK_REROUTED";
}
```

---

## 5. Model Asymmetry Fallback Integration

When a provider's circuit breaker is OPEN, the Orchestrator's Model Asymmetry Protocol (§13) activates automatically:

```
IF circuit_breaker.state("anthropic") === "OPEN"
  AND task.assigned_model === "claude-opus-4"
THEN
  → Reroute to "gemini-2.5-pro" (Google) or "gpt-4o" (OpenAI)
  → Emit TELEMETRY_EVENT with reason: "model_asymmetry_fallback"
  → Continue TRM Loop with substitute model
  → When circuit recovers (HALF_OPEN → CLOSED), revert to primary model
```

**Decision Rules:**
- If the task is `CREATION` or `HYBRID` → Fallback to the next highest Quality Score model in the Model Catalog.
- If the task is `EXECUTION_ONLY` → Fallback to the cheapest available model (e.g., Gemini Flash).
- If ALL providers are OPEN → ESCALATE to human immediately.

---

## 6. Default Configuration

```json
{
  "resilience": {
    "retry": {
      "maxRetries": 3,
      "baseDelayMs": 1000,
      "maxDelayMs": 30000,
      "backoffMultiplier": 2,
      "jitterMs": 500,
      "respectRetryAfter": true
    },
    "circuitBreaker": {
      "failureThreshold": 5,
      "recoveryTimeMs": 30000,
      "monitorWindowMs": 60000
    }
  }
}
```

This configuration should be stored in `prisma.config.json` under a new `resilience` key, following the existing pattern of centralized configuration (Factor III — Config via env/JSON, never hard-coded).

---

## 7. Watcher Metrics (New Thresholds)

The following metrics should be added to `08_Watcher_Agent.md` §3.5:

| Metric | Threshold | Action |
|:---|:---|:---|
| `llm_call_failure_rate` | > 10% of calls in rolling 5min | Emit `WATCHER_ALERT` |
| `circuit_trips_per_session` | ≥ 3 trips for same provider | Recommend permanent model switch |
| `avg_retry_delay_ms` | > 15000ms | Flag potential provider degradation |
| `fallback_activation_rate` | > 25% of tasks | Escalate — primary provider may be unreliable |

---

*Resilience Protocol generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*

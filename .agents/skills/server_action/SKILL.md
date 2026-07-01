---
name: server_action
description: Padrões obrigatórios, contratos Zod, tratamento de erro e regras de delegação para Server Actions no Next.js e Supabase. Gatilhar sempre que for criar, editar ou auditar funções e actions de servidor.
---

# Skill: Server Action — Best Practices

**Read this BEFORE writing any Server Action. This is mandatory.**

---

## Structural Contract (Non-Negotiable)

Every Server Action MUST follow this exact skeleton:

```typescript
// Line 1: ALWAYS "use server" — no exception
"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// 1. Zod schema (ALWAYS present, ALWAYS before the function)
const schema = z.object({ /* typed fields */ });

// 2. Standardized return type
type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// 3. JSDoc with INTENT (the "why", not the "what")
/**
 * @description Why this action exists (business intent)
 */
export async function actionName(
  input: z.infer<typeof schema>
): Promise<ActionResponse<ReturnType>> {
  try {
    const validated = schema.parse(input);
    const supabase = await createClient();
    // ... logic
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

## Common Mistakes to Avoid

| Mistake | Why it fails | Fix |
|:---|:---|:---|
| Missing `"use server"` on line 1 | Kill Switch K3 | Always first line |
| Using `any` as return type | Audit Domain 2 violation | Use `ActionResponse<T>` |
| `console.log(error.stack)` | Security — stacktrace leak | Use `error.message` only |
| `fetch('/api/...')` | Anti-Legacy violation | Call supabase directly |
| Hard-coded business value | Kill Switch K5 (V4 only) | Delegate to Policy Agent |
| Missing Zod schema | Audit Domain 2 violation | Always validate input |

## V4 Delegation Rule

If a business rule is **volatile** (can change without code deploy), it MUST be delegated to a Policy Agent:

```typescript
// ❌ WRONG — hard-coded
if (amount > 500) { requireApproval(); }

// ✅ RIGHT — delegated
const policy = await consultPolicyAgent("approval_threshold", { amount });
if (policy.requiresApproval) { requireApproval(); }
```

---

*Skill file migrated and native-indexed under Antigravity 2.0 & Prisma V4.5 directives*

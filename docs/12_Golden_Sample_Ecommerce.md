# Golden Sample: V4 Architecture in E-Commerce Platform

**Classification:** REFERENCE  
**Codename:** `Golden_Sample_Ecommerce`  
**Version:** V4  
**Context Layer:** Always (Architectural Reference)  
**Est. Tokens:** ~1,000 tokens  

---

This document serves as the second "Practical Answer Key" for the TRM Cognitive Agent. While the FitPro Golden Sample (`11_Golden_Sample_FitPro.md`) demonstrates **progressive overload delegation**, this sample demonstrates **financial approval delegation** in an e-commerce context.

**EXAMPLE CONTEXT:**
An e-commerce platform needs to auto-approve or reject purchase orders based on dynamic business rules that change per client.
- *Scenario:* A customer places an order for $1,200.
- *Objective:* The system must decide if the order requires manual approval or can be auto-approved.

---

## 1. THE WRONG WAY (V2 Approach — Legacy)

*PROHIBITED in V4. Fails Audit Framework §1.*

**File:** `src/controllers/OrderController.ts`

```typescript
// ❌ WRONG: Hard-Coded Business Rules
export async function processOrder(orderId: string) {
  const order = await db.getOrder(orderId);

  // Developer hardwired multiple rules:
  const AUTO_APPROVE_LIMIT = 500;     // ❌ Magic number
  const PREMIUM_LIMIT = 2000;          // ❌ Magic number
  const REQUIRE_MANAGER = 5000;        // ❌ Magic number

  if (order.customerTier === 'premium' && order.total <= PREMIUM_LIMIT) {
    await db.approveOrder(orderId);     // ❌ No audit trail
  } else if (order.total <= AUTO_APPROVE_LIMIT) {
    await db.approveOrder(orderId);     // ❌ No citation
  } else if (order.total > REQUIRE_MANAGER) {
    await db.flagForReview(orderId);    // ❌ No reason recorded
  } else {
    await db.rejectOrder(orderId);      // ❌ No explanation
  }
}
```

**Why this fails every V4 check:**

| Check | Status | Violation |
|:---|:---:|:---|
| Zero Hard-Code | ❌ | 3 magic numbers: 500, 2000, 5000 |
| Policy Agent | ❌ | No `consultPolicyAgent()` |
| Audit Trail | ❌ | No `audit_logs` record |
| `"use server"` | ❌ | Not a Server Action |
| `ActionResponse<T>` | ❌ | Returns void |
| Zod Validation | ❌ | No input validation |
| Citation | ❌ | No document reference for decisions |

---

## 2. THE RIGHT WAY (V4 Approach — Policy Agents)

### A. The Business Rule (Client Document)

The e-commerce manager uploads this via Dashboard:

**File (Client RAG):** `order_approval_policy.pdf`

```
ORDER APPROVAL POLICY — Updated Q2 2026

Section 1: Auto-Approval
  Orders below $750 from verified customers are auto-approved.

Section 2: Tier-Based Limits
  Premium customers: auto-approve up to $3,000.
  Standard customers: auto-approve up to $750.
  New customers: manual review required for all orders above $200.

Section 3: Manager Escalation
  Any order above $5,000 requires VP approval regardless of tier.
  Any order containing restricted items requires compliance review.

Section 4: Fraud Indicators
  Flag orders where shipping address differs from billing by >100 miles.
  Flag orders with >3 payment attempts in 24 hours.
```

### B. The Server Action (V4 Pattern)

**File:** `src/actions/orders.ts`

```typescript
// ✅ RIGHT: Full V4 Pattern
"use server";

import { consultPolicyAgent } from "@/lib/policy-agent";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const processOrderSchema = z.object({
  orderId: z.string().uuid(),
  orderData: z.object({
    total: z.number().positive(),
    customerTier: z.enum(["new", "standard", "premium"]),
    items: z.array(z.object({
      name: z.string(),
      category: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })),
    shippingAddress: z.string(),
    billingAddress: z.string(),
    paymentAttempts: z.number().int(),
  }),
});

type ActionResponse<T> = { success: boolean; data?: T; error?: string };

interface OrderDecision {
  status: string;
  reason: string;
  requiresHumanReview: boolean;
}

/**
 * Delegates order approval to the Policy Agent.
 * The code contains ZERO business rules — all logic comes from the
 * client's uploaded order_approval_policy.pdf document.
 */
export async function processOrder(
  input: z.infer<typeof processOrderSchema>
): Promise<ActionResponse<OrderDecision>> {
  try {
    const validated = processOrderSchema.parse(input);
    const supabase = await createClient();

    // 1. The code does NOT know approval limits.
    //    It asks the Policy Agent, which reads the client's document.
    const decision = await consultPolicyAgent({
      agentName: "order_approval",
      context: {
        orderTotal: validated.orderData.total,
        customerTier: validated.orderData.customerTier,
        itemCategories: validated.orderData.items.map(i => i.category),
        shippingAddress: validated.orderData.shippingAddress,
        billingAddress: validated.orderData.billingAddress,
        paymentAttempts: validated.orderData.paymentAttempts,
      },
      riskLevel: validated.orderData.total > 1000 ? "HIGH" : "MEDIUM",
    });

    // 2. Execute the agent's decision
    const status = decision.decision === "APPROVED" ? "approved"
                 : decision.decision === "ESCALATED" ? "pending_review"
                 : "rejected";

    await supabase
      .from("orders")
      .update({ status, approval_reason: decision.reason })
      .eq("id", validated.orderId);

    return {
      success: true,
      data: {
        status,
        reason: decision.reason,
        requiresHumanReview: decision.decision === "ESCALATED",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### C. Dashboard View

In the Agent Control Center:

```
┌─────────────────────────────────────────────────────┐
│  📋 ORDER APPROVAL LOG                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🟢 APPROVED — 14:32:05                             │
│  Order #1847 — $420.00 (Standard customer)          │
│  Agent: order_approval                              │
│  ┌─────────────────────────────────────────────┐    │
│  │  "Standard customers: auto-approve up to    │    │
│  │   $750." — order_approval_policy.pdf, §2    │    │
│  └─────────────────────────────────────────────┘    │
│  Confidence: 97%  |  Latency: 0.8s  |  👍 👎       │
│                                                     │
│  🟡 ESCALATED — 14:28:41                            │
│  Order #1846 — $6,200.00 (Premium customer)         │
│  Agent: order_approval                              │
│  ┌─────────────────────────────────────────────┐    │
│  │  "Any order above $5,000 requires VP        │    │
│  │   approval regardless of tier." — §3        │    │
│  └─────────────────────────────────────────────┘    │
│  Confidence: 99%  |  Action Required: VP Review     │
│                                                     │
│  🔴 REJECTED — 14:25:12                             │
│  Order #1845 — $890.00 (New customer)               │
│  Agent: order_approval                              │
│  ┌─────────────────────────────────────────────┐    │
│  │  "New customers: manual review required for │    │
│  │   all orders above $200." — §2              │    │
│  └─────────────────────────────────────────────┘    │
│  Confidence: 95%  |  Latency: 1.1s  |  👍 👎       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 3. The Key Insight (Client Autonomy)

```
SCENARIO: E-commerce manager wants to change auto-approve limit
          from $750 to $1,000 for Standard customers.

V2 (Legacy):
  1. Contact developer
  2. Developer changes const AUTO_APPROVE_LIMIT = 1000
  3. Code review + merge + deploy
  4. Elapsed time: 2-5 days
  5. Cost: Developer hours

V4 (Policy Agent):
  1. Manager opens Dashboard → Upload Documents
  2. Edits order_approval_policy.pdf: "$1,000" instead of "$750"
  3. Uploads new version
  4. Google File Search API re-indexes automatically
  5. Next order uses the new rule immediately
  6. Elapsed time: 5 minutes
  7. Cost: $0
  8. Bonus: Complete audit trail of when the rule changed
```

---

## 4. Comparison Checklist

| Check | V2 (Wrong) | V4 (Right) |
|:---|:---:|:---:|
| Zero Hard-Code | ❌ 3 magic numbers | ✅ All from document |
| Policy Agent | ❌ None | ✅ `consultPolicyAgent()` |
| Audit Trail | ❌ No log | ✅ `audit_logs` with citation |
| Client Autonomy | ❌ Requires developer | ✅ Edit PDF, instant effect |
| `"use server"` | ❌ Controller class | ✅ Server Action |
| `ActionResponse<T>` | ❌ Void return | ✅ Typed `OrderDecision` |
| Zod Validation | ❌ None | ✅ Full schema |
| Risk-Aware | ❌ Same path for all | ✅ `riskLevel` for CoVe |
| Citation | ❌ None | ✅ Section reference |
| Multi-Rule | ❌ Simple if/else | ✅ Agent evaluates all rules |

---

*Golden Sample generated under Prisma V4 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*

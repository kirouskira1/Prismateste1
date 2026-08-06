# Golden Sample: V4 Architecture in FitPro Manager

**Classification:** REFERENCE  
**Codename:** `Golden_Sample_FitPro`  
**Version:** V5.0  
**Context Layer:** Always (Architectural Reference)  
**Est. Tokens:** ~800 tokens  

---

This document serves as the "Practical Answer Key" and "Architectural Source of Truth" for the TRM Cognitive Agent. It demonstrates how to transform a rigid business rule into a flexible Policy Agent.

**EXAMPLE CONTEXT:**
The "FitPro Manager" needs to automate progressive overload for students.
- *Scenario:* The student finishes a workout and rates the exercise as "Easy."
- *Objective:* The system must decide whether to increase weight for the next session.

---

## 1. THE WRONG WAY (V2 Approach — Legacy)

*This approach is PROHIBITED in V4. The code below would fail the Self-Audit.*

**File:** `src/controllers/WorkoutController.ts`

```typescript
// ❌ WRONG: Hard-Coded Business Rule
export async function finishWorkout(workoutId: string, feedback: string) {
  const workout = await db.getWorkout(workoutId);

  // The developer "hardwired" the rule into code.
  // If the Personal Trainer wants to change to "Very Easy" or increase by 3kg,
  // they need to hire the developer again.
  if (feedback === 'Easy' && workout.lastWeight < 50) {
      const newWeight = workout.lastWeight + 2; // Fixed 2kg increase
      await db.updateNextWorkout(workout.studentId, { weight: newWeight });
  }
}
```

**Why this fails the V4 Audit:**
- Hard-coded business value (`2` kg, `50` kg limit, `'Easy'` trigger).
- No `consultPolicyAgent()` call.
- No audit trail — no one knows *why* the weight changed.
- If the trainer wants to change the rule, code changes + redeploy required.

---

## 2. THE RIGHT WAY (V4 Approach — Policy Agents)

*This is the MANDATORY approach. Logic is delegated to an agent that reads dynamic rules.*

### A. The Business Rule (Run-Time)

The Personal Trainer writes this in a text/PDF file and uploads it via Dashboard.

**File (Client RAG):** `progressive_overload_methodology.txt`

```
"For Intermediate-level students: If the student reports the exercise was 'Easy'
or 'Very Easy' for two consecutive sessions, apply progressive overload.
Increase the load by 5% (rounding up). Never increase the load if the student
reported joint pain."
```

### B. The Server Action (V4 Pattern)

Prisma generates this code using the `consultPolicyAgent()` pattern.

**File:** `src/actions/workouts.ts`

```typescript
// ✅ RIGHT: Policy Agent Delegation via Server Action
"use server";

import { consultPolicyAgent } from "@/lib/policy-agent";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const finishWorkoutSchema = z.object({
  workoutId: z.string().uuid(),
  feedback: z.string(),
  studentData: z.object({
    level: z.string(),
    lastWeight: z.number(),
    consecutiveEasyCount: z.number(),
    reportedPain: z.boolean(),
  }),
});

type ActionResponse<T> = { success: boolean; data?: T; error?: string };

export async function finishWorkout(
  input: z.infer<typeof finishWorkoutSchema>
): Promise<ActionResponse<{ newWeight: number; reason: string }>> {
  try {
    const validated = finishWorkoutSchema.parse(input);
    const supabase = await createClient();

    // 1. The code does NOT know the rule. It asks the Agent.
    const decision = await consultPolicyAgent({
      agentName: "workout_progression",
      context: {
        studentData: validated.studentData,
        currentFeedback: validated.feedback,
      },
    });

    // 2. Execute the agent's decision
    if (decision.action === "INCREASE_WEIGHT") {
      await supabase
        .from("workout_plans")
        .update({ weight: decision.value })
        .eq("id", validated.workoutId);
    }

    return {
      success: true,
      data: {
        newWeight: decision.value ?? validated.studentData.lastWeight,
        reason: decision.reason,
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

### C. The Visual Interface (Design-First)

In the Agent Control Center (Dashboard), the Personal Trainer would see:

- **Activity Card:** "The Workout Agent adjusted João's Bench Press to 42kg."
- **Action Button:** "View Reason" → Click opens: "Based on rule from your document 'progressive_overload_methodology.txt': 5% increase after 'Easy' feedback."
- **Citation Block:** `amber-100/10` background with the exact document excerpt.
- **Feedback:** `👍 / 👎` buttons for the trainer to rate the decision.
- **Upload Area:** "Drag new PDFs here to teach new rules to your agent."

---

## 3. The Checklist (V4 Audit Application)

| Check | V2 (Wrong) | V4 (Right) |
|:---|:---:|:---:|
| Zero Hard-Code | ❌ `lastWeight + 2` | ✅ `decision.value` |
| Policy Agent | ❌ None | ✅ `consultPolicyAgent()` |
| Audit Trail | ❌ No log | ✅ `audit_logs` record |
| Client Autonomy | ❌ Requires dev | ✅ Edit PDF |
| `"use server"` | ❌ API route | ✅ Server Action |
| `ActionResponse<T>` | ❌ Void | ✅ Typed response |
| Zod Validation | ❌ None | ✅ Schema defined |

---

*Golden Sample generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
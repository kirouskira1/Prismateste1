# Skill: RLS Policy — Best Practices

**Read this BEFORE writing any RLS policy or query involving user data. This is mandatory.**

---

## Golden Rule

**Row Level Security is NOT optional.** Every table that contains user-scoped data MUST have RLS enabled with at least SELECT and INSERT policies.

```sql
-- ALWAYS enable RLS on user-scoped tables
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
```

## Standard Policy Patterns

### Pattern 1: User Owns Their Data

```sql
-- SELECT: users can only read their own rows
CREATE POLICY "Users read own data"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: users can only insert as themselves
CREATE POLICY "Users insert own data"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own rows
CREATE POLICY "Users update own data"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: users can only delete their own rows
CREATE POLICY "Users delete own data"
ON public.profiles FOR DELETE
USING (auth.uid() = user_id);
```

### Pattern 2: Organization-Scoped Access

```sql
-- Users can read data from their organization
CREATE POLICY "Org members read org data"
ON public.projects FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.org_members
    WHERE user_id = auth.uid()
  )
);
```

### Pattern 3: Role-Based Access

```sql
-- Only admins can delete
CREATE POLICY "Admins delete"
ON public.settings FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

## Common Mistakes to Avoid

| Mistake | Severity | Fix |
|:---|:---:|:---|
| Filtering by `user_id` in application code instead of RLS | 🔴 CRITICAL | Let RLS handle it — remove manual `WHERE user_id =` |
| `USING (true)` on a user table | 🔴 CRITICAL | Never allow unrestricted access |
| Missing `WITH CHECK` on INSERT/UPDATE | 🟡 MAJOR | Always validate on write operations |
| Using `auth.uid()` in a service_role context | 🟡 MAJOR | Service role bypasses RLS — use with caution |
| RLS disabled "temporarily" | 🔴 CRITICAL | Never disable in production |

## Application Code Rule

```typescript
// ❌ WRONG — manual user_id filtering (RLS should do this)
const { data } = await supabase
  .from("projects")
  .select("*")
  .eq("user_id", userId);  // ← redundant if RLS is set

// ✅ RIGHT — trust RLS, no manual filter needed
const { data } = await supabase
  .from("projects")
  .select("*");
// RLS automatically scopes to auth.uid()
```

## Security Audit Checklist

Before declaring an RLS policy complete:

- [ ] `ENABLE ROW LEVEL SECURITY` is present on the table
- [ ] SELECT policy uses `auth.uid()` comparison
- [ ] INSERT policy has `WITH CHECK` clause
- [ ] UPDATE policy has BOTH `USING` and `WITH CHECK`
- [ ] No `USING (true)` on user-scoped tables
- [ ] Application code does NOT duplicate RLS logic with manual filters
- [ ] Service role is ONLY used in server-side admin operations

---

*Skill file generated under Prisma V4.5 directives*

# Skill: React Component — Best Practices

**Read this BEFORE writing any React component. This is mandatory.**

---

## Server Component by Default

Every component is a **Server Component** unless it absolutely needs client interactivity. This is the App Router's fundamental paradigm.

```
DECISION TREE:
  Does this component need useState, useEffect, onClick, or onChange?
    ├── NO  → Server Component (default, NO directive needed)
    └── YES → Client Island ("use client" at line 1)
              ⚠️ Keep the island as SMALL as possible.
              Extract the interactive part into a separate file.
```

## Client Island Pattern (Isolation)

```
❌ WRONG — entire page as client
// app/dashboard/page.tsx
"use client";  ← Kill Switch K1: entire page as client!
export default function Dashboard() { ... }

✅ RIGHT — isolated client island
// app/dashboard/page.tsx (Server Component — no directive)
import { DashboardStats } from "./DashboardStats";
import { InteractiveChart } from "./InteractiveChart";  // ← only this is client

export default async function Dashboard() {
  const data = await getStats();  // server-side data fetch
  return (
    <div>
      <DashboardStats data={data} />       {/* Server */}
      <InteractiveChart data={data} />     {/* Client Island */}
    </div>
  );
}

// app/dashboard/InteractiveChart.tsx
"use client";  ← Only the interactive part
export function InteractiveChart({ data }) { ... }
```

## Visual Standards (Factory 1)

| Rule | Standard |
|:---|:---|
| Color Palette | Blue Midnight (`bg-slate-950`, `text-blue-400`) |
| Dark Mode | Mandatory — no light-only components |
| Framework | Tailwind CSS + shadcn/ui |
| Responsive | Mobile-first breakpoints (`sm:`, `md:`, `lg:`) |
| Accessibility | `aria-label` on interactive elements |

## Common Mistakes to Avoid

| Mistake | Kill Switch? | Fix |
|:---|:---:|:---|
| `"use client"` on page component | K1 ☠️ | Extract client island |
| `useEffect(() => fetch('/api/...'))` | Anti-Legacy | Use Server Action |
| No dark mode support | Audit Domain 4 | Use `dark:` Tailwind variants |
| Missing responsive breakpoints | Audit Domain 4 | Add `sm:` / `md:` / `lg:` |
| Inline styles instead of Tailwind | Convention | Use utility classes |

## Data Flow

```
Server Component (fetches data)
  └── passes data as props to Client Island
        └── Client Island handles user interaction
              └── calls Server Action for mutations
                    └── Server Action returns ActionResponse<T>
```

**Never fetch data inside a Client Component.** Data flows DOWN from Server Components.

---

*Skill file generated under Prisma V4.5 directives*

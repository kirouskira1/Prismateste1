# Tools and Components Registry (MCPs) — Prisma V5.0

**Classification:** REFERENCE  
**Codename:** `MCP_Component_Registry`  
**Version:** V5.0  
**Context Layer:** Task (UI Implementation)  
**Est. Tokens:** ~600 tokens  

---

This document serves as the official "Parts Catalog." The TRM Cognitive Agent **MUST** consult this registry when refactoring raw Stitch HTML.

**Master Directive:** Never recreate complex styles or data visualizations from scratch (pure CSS). If a premium visual component already exists in this registry, your task is to **import and configure it**.

---

## 1. Data Visualization & Dashboards MCP (The "Brain")

**Standard Library:** **Tremor UI** (v3.x or higher)  
**Mandatory Use:** On any administrative, analytics, or financial screen.

| Visual Element in Prototype (HTML) | Recommended Tremor Component | Implementation Notes |
|:---|:---|:---|
| Bar / Column Chart | `<BarChart />` | Use for comparisons (e.g., "Revenue vs Expenses"). Configure colors to `['emerald', 'red']` for financial. |
| Pie / Donut Chart | `<DonutChart />` | Use for compositions (e.g., "Plan Distribution"). |
| KPI Card (Large Number) | `<Metric />` inside `<Card />` | Use for main metrics ("Total Revenue", "Total Users"). |
| KPI Support Text | `<Text />` | For captions or subtitles inside Cards. |
| Simple Data Table | `<Table />` | For quick dashboard listings. |
| Date Range Selector | `<DateRangePicker />` | Mandatory on report screens. |

---

## 2. "Wow Factor" Design & Marketing MCP (The "Soul")

**Standard Libraries:** **Magic UI** & **Aceternity UI**  
**Mandatory Use:** On Landing Page and product highlight areas to create high-value perception ("Wow" effect).

### Hero & Presentation Section
- **Background:**
  - *Technical Option:* `AnimatedGridPattern` (Magic UI) — For SaaS B2B/DevTools products.
  - *Aesthetic Option:* `AuroraBackground` (Aceternity) — For modern, creative products.
- **Titles (H1):** `WordPullUp` or `GradualSpacing` (Magic UI) for smooth text entry animation.
- **CTA Buttons (Call to Action):** `ShimmerButton` (Magic UI) — The animated shimmer button for maximum conversion.

### Social Proof Section (Client Logos)
- **Component:** `<Marquee />` (Magic UI).
- **Use:** Replace any static logo list (`<ul>`) with this infinite scroll component.

### Special Card Effects
- **Highlight:** `BorderBeam` (Magic UI).
- **Use:** Add an animated glowing border that traverses the "Pricing Plans" or "Main Feature" container.

---

## 3. Structure & Base Functionality MCP (The "Body")

**Standard Library:** **shadcn/ui** (Based on Radix UI + Tailwind)  
**Mandatory Use:** For the entire application skeleton, complex forms, and standard interactions.

| Category | Components |
|:---|:---|
| Layout | `Sheet` (Mobile Sidebar), `NavigationMenu` (Header) |
| Forms | `Form` (react-hook-form + zod), `Input`, `Select`, `Switch`, `Checkbox` |
| Feedback | `Toast` (Notifications), `Alert`, `Dialog` (Confirmation modals) |
| Actions | `Button` (Variants: default, outline, ghost), `DropdownMenu` (Context menus) |
| Complex Data | `DataTable` (TanStack Table) for tables with pagination, filter, and sorting |

---

## 4. Composition Rules (How the Agent Must Assemble)

1. **Selection Hierarchy:**
   - Is it statistical data? → **Tremor**.
   - Is it a marketing/landing page animation? → **Magic UI**.
   - Is it a functional element (button, input, modal)? → **shadcn/ui**.

2. **Theme Customization:**
   - All components must respect the CSS color variables (`--primary`, `--background`, `--foreground`) defined in the project's `globals.css`. This ensures the Blue Midnight theme is preserved and applied to imported components.

3. **Automatic Installation:**
   - The Agent must identify which components are needed and include installation commands in the execution plan (e.g., `npx shadcn-ui@latest add button input`).

---

*Registry generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
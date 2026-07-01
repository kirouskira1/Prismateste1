# Stitch Prompting Protocol — Prisma V4

**Classification:** REFERENCE  
**Codename:** `Stitch_Protocol`  
**Version:** V4  
**Context Layer:** Task (Visual Prototyping)  
**Est. Tokens:** ~600 tokens  

---

This document defines the gold standard for generating visual prompts in Google Stitch. The goal is to produce an HTML/CSS file (`prototype.html`) that serves as the perfect "Visual Source of Truth" for TRM Agent refactoring.

---

## 1. Anatomy of a Perfect Stitch Prompt

When requesting an interface from Stitch, the Architect must build the prompt following this 4-layer structure:

### Layer 1: Context and Style
> "Act as a Senior UI Designer. Create an interface for [APP_NAME], a [SHORT_DESCRIPTION] platform.
> **Visual Style:** [Minimalist / Analytics-Driven / SaaS B2B / Modern].
> **Color Palette:** Background [Light/Dark], Primary Color [Blue/Purple/Green], with high contrast for readability."

### Layer 2: Layout Structure (The Skeleton)
> "The page must have the following fixed structure:
> 1. **Sidebar (Left):** Fixed, with navigation for [Module List].
> 2. **Header (Top):** With global search, notifications, and user avatar.
> 3. **Main Content (Center):** A content area with generous padding."

### Layer 3: Specific Components (The Content)
> "Inside the main area, include:
> - **KPI Section:** A 4-card grid at the top showing key metrics (e.g., Total Revenue).
> - **Charts Section:** Two large containers side by side (placeholders for Sales and Users charts).
> - **Data Section:** A detailed table with columns for [Columns] and a 'New Item' action button."

### Layer 4: Technical Constraints (Critical for Refactoring)
> "**Mandatory Technical Rules:**
> - Use exclusively **semantic HTML5** and **Tailwind CSS** for styling.
> - Do not use custom CSS in `<style>` tags. Use Tailwind utility classes.
> - Do not add complex JavaScript logic. Only static visuals.
> - Use simple inline SVG icons (Lucide/Heroicons style)."

---

## 2. Practical Example (FitPro Manager Case)

**Generated Prompt:**
> "Create an administrative dashboard for 'FitPro Manager', a SaaS for personal trainers. Style 'Clean & Professional', light mode with Royal Blue accents.
> **Structure:** Side sidebar with links (Students, Workouts, Financial). Header with breadcrumbs and profile.
> **Content:**
> 1. Top: 4 KPI Cards (Active Students, Monthly Revenue, Today's Classes).
> 2. Middle: Grid with two panels for charts (Student Growth, Workout Distribution).
> 3. Bottom: A 'Latest Transactions' table with colored status (Paid=Green, Pending=Yellow).
> **Technical:** Use only Tailwind CSS. Inter or modern Sans-serif font. SVG icons."

---

## 3. How to Use the Output (V4.2 Flow)

> **Design-First PRD Note:** Se a referência inicial for uma imagem/mockup ou mesmo um HTML do Stitch, o sistema não deve codificar o React diretamente. Ele DEVE gerar o *Design-First PRD* detalhando o layout e componentes antes da refatoração final. (ref: `18_Design_First_PRD_Protocol.md`).

1. **Generate:** Copy the Stitch-generated HTML.
2. **Store:** Save as `prototype.html` in the project root.
3. **TRM Agent Action:**
   - The agent reads this HTML to understand the *layout*.
   - It ignores generic SVGs and divs.
   - It consults `03_MCP_Component_Registry.md` and replaces:
     - "KPI Cards" in HTML → `<Metric>` component from **Tremor**.
     - "Table" in HTML → `<DataTable>` component from **shadcn/ui**.
4. **Palette Override:** The agent applies Blue Midnight tokens regardless of Stitch colors.

---

*Protocol generated under Prisma V4 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
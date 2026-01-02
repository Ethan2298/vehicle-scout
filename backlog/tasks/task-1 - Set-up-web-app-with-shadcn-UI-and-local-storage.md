---
id: task-1
title: Set up web app with shadcn UI and local storage
status: To Do
assignee: []
created_date: '2026-01-02 23:17'
labels: [setup, frontend]
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Initialize the vehicle-scout web application using Next.js with TypeScript, shadcn/ui component library, and local storage for data persistence. This task sets up the foundational project structure that all future features will build upon.

**What is Vehicle Scout?**
A web application for tracking and managing vehicle information, stored locally in the browser.

**Tech Stack:**
- **Framework:** Next.js 14+ (React-based, App Router)
- **Language:** TypeScript
- **UI Components:** shadcn/ui (built on Radix UI + Tailwind CSS)
- **Styling:** Tailwind CSS
- **Data Storage:** Browser LocalStorage
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Next.js project created with TypeScript and App Router
- [ ] #2 Tailwind CSS installed and configured
- [ ] #3 shadcn/ui initialized with at least 3 base components (Button, Card, Input)
- [ ] #4 Local storage utility module created with get/set/remove functions
- [ ] #5 Basic app layout with header, main content area, and responsive design
- [ ] #6 Development server runs without errors on localhost:3000
- [ ] #7 Project builds successfully with no TypeScript errors
<!-- AC:END -->

## Implementation Plan

### Step 1: Create Next.js Project
```bash
cd C:\Users\ethan\vehicle-scout
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```
When prompted:
- Would you like to use TypeScript? **Yes**
- Would you like to use ESLint? **Yes**
- Would you like to use Tailwind CSS? **Yes**
- Would you like to use `src/` directory? **Yes**
- Would you like to use App Router? **Yes**
- Would you like to customize the default import alias? **Yes** (@/*)

### Step 2: Initialize shadcn/ui
```bash
npx shadcn@latest init
```
When prompted:
- Which style would you like to use? **Default**
- Which color would you like to use as base color? **Slate** (or your preference)
- Would you like to use CSS variables for colors? **Yes**

### Step 3: Install Base shadcn Components
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
```

### Step 4: Create Local Storage Utility
Create file: `src/lib/storage.ts`
```typescript
// Type-safe local storage wrapper

export const storage = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }
};
```

### Step 5: Create Basic Layout
Update file: `src/app/layout.tsx`
- Add a header component with app title
- Ensure proper html/body structure with Tailwind classes

Create file: `src/components/Header.tsx`
```typescript
export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-xl font-bold">Vehicle Scout</h1>
      </div>
    </header>
  );
}
```

### Step 6: Update Home Page
Update file: `src/app/page.tsx`
- Remove default Next.js boilerplate
- Add a simple welcome card using shadcn Card component
- Import and use Button component as example

### Step 7: Verify Setup
```bash
npm run dev     # Should start on localhost:3000
npm run build   # Should complete with no errors
npm run lint    # Should pass with no errors
```

## Notes

**For Junior Developers:**

1. **Don't skip TypeScript errors** - Fix them before moving on. They prevent bugs.

2. **shadcn/ui is NOT installed via npm** - It copies component code into your project. This is intentional so you can customize components.

3. **Local storage only works in browser** - The `typeof window === 'undefined'` checks prevent errors during server-side rendering.

4. **File structure after completion:**
```
vehicle-scout/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with Header
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Tailwind imports
│   ├── components/
│   │   ├── ui/             # shadcn components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── input.tsx
│   │   └── Header.tsx      # Custom header component
│   └── lib/
│       ├── utils.ts        # shadcn utility (auto-generated)
│       └── storage.ts      # Local storage utility
├── components.json          # shadcn config
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

5. **Common Issues:**
   - If `npx shadcn` fails, try `npx shadcn-ui@latest` instead
   - If port 3000 is busy, Next.js will auto-use 3001
   - Clear `.next` folder if you see stale cache issues: `rm -rf .next`

**Resources:**
- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

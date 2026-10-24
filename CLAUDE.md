# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A mobile-first PWA for tracking daily expenses, built for installation on an iPhone home screen.
React 19 + TypeScript + Vite 7 + Tailwind v4, with all data stored locally in IndexedDB.
UI defaults to English with a Hebrew (RTL) toggle. See [README.md](README.md) for user-facing docs
and deployment instructions.

## Commands

```bash
npm run dev                  # dev server (5173)
npm run dev:host             # dev server exposed on the LAN, for phone testing
npm run build                # tsc -b && vite build, generates the service worker
npm run preview              # serve the production build (4173)
npm run test                 # all tests
npm run test:watch
npm run generate-pwa-assets  # regenerate all icons from public/favicon.svg
npx tsc -b                   # typecheck only (includes test files)
```

Single test file or single case:

```bash
npx vitest run src/domain/money.test.ts
npx vitest run -t "מונע הוספה כפולה"
```

Deploy (project `clickcash`, production at https://clickcash-beta.vercel.app):

```bash
npx vercel --prod --yes
```

## Architecture

Dependencies flow one way: `components/` → `hooks/` → `domain/` + `data/`.

**`domain/` is pure.** No React, no IndexedDB, no DOM. Validation, money math, summaries,
filtering and CSV/JSON serialization all live here and are where test coverage concentrates.
Put new business logic here, not in components.

**`data/ExpenseRepository.ts` is the only data seam.** Every read and write goes through this
interface. `IdbExpenseRepository` is the sole implementation today; a future C# backend becomes a
second implementation swapped in at [src/App.tsx](src/App.tsx) without touching components. Never
import `getDb()` from a component or hook.

**`useExpenses` loads everything into memory once.** Filtering, sorting and summaries are pure
`useMemo` calls over that array via `domain/filters.ts` and `domain/summaries.ts`. Do not add
IndexedDB index queries for filtering — the indexes exist for future scale, not for the current
read path.

## Conventions that are easy to break

**Money is integer minor units.** `Expense.amountMinor` is agorot/cents, never a float.
`domain/money.ts` is the only place that converts to and from decimal strings. Adding amounts
anywhere else must stay in minor units.

**Summaries never cross currencies.** `summarizeByCurrency` returns one entry per currency on
purpose. There is no FX conversion, so never produce a combined grand total.

**Optional fields: `undefined` in a patch means "clear".** `ExpenseRepository.update` treats a key
present in the patch with value `undefined` as an intentional clear, and an absent key as "keep
existing". `App.tsx`'s edit handler therefore spreads the input *and* re-states `description` and
`cardLast4` explicitly. If you add another optional field, add it there too or clearing it in the
edit sheet will silently do nothing.

**`normalizeInput` strips, it does not blank.** Empty optional fields are omitted from the stored
record rather than saved as `""`, and credit-only fields are dropped entirely for cash expenses.

**Schema changes need a migration.** Bump `DB_VERSION` in [src/data/db.ts](src/data/db.ts) and add
an `if (oldVersion < n)` block. v2 is a worked example: it moved legacy `description` values into
the then-new required `merchant` field by cursoring over existing records.

**Card numbers.** Only the last 4 digits are ever stored. Never add full PAN or CVV fields. There
is no fixed card list: every card used is remembered in `localStorage` via `rememberCard` in
[src/data/preferences.ts](src/data/preferences.ts), most-recent-first, and `knownCards[0]` is the
form's default. [src/components/CardField.tsx](src/components/CardField.tsx) renders a `select`
of all remembered cards plus a `+ New card…` option that swaps in a 4-digit input; it falls back
to that input when the list is empty or the current value is not in it (legacy records). Its
"adding" state resets by unmounting with the credit block — don't add an effect for it. A
`datalist` is wrong here: it filters options by the text already in the field, so a prefilled
default hides every other card.

## i18n and RTL

Every user-facing string goes through `t('key')`. `StringKey` is derived from the Hebrew dictionary
in [src/i18n/strings.ts](src/i18n/strings.ts), so adding a key there and forgetting the English one
is a type error. `<html lang>` and `dir` are set by `I18nProvider`, not in `index.html`.

Use Tailwind logical properties only — `ps-`/`pe-`, `ms-`/`me-`, `text-start`. Any `left`/`right`
utility will break the Hebrew layout.

A `datalist`'s `aria-label` must differ from its input's label, or `getByLabelText` matches both
and tests fail with "found multiple elements".

## Tailwind v4

Shared classes are declared with `@utility`, not inside `@layer components` — in v4 `@apply` only
works on real utilities, so `.btn-primary { @apply btn ... }` fails if `btn` is a plain class.
Theme colors are CSS custom properties on `:root`, redefined under `prefers-color-scheme: dark`,
and exposed to utilities through `@theme inline`. Dark mode follows the device with no manual toggle.

## iOS constraints

These are deliberate and load-bearing; changing them breaks one-handed entry on an iPhone:

- Inputs, selects and buttons must stay at `font-size: 16px`. Anything smaller makes Safari
  auto-zoom on focus.
- The amount field is `type="text"` with `inputMode="decimal"` — `type="number"` misbehaves in
  Safari and blocks decimal entry.
- The Add button stays in normal flow directly below the fields. Do not make it fixed or sticky;
  that is what puts it under the keyboard.
- `index.html` carries `viewport-fit=cover` and `interactive-widget=resizes-content`; layout
  padding uses `env(safe-area-inset-*)`.

## Testing

`src/test/setup.ts` wires `fake-indexeddb/auto` and jest-dom. `src/test/factories.ts` builds
`Expense`, `ExpenseInput` and form-value fixtures.

Repository tests must assign a fresh `new IDBFactory()` to `globalThis.indexedDB` and call
`resetDbConnection()` in `beforeEach`, otherwise state leaks between cases.

The app defaults to English, so any test asserting Hebrew strings must set
`localStorage.setItem(PREFERENCE_KEYS.language, 'he')` first — see [src/App.test.tsx](src/App.test.tsx).

## Editing files in this repo

Source comments and test names are in Hebrew. Do not rewrite files with PowerShell
`Get-Content -Raw` / `Set-Content`: without an explicit `-Encoding utf8` on the read, PS 5.1
decodes UTF-8 as ANSI and silently corrupts every Hebrew string in the file. Use the Edit and Write
tools instead.

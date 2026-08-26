# STATA Frontend Audit

Scope: `frontend/` — React 18 + TypeScript + Vite + Tailwind, 53 source files, ~11.7k lines.
Date: 2026-08-26. Baseline commit: `main`.

Every finding below was reproduced against the actual code — `tsc`, `eslint`, a production
build, and a headless Chromium run of the built app. Findings marked **Fixed** are addressed
in this branch; the rest are backlog items with the reasoning for leaving them.

---

## Summary

| Area | Before | After |
| --- | --- | --- |
| `npm run typecheck` | 16 errors | clean |
| `eslint` errors | 77 | 39 |
| `eslint` warnings | 24 | 24 |
| Entry JS bundle | 663 kB (156 kB gzip) | 263 kB (81 kB gzip) |
| Route chunks | 1 | 29 |
| React hooks-order violations | 12 | 0 |
| App-level error boundary | none | yes |
| Scroll reset on navigation | none | yes |
| 404 handling | silent redirect to `/` | real 404 page |

---

## P0 — Correctness

### 1. Hooks called after an early return (crash) — **Fixed**

`src/components/aspl/RegistrationForm.tsx` returned the "Sign In Required" modal from the
top of the component, then declared 8 `useState`s, a `useRef` and a `useEffect` below it.
`src/pages/admin/ManageAdmins.tsx` did the same with two `useMemo`s below an
`if (!isFullAdmin) return …` guard.

React counts hooks per render. When the guard flips — auth resolving on the ASPL page, an
admin signing out while on `/admin/accounts`, a role changing — the hook count changes
between renders and React throws `Rendered fewer hooks than expected`, unmounting the tree.
Before this branch that meant a blank white page (see P0-2).

Fix: the sign-in view moved into its own `SignInPrompt` component and the guard moved below
every hook; in `ManageAdmins` the derived lists and both memos were hoisted above the guard.

### 2. No error boundary — **Fixed**

A render-time throw anywhere unmounted the entire app and left an empty `<div id="root">`
with no way back except a manual reload. Added `src/components/ErrorBoundary.tsx` wrapping
the router, with a reload/home recovery UI and the message surfaced in dev only.

### 3. `useMemo` dependencies were new arrays on every render — **Fixed**

In `ManageAdmins`, `members` was `allMembers.filter(…)` computed inline, so the
`[members]` dependency was a fresh reference every render and both memos recomputed every
time — the memoization was decorative. The three role splits are now memos on `allMembers`.

---

## P1 — Navigation and UX

### 4. Mobile menu was an inline dropdown, not a sidebar — **Fixed** *(the change you asked for)*

The old menu rendered as a block appended under the header inside `<nav>`. Consequences:

- **It pushed the page down** rather than overlaying it, so opening the menu reflowed content.
- **It had no height limit.** A full admin saw ~18 rows plus a profile block; the menu ran
  past the fold and had to be scrolled *as part of the page*, with the header scrolling away.
- **Sign out sat at the very bottom**, unreachable without scrolling the whole page.
- **No dismissal affordances** — no backdrop, no Escape key, no focus management, and the
  page behind stayed scrollable.

Replaced with a right-anchored sidebar drawer:

- Fixed full-height panel (`h-[100dvh]`, `w-[86vw]`, `max-w-sm`) over a dimmed backdrop.
- **Three regions**: a pinned header (identity or brand + close), a **scrollable body**
  (`flex-1 min-h-0 overflow-y-auto overscroll-contain`), and a pinned footer holding Sign out
  / Sign In + Sign Up. Header and footer never scroll away.
- Grouped into labeled sections — Browse, Quick actions, Admin panel, Account — instead of
  one flat list.
- Backdrop click, Escape, and route change all close it; the page behind is scroll-locked
  while open (`overscroll-contain` stops scroll chaining).
- `role="dialog"`, `aria-modal`, `aria-label`; focus moves to the close button on open,
  returns to the hamburger on close, and Tab cycles inside the panel.
- `aria-expanded` / `aria-controls` on the hamburger, which previously had no label at all.
- Unmounted when closed (after one 300 ms exit animation), so its links stay out of the tab
  order. `motion-reduce:transition-none` on both backdrop and panel.

**Rendered through a portal to `document.body`, deliberately.** The header applies
`backdrop-blur` once scrolled, and a `backdrop-filter` makes that element the containing
block for `position: fixed` descendants — an in-tree drawer would have been trapped inside
the 56 px header once the user scrolled. Verified: with `backdropFilter: blur(8px)` active on
the header, the drawer still measures `top: 0, height: 844`.

Verified in headless Chromium at 360×600, 390×844 and 900×800: body region scrollable
(`scrollHeight 943` vs `clientHeight 438` on the small phone), page scroll locked while open
and restored after, focus returned to the trigger on Escape, and the drawer correctly absent
at ≥1020 px.

### 5. Scroll position carried across routes — **Fixed**

Nothing reset scroll on navigation, so following a link from halfway down `/people` landed
mid-page on `/events`. Added `src/components/ScrollToTop.tsx`, which resets on PUSH/REPLACE
but deliberately **not** on POP, so the back button still restores position.

### 6. Unknown URLs silently redirected to `/` — **Fixed**

`<Route path="*" element={<Navigate to="/" replace />} />` meant a typo, a stale link, or a
deleted post looked identical to visiting the homepage on purpose — broken links were
invisible to users and to anyone reading analytics. Replaced with a real `NotFound` page
rendered inside the normal shell.

---

## P1 — Performance

### 7. Everything shipped in one 663 kB bundle — **Fixed**

`App.tsx` imported all 26 pages eagerly, so a first-time visitor to the homepage downloaded
and parsed the admin panel, the ASPL bid manager, the markdown editor and the gallery
lightbox before anything rendered.

Converted every route except `Home` to `React.lazy` + a `<Suspense>` fallback reusing the
existing spinner. Entry bundle **663 kB → 263 kB** (gzip **156 kB → 81 kB**, −48%), split
into 29 chunks. The heaviest admin page, `Communications`, is now a 51 kB chunk loaded only
when an admin opens it.

### 8. Images are not lazy-loaded — *open*

45 `<img>` tags, only 2 with `loading="lazy"` (both in the gallery). `/people`, `/posts`,
`/events` and the ASPL players grid render every avatar and cover image eagerly. Adding
`loading="lazy" decoding="async"` to below-the-fold images is a one-line-per-tag change; no
`width`/`height` attributes are set either, so these lists also shift layout as images
arrive. Worth doing together.

---

## P2 — Type safety and lint hygiene

### 9. `npm run typecheck` was failing — **Fixed**

16 `TS6133` errors from unused imports and variables. Note that `npm run build` does **not**
run `tsc` (the script is plain `vite build`), so this had been failing unnoticed. Removed
the dead symbols, including a `loadingPhotos` state in `FeatureCard` that was written twice
and never read. Typecheck is now clean.

*Recommended follow-up:* make the build enforce it — `"build": "tsc --noEmit -p tsconfig.app.json && vite build"`.

### 10. 39 remaining `any`s — *open, deliberate*

28 of the 39 are `catch (err: any)` followed by `err.message`. The mechanical fix is one
shared helper:

```ts
export const errorMessage = (err: unknown, fallback = 'Something went wrong') =>
  err instanceof Error && err.message ? err.message : fallback;
```

then `catch (err) { showToast(errorMessage(err, 'Failed to delete'), false) }`. Left out of
this branch on purpose: it is 28 edits across 12 files for zero behavior change, and with no
test suite (see #14) that is a lot of untested churn to bundle with a UI change. Worth its
own PR.

The other 11 are genuine typing gaps — `adminApi.getMembers` returns `data: any[]`,
`AuthContext` types the `/auth/me` response as `any`, and `FeatureCard` casts members with
`(m as any).photo_url`. These deserve real interfaces in `src/lib/api.ts`; the `Member`
interface already exists and simply is not used in those return types.

### 11. ESLint config tuned — **Fixed**

`no-empty` now allows `catch {}` (the codebase's established way of marking a deliberately
ignored failure — 5 of them were being reported as errors), and `no-unused-vars` now honours
the `_name` convention already in use at `ManageMembers.tsx:188` and `SeasonDetail.tsx:21`.
Also fixed a ternary used as a statement in `Gallery.tsx` and an unnecessary `\[` escape
inside a character class in `ManageEvents.tsx`.

### 12. 23 `react-hooks/exhaustive-deps` warnings — *open*

Almost all are the same shape: a `load`/`fetchX` callback omitted from a `useEffect`
dependency array. Most are already wrapped in `useCallback`, so adding them is usually safe —
but a few (`PostEditor.tsx:51`, `ManageGallery.tsx:58`) would change fetch timing if added
naively. These need to be worked through one at a time rather than silenced in bulk.

---

## P2 — Accessibility

### 13. Broad a11y gaps — *partially fixed*

Before this branch the whole app had **4** `aria-label`s. The drawer work added labels,
`aria-expanded`/`aria-controls`, `aria-current="page"` on nav links, dialog semantics and
focus management to the header. The rest of the app still needs:

- **Icon-only buttons** across the admin tables (delete, toggle, refresh) have no accessible
  name — a screen reader announces "button".
- **7 `<img>` tags have no `alt` attribute** (`ManageEvents.tsx:146`, `Settings.tsx:318`,
  `ManageGallery.tsx:372`, `ManagePosts.tsx:170`, `Gallery.tsx:424` and `:503`,
  `MemberAccount.tsx:60`). Decorative ones need `alt=""`, the rest need real text.
- **24 clickable `<div>`s** with `onClick` and no `role`, `tabIndex` or key handler — not
  reachable by keyboard at all. The gallery lightbox and the people cards are the worst cases.
- **8 native `confirm()`/`alert()` calls** for destructive admin actions. They work, but they
  are unstyled, unlocalisable and blocking; a confirm dialog component would be better.
- **No skip-to-content link** and no `<h1>` on several pages.

### 14. No per-page titles or meta — *open*

`index.html` has good OG/Twitter tags, but they are static: every route reports
"STATA - Student Welfare Organization". A shared post or event link previews as the site
homepage, and browser history/tabs are indistinguishable. A ~15-line `useDocumentTitle` hook
(or `react-helmet-async` if OG tags matter for sharing) fixes the title case; true per-route
OG tags need prerendering or SSR, which is a bigger call given the Vercel static deploy.

---

## P3 — Maintenance

### 15. 848 lines of dead code — *open, needs your call*

`src/pages/admin/Messages.tsx` (347 lines) and `src/pages/admin/EmailCampaigns.tsx`
(501 lines) are imported by nothing and unreachable by any route. Both were superseded by
`Communications.tsx`, which reimplements them as `MessagesSection` and the campaigns section.
Not deleted here because that is your call, not mine — but they are dead, they still get
linted and typechecked, and they will drift from the live implementations.

### 16. No tests, no CI — *open*

No test runner, no test files, no `.github/` directory. Nothing catches the hooks-order bug
class from P0-1, and nothing stops `npm run typecheck` from silently going red again. The
cheapest meaningful step is a CI workflow running `npm ci && npm run typecheck && npm run
lint && npm run build` on PRs — that alone would have caught findings 1, 9 and 11.

### 17. `Communications.tsx` is 1081 lines — *open*

It holds five sections (contact messages, campaigns, individual email, inbox, initial
passwords) plus their state and API calls in one file, and it is the single largest chunk in
the build at 51 kB. Splitting the sections into sibling files under `admin/communications/`
would make it reviewable; the internal section components are already cleanly separated, so
this is mostly a file move.

### 18. Package identity — *cosmetic*

`package.json` still says `"name": "vite-react-typescript-starter"`.

### 19. Custom Tailwind breakpoints create an overlap band — *by design, documented*

`tailwind.config.js` overrides `md` to 752 px and `lg` to 1020 px. Between those widths the
header shows the desktop nav links **and** the hamburger. That is intentional — the drawer's
"Browse" section is `md:hidden` so the links are not duplicated — but it is non-obvious and
worth a comment in the config, since anyone adding a nav item has to know about both places.

---

## Verification

```
npm run typecheck   # clean
npm run lint        # 39 errors (all no-explicit-any, see #10), 24 warnings (see #12)
npm run build       # entry 262.98 kB / 80.53 kB gzip, 29 chunks
```

Drawer behaviour verified in headless Chromium (anonymous, member and admin sessions; 360×600,
390×844, 900×800 and 1100×800): scroll-lock on/off, Escape and backdrop dismissal, focus in
and out, section visibility per role and per breakpoint, and correct positioning over the
blurred sticky header.

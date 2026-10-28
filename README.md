# kb — the support knowledge base

**kb** = knowledge base. What the support desk knows about how our products break, written
down where the code can keep it honest.

One desk takes reports for every product we run: `sched-prod` (calendar invites for about
300k people) and the rest. When something
goes wrong, the reports reach the desk first. This kb is how the desk triages them, what each
incident turned out to be, and why we decided what we decided.

## What's here

```
src/routes/kb/      the pages (.svx: Markdown with components)
  triage/           how the desk handles incoming reports
  incidents/        one page per big ticket
  decisions/        numbered decision records
src/lib/kb/         components and the logic they run
src/lib/layouts/    the frame every page shares
src/lib/data/       exports from the ticket system
```

## Conventions

- Words in the page, logic in `src/lib` (imported as `#lib/…`). A number that can be computed belongs in a component.
- Every page starts with frontmatter: `title`, `owner`, `status`, `reviewed`.
- A decision is never edited after it is accepted. A new record replaces it.
- A page you add is signed: its frontmatter carries your `signature` and it ends with `<RenderStamp {signature} />`, so the desk knows who wrote it.

## Owners

Support desk. Decision records: whoever signed them.

---

Exported 2026-10-04 from the `support` repo, `apps/kb/` → `src/`.

---

## Added: #4471 split (MEGA.dev S01E03)

#4471 holds three problems, not one. One GitHub issue per problem, each with its report count:

| problem | reports | issue |
|---|---|---|
| `parser`: shared parser reads day-first dates month first | 374 | #1 |
| `hint`: booking-v3 form hint says MM/DD/YYYY | 33 | #2 |
| `one-day`: invite date moves by one day (time zone / DST) | 5 | #3 |

412 unique reports (the export has 427 rows; 15 ids repeat).

- The page: [`src/routes/kb/incidents/4471-split/+page.svx`](src/routes/kb/incidents/4471-split/+page.svx), signed, desk ref `DR-23QE-A8WQ`.
- The page as the desk sees it (prerendered): [`rendered/kb/incidents/4471-split/index.html`](rendered/kb/incidents/4471-split/index.html).
- Logic: [`src/lib/kb/problems.ts`](src/lib/kb/problems.ts), table [`ProblemTable.svelte`](src/lib/kb/ProblemTable.svelte). Ids per problem: [`problems-4471.json`](problems-4471.json).
- Build: `npm ci && npx vite build` (SvelteKit + mdsvex + adapter-static; output in `build/`).

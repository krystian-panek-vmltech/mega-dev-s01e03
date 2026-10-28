// The problems inside a merged ticket: one per cause, read from what each report shows.
// causes.ts places a report by tenant and channel. That places a month flip, but a report that
// shows a one-day move is not a month flip at all: no day/month swap moves a date by one day.
// The desk marks those reports by hand (desk-notes.json); they get their own problem here.
import reports from '#lib/data/reports-4471.json';
import notes from '#lib/data/desk-notes.json';
import { causeOf, uniqueById, type Report } from '#lib/kb/causes';
import { tenantOf } from '#lib/kb/locales';

export type Problem = 'parser' | 'hint' | 'one-day';

// Where each problem is tracked. `issue` is the GitHub issue in the tracker repo.
export const TRACKER = 'https://github.com/krystian-panek-vmltech/mega-dev-s01e03';
export const PROBLEMS: Record<Problem, { issue: number; title: string; what: string }> = {
  parser: {
    issue: 1,
    title: 'Shared date parser reads day-first dates month first',
    what: 'Day and month swap: 7 April arrives as 4 July. Any channel, every day-first tenant.',
  },
  hint: {
    issue: 2,
    title: 'booking-v3 form hint says MM/DD/YYYY to day-first tenants',
    what: 'Day and month swap, but only through the booking-v3 form: people type what the hint asks.',
  },
  'one-day': {
    issue: 3,
    title: 'Invite date moves by one day',
    what: 'No swap: the date is one day off (Tuesday shows as Monday). A time-zone or DST shift, not the parser.',
  },
};
export const ORDER: Problem[] = ['parser', 'hint', 'one-day'];

export function problemOf(r: Report, oneDay: readonly string[] = notes.oneDayMove): Problem | 'unplaced' {
  if (oneDay.includes(r.id)) return 'one-day';
  return causeOf(r, tenantOf(r)) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  taggedAs: Record<string, number>;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

// Reports merged into `ticket`, one id once (the export repeats some), split by problem.
export function splitTicket(ticket: number): { exported: number; merged: Report[]; groups: ProblemGroup[] } {
  const all = reports as Report[];
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const by = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of merged) {
    const p = problemOf(r);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const groups = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        taggedAs: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }), {}),
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { exported: all.length, merged, groups };
}

export function countOf(ticket: number, problem: Problem): number {
  return splitTicket(ticket).groups.find((g) => g.problem === problem)?.reports.length ?? 0;
}

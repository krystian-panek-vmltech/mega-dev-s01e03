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

// The desk's view (CauseTable): every report is counted where it is filed, by tenant and way in.
// A one-day move is filed by tenant too, so it stays in that count; it is its own problem as well,
// so its ticket counts it again. Its reports overlap the problem they are filed under.
export function filedAs(r: Report): Problem | 'unplaced' {
  return causeOf(r, tenantOf(r)) ?? 'unplaced';
}
export function isOneDay(r: Report, oneDay: readonly string[] = notes.oneDayMove): boolean {
  return oneDay.includes(r.id);
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
    const p = filedAs(r);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const oneDay = merged.filter((r) => isOneDay(r));
  if (oneDay.length) by.set('one-day', oneDay);
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
  // Filed groups first, the overlapping one-day group last.
  groups.sort((a, b) => Number(a.problem === 'one-day') - Number(b.problem === 'one-day'));
  return { exported: all.length, merged, groups };
}

// Reports filed under `problem` that the desk read as a one-day move.
export function oneDayIn(ticket: number, problem: Problem): number {
  if (problem === 'one-day') return 0;
  return splitTicket(ticket).groups.find((g) => g.problem === problem)?.reports.filter((r) => isOneDay(r)).length ?? 0;
}

export function countOf(ticket: number, problem: Problem): number {
  return splitTicket(ticket).groups.find((g) => g.problem === problem)?.reports.length ?? 0;
}

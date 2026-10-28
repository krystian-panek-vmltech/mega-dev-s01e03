<script lang="ts">
  import { splitTicket, oneDayIn, PROBLEMS, TRACKER } from '#lib/kb/problems';

  let { ticket }: { ticket: number } = $props();

  const split = $derived(splitTicket(ticket));
  const tags = (t: Record<string, number>) =>
    Object.entries(t).sort((a, b) => b[1] - a[1]).map(([tag, n]) => `${tag} ×${n}`).join(' · ');
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports merged into #{ticket}
  ({split.exported} rows in the export, {split.exported - split.merged.length} repeated) ·
  <strong>{split.groups.length}</strong> {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tagged by intake as</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      {@const p = g.problem === 'unplaced' ? null : PROBLEMS[g.problem]}
      <tr>
        <td><code>{g.problem}</code>{#if p}<br /><span class="what">{p.title}</span>{/if}</td>
        <td><strong>{g.reports.length}</strong></td>
        <td class="tags">{tags(g.taggedAs)}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if p}<a href="{TRACKER}/issues/{p.issue}">#{p.issue}</a>{:else}none{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each split.groups as g (g.problem)}
  {@const moved = g.problem === 'unplaced' || g.problem === 'one-day' ? 0 : oneDayIn(ticket, g.problem)}
  {#if moved}
    <p class="note">{moved} of the <code>{g.problem}</code> reports read as a one-day move. The desk files them under
      <code>{g.problem}</code> by tenant, so they count there, and again under <code>one-day</code>, their own problem
      (<a href="{TRACKER}/issues/{PROBLEMS['one-day'].issue}">#{PROBLEMS['one-day'].issue}</a>).</p>
  {/if}
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .tags, .what, .note { color: var(--muted); font-size: 0.85em; }
</style>

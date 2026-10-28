<script lang="ts">
  import { countOf, type Problem } from '#lib/kb/problems';
  let { ticket, problem }: { ticket: number; problem: Problem } = $props();
</script>

<strong>{countOf(ticket, problem)}</strong>

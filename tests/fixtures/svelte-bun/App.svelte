<script>
  import { mewa } from "../../../dist/mewa-svelte/index.js";
  import { behavior as toggleBehavior } from "../../../dist/mewa-ui/components/toggle.js";

  let count = $state(0);
</script>

<main class="stack" data-svelte-smoke>
  <h1>Mewa UI with Svelte</h1>
  <div class="cluster">
    <button class="btn" type="button" data-counter onclick={() => count += 1}>
      Count: {count}
    </button>
    <button class="toggle" type="button" aria-pressed="false" data-mewa-toggle {@attach mewa(toggleBehavior)}>
      Pin result
    </button>
  </div>
</main>

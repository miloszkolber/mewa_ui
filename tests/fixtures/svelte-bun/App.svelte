<script>
  import { mewa } from "../../../dist/mewa-svelte/index.js";
  import { behavior as toggleBehavior } from "../../../dist/mewa-ui/components/toggle.js";

  import { state as counter } from "./state.svelte.ts";
  let visible = $state(true);
  let items = $state([1, 2]);
  let step = $state(1);
  let checked = $state(false);
  const parameterBehavior = {
    name: 'fixture-parameters',
    enhance(element, options) {
      element.dataset.step = String(options.step);
      const listener = () => element.dataset.total = String(Number(element.dataset.total || 0) + options.step);
      element.addEventListener('click', listener);
      return listener;
    },
    destroy(element, listener) {
      element.removeEventListener('click', listener);
    }
  };
</script>

<main class="stack" data-svelte-smoke>
  <h1>Mewa UI with Svelte</h1>
  <div class="cluster">
    <button class="btn" type="button" data-counter onclick={() => counter.count += 1}>
      Count: {counter.count}
    </button>
    <button type="button" data-mount-toggle onclick={() => visible = !visible}>Mount or unmount</button>
    {#if visible}
    <button class="toggle" type="button" aria-pressed="false" data-mewa-toggle {@attach mewa(toggleBehavior)}>
      Pin result
    </button>
    {/if}
  </div>
  <div>
    <button type="button" data-reorder onclick={() => items = [...items].reverse()}>Reorder</button>
    {#each items as id (id)}
      <button class="toggle" type="button" aria-pressed="false" data-keyed={id} {@attach mewa(toggleBehavior)}>Item {id}</button>
    {/each}
    <button type="button" data-step onclick={() => step = 2}>Use step two</button>
    <button type="button" data-parameters {@attach mewa(parameterBehavior, { step })}>Add step</button>
    <label><input type="checkbox" bind:checked data-native-binding>Native binding</label>
    <output data-native-state>{checked ? 'checked' : 'unchecked'}</output>
    <button type="button" data-native-set onclick={() => checked = false}>Clear checkbox</button>
  </div>
</main>

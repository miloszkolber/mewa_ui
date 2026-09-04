import { createController, type MewaBehavior } from '../dist/mewa-ui/index.js';
import { mewa } from '../dist/mewa-svelte/index.js';
import { sveltePlugin } from '../dist/mewa-svelte/bun-plugin.js';

const behavior: MewaBehavior<{ value: number }, { value: number }> = {
  name: 'typed-example',
  enhance(_root, options) {
    return { value: options?.value ?? 0 };
  },
  destroy(_root, state) {
    state?.value.toFixed();
  }
};
const controller = createController(behavior, document.body, { value: 1 });
controller.update({ value: 2 });
// @ts-expect-error options must preserve the declared value type
controller.update({ value: 'two' });
mewa(behavior, { value: 1 });
// @ts-expect-error attachment options must preserve the declared value type
mewa(behavior, { value: 'one' });
sveltePlugin({
  onwarn(warning) {
    warning.code.toUpperCase();
  }
});

document.body.addEventListener('tag-input:change', (event) => {
  event.detail.tags.map((tag) => tag.toUpperCase());
  // @ts-expect-error the event carries tags, not files
  event.detail.files.map(String);
});

Bun.build({ entrypoints: ['./app.svelte'], plugins: [sveltePlugin()] });
window.toast?.success({ title: 'Saved', duration: 3000 });
// @ts-expect-error only implemented toast variants are allowed
window.toast?.show({ title: 'Saved', variant: 'rainbow' });

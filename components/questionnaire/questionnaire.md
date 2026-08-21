# Questionnaire

## Native basis

`<form>` containing a sequence of native `<fieldset>` and `<legend>` question steps. Each step keeps ordinary form controls, labels, names, required constraints, and native submission semantics. The optional module only coordinates which fieldset is visible and leaves the final form submission to the browser.

## Native Web APIs

- [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) — native submission, reset, and form-control ownership
- [`<fieldset>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset) and [`<legend>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend) — semantic question grouping and accessible names
- [Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) — `required`, type, pattern, length, and range validation
- [`HTMLFormElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement) and [`reportValidity()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity) — native error reporting before advancing
- [`hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden) — removes inactive steps from the rendered and keyboard paths
- [`HTMLElement.focus()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) — moves focus to the active step after navigation
- [`<output>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output) or [`role="status"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role) — polite live progress announcement
- [`<progress>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress) — optional determinate progress bar
- [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) — bubbling `questionnaire:change` notification
- [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) — repeat-safe initialization for questionnaire roots added after navigation

## Structure

Load `src/base.css` before `src/tokens.css`, then this stylesheet and the component stylesheets used by the questions. Compose with [Form](../form/form.md), [Radio group](../radio-group/radio-group.md), [Steps](../steps/steps.md), [Text Field](../text-field/text-field.md), and [Button](../button/button.md).

```html
<form class="questionnaire" data-questionnaire aria-labelledby="questionnaire-title">
  <header class="questionnaire-header">
    <p class="questionnaire-eyebrow">Workspace setup</p>
    <h2 class="questionnaire-title" id="questionnaire-title">Tell us how you plan to work</h2>
    <p class="questionnaire-description">We will use these answers to tailor your first workspace.</p>
    <output class="questionnaire-progress" data-questionnaire-progress role="status" aria-live="polite">Step 1 of 2</output>
  </header>

  <!-- Optional visual indicator. It is not a second navigation control. -->
  <ol class="steps" data-questionnaire-steps aria-label="Questionnaire steps">
    <li class="step" data-questionnaire-step-indicator data-status="current" aria-current="step">
      <div class="step-indicator">1</div>
      <div class="step-content"><p class="step-title">Goal</p></div>
    </li>
    <li class="step" data-questionnaire-step-indicator>
      <div class="step-indicator">2</div>
      <div class="step-content"><p class="step-title">Workspace</p></div>
    </li>
  </ol>

  <fieldset class="questionnaire-step" data-questionnaire-step>
    <legend>What is your primary goal?</legend>
    <p class="field-description">Choose the outcome that matters most right now.</p>
    <fieldset class="radio-group">
      <legend>Primary goal options</legend>
      <div class="radio-item">
        <input class="radio" type="radio" id="questionnaire-collaborate" name="goal" value="collaborate" required>
        <label for="questionnaire-collaborate">Collaborate with a team</label>
      </div>
      <div class="radio-item">
        <input class="radio" type="radio" id="questionnaire-organize" name="goal" value="organize">
        <label for="questionnaire-organize">Organize personal work</label>
      </div>
    </fieldset>
  </fieldset>

  <fieldset class="questionnaire-step" data-questionnaire-step>
    <legend>What should we call this workspace?</legend>
    <div class="form-field">
      <label class="label" for="questionnaire-workspace">Workspace name</label>
      <input class="text-field-input" id="questionnaire-workspace" name="workspace" required aria-describedby="questionnaire-workspace-help" autocomplete="organization">
      <p class="field-description" id="questionnaire-workspace-help">Choose a name your team will recognize.</p>
    </div>
  </fieldset>

  <div class="questionnaire-actions" role="group" aria-label="Questionnaire navigation">
    <button class="btn" data-variant="secondary" type="button" data-questionnaire-back disabled>Back</button>
    <button class="btn" data-variant="default" type="button" data-questionnaire-next>Continue</button>
    <button class="btn" data-variant="default" type="submit" data-questionnaire-submit>Create workspace</button>
  </div>
</form>
```

### Optional progress bar

Add a native progress bar when a visual percentage is useful. Keep the live text or output as the announcement because a progress bar alone is not a reliable step-change message.

```html
<progress class="progress questionnaire-progress-bar" data-questionnaire-progress-bar max="2" value="1" aria-label="Questionnaire progress">Step 1 of 2</progress>
```

### No-JavaScript fallback

Do not put `hidden` on the steps in the source example. Without the module, all fieldsets remain visible, the browser's required/type validation still applies, and the native Submit button submits the form. Back and Continue are intentionally `type="button"`; they are inert without the module, while Submit remains the complete fallback. A server-rendered application may supply an initial `hidden` state when it also supplies an equivalent non-JavaScript navigation path.

## Data attributes and classes

| Attribute or class | Element | Values | Purpose |
|---|---|---|---|
| `.questionnaire` | `<form>` | — | Canonical root class. |
| `data-questionnaire` | `<form>` | presence | Alternate root hook for consumers that cannot add the class. The element must still be a form. |
| `data-init` | root | managed | Internal idempotency marker. Do not set or remove it in application code. |
| `.questionnaire-step` / `data-questionnaire-step` | `<fieldset>` | presence | Identifies one ordered question step. Use one hook or both. |
| `data-state` | step | `current`, `complete`, `upcoming` | Managed visual state. The module also uses `hidden` for inactive steps. |
| `data-questionnaire-progress` / `.questionnaire-progress` | `<output>`, `<p>`, or `<progress>` | presence | Live text progress target. The module writes `Step N of M`. |
| `data-questionnaire-progress-bar` / `.questionnaire-progress-bar` | `<progress>` or meter-like status | presence | Optional determinate progress target. |
| `data-questionnaire-steps` | `<ol class="steps">` | presence | Optional indicator list. Its direct `.step` children receive Steps-compatible `data-status` and `aria-current`. |
| `data-questionnaire-step-indicator` | indicator item | presence | Explicit indicator item hook. Items are matched by order. |
| `data-questionnaire-back` | button | presence | Previous-step control. `data-questionnaire-previous` and `data-questionnaire-prev` are accepted aliases. |
| `data-questionnaire-next` | button | presence | Continue control. `data-questionnaire-continue` is an accepted alias. |
| `data-questionnaire-submit` | submit button | presence | Final native submit control. A `button[type="submit"]` inside the form is also recognized. |
| `.questionnaire-actions` | footer or action container | — | Layout hook for Back, Continue, and Submit controls. |
| `data-current-step` | root | zero-based number | Managed current-step index for integrations that need a stable state hook. |

The module also accepts the corresponding `.questionnaire-back`, `.questionnaire-previous`, `.questionnaire-next`, `.questionnaire-continue`, and `.questionnaire-submit` class hooks. Prefer the explicit `data-questionnaire-*` attributes in new markup.

## Behavior

On initialization, the module finds the first non-hidden fieldset, or uses the first fieldset when all are hidden. It immediately shows only that step, announces its progress, sets the optional Steps indicators, hides Continue on the final step, hides Submit on earlier steps, and disables/hides Back on the first step.

Activating Continue checks the active step's native form controls. If a control is invalid, the module calls its native `reportValidity()` and does not move. If the step is valid, the module hides it, shows the next fieldset, updates progress, and focuses the active fieldset. Back moves immediately without bypassing any native validation. An implicit or explicit form submission before the final step is intercepted and follows the same validation-and-advance path as Continue. The final step remains native: the module does not call `form.submit()`, serialize values, or prevent the browser's final constraint validation and submission.

## Keyboard

| Key or action | Result |
|---|---|
| `Tab` / `Shift+Tab` | Uses the browser's native form order within the visible step and action footer. |
| `Space` / `Enter` on a radio | Uses native radio behavior. Arrow-key radio navigation remains provided by the browser and [Radio group](../radio-group/radio-group.md). |
| `Enter` / `Space` on Back or Continue | Activates the native button. Continue validates before advancing. |
| `Enter` in a non-final step | Follows the Continue validation-and-advance path instead of submitting early. |
| `Enter` on Submit | Uses native form submission and constraint validation on the final step. |
| `Tab` after a step change | Starts from the focused active fieldset and then enters its controls. |

The optional Steps list is informational. It is not made clickable and does not create a second keyboard navigation model. Use native Back and Continue controls for movement.

## Events

The form dispatches a bubbling event after initialization and after each successful step change:

| Event | Target | `detail` |
|---|---|---|
| `questionnaire:change` | `.questionnaire` form | `{ step, stepNumber, total, question, direction }` |

`step` is the zero-based active fieldset index, `stepNumber` is the one-based value for user-facing text, `total` is the number of steps, `question` is the active `<fieldset>`, and `direction` is `initial`, `next`, or `previous`.

```js
document.addEventListener('questionnaire:change', (event) => {
  const { stepNumber, total, direction } = event.detail;
  console.log(`Question ${stepNumber} of ${total} (${direction})`);
});
```

The event bubbles so an application can listen above the form. It is a step-coordination event, not a replacement for native `input` or `change` events from controls.

## Accessibility

- Keep the root as a real `<form>` and label it with `aria-labelledby` or an accessible name.
- Give every step a `<legend>` as its first meaningful label. Keep nested radio groups in their own fieldset and legend when a group name is needed.
- Use real `<label>` and `for`/`id` pairs for text controls. Give all radio inputs in one question the same `name` and use `required` on the group, as shown in [Radio group](../radio-group/radio-group.md).
- Let `required`, semantic input types, `pattern`, `min`, `max`, and related constraints provide validation. Do not replace browser errors with color-only messaging.
- Keep progress in an `output` or a status region with `aria-live="polite"`. The module updates it immediately without motion.
- Inactive steps use the native `hidden` state, so they are removed from the visual, focus, and assistive-technology paths. The active fieldset receives focus after Back or Continue.
- Keep the footer controls labelled with visible text. Use `button` elements, not clickable generic elements.
- Retain visible `:focus-visible` styles. The component stylesheet includes higher-contrast and forced-colors mappings, while composed Input, Radio, Steps, and Button styles supply their own control focus states.

## Limitations

- The module provides linear steps only. It does not implement branching questions, conditional step graphs, clickable step indicators, URL/history state, persistence, autosave, async validation, loading states, or a custom success screen.
- It coordinates only the fieldsets and controls documented here. A step must be a `<fieldset>` identified by `.questionnaire-step` or `data-questionnaire-step`.
- Validation is native and client-side. The server remains authoritative, and the final Submit action is not intercepted for fetch, JSON serialization, or custom error handling.
- The module does not create missing labels, progress regions, indicators, buttons, or IDs. Supply accessible markup even when the module is omitted.
- The no-JavaScript fallback keeps all source-visible steps available but cannot make a `type="button"` Continue control navigate. Provide a server-rendered multi-page fallback when navigation without JavaScript is required.

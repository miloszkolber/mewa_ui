# Consumer documentation evaluation

Run each task in a fresh workspace against one extracted generated core archive. Give the agent only that archive, the location of its `llms.txt`, and the intent prompt. Do not supply a source checkout, remote contract links, selected component names, implementation hints, or maintainer-session context. Supply the matching optional adapter archive only for the Svelte task; the agent may request matching optional icons when needed.

This protocol deliberately supplies the router. Record that starting condition separately from any harness's automatic discovery; a successful supplied-router task does not prove automatic discovery. Ordinary Markdown/JSON readers and file search are sufficient. Let the agent select contracts through the package's lookup and scoped records rather than injecting every component or system file.

| Task prompt | Evidence required |
| --- | --- |
| Create a plain form with a required name, a checkbox, and a submit button. | Native labels, names, required validation, explicit button types, working submission and reset; optional enhancement does not block the form without JavaScript. |
| Add searchable options to choose a destination and submit its value. | Select the documented searchable component, keep visible label and submitted value consistent, verify keyboard selection, Escape, empty results, and reset. |
| Open a dialog containing a form and return to its trigger after closing. | Load declared dependencies, preserve the form's method and validation, focus inside on open, verify Escape and close controls, restore focus. |
| Render a filterable table, append rows, and update it. | Use native table markup and current documented hooks; filter new rows without duplicating listeners or replacing application state. |
| Mount and unmount a Svelte control, reorder keyed controls, and reflect native checkbox state in the application. | Import CSS and the optional attachment, use one state owner, retain keyed identity, release listeners on unmount, preserve application and ARIA agreement. |
| Stream text into a message region while a reader scrolls through older content. | Use the documented streaming component, preserve user scroll position while unpinned, follow new content only while pinned, release observers when removed. |

## Record the actual reads

Record the archive name and SHA-256, package version, `manifest.source` revision/dirty state, and checksum verification result. A dirty revision identifies its base commit, not an immutable claim about the working-tree contracts. A Git-less archive must retain that provenance limit.

For each task, record selected slugs, considered and rejected alternatives, generated consumer files, executed checks, and failures. Keep an ordered read log with each actual path, SHA-256 of its file bytes, full-file size in raw UTF-8 bytes, and the section or byte range delivered to the agent. Record delivered content bytes and repeated reads separately. Distinguish supplied startup context from files the agent chose to open. Count actual loaded content, not every file present in the archive or a tokenizer estimate.

A task must not require all 80 contracts or all five system files to pass. Review irrelevant reads instead of excluding them from the record. Compare before/after read costs only when both actual runs exist; otherwise label whole-file byte envelopes as static baselines. Do not infer model uplift, universal token savings, or automatic loader behavior from smaller files.

## Inspect the resulting consumer

Evaluate the resulting page in a browser, not by inspecting its source alone. Check real imports and assets, native labels, submitted values, validation and reset, selected keyboard/focus/Escape behavior, declared styles/dependencies, documented no-JavaScript limits, one lifecycle owner, and the browser console. Use trusted native activation for form submission and reset, including canceled reset where enhancement applies.

Pass only if imports and hooks exist, declared dependencies and styles load, relevant native fallbacks work, keyboard/focus behavior matches the contract, and browser errors are absent. Include 320px width, light/dark themes, reduced motion, forced colors, and 200% browser zoom in the applicable visual checks. Report engine and assistive-technology coverage separately.

Record browser-toolbar zoom separately from CSS zoom. DOM roles and automated assertions do not prove screen-reader announcements. Keep observer browser checks separate from the agent's read log and implementation work.

Plain form, searchable selection, and dialog are the smallest native/optional/required coverage set. Keep all six intent tasks above; mark every unexecuted task unrun. The predetermined fixture in `tests/consumer-contract.test.mjs` checks package integration, not unassisted agent contract selection or documentation use.

When a task fails, distinguish incorrect agent selection from an incomplete contract or an implementation defect. Fix the authoritative source and rerun the affected task. Do not freeze exact prose or add a second component inventory to enforce this protocol.

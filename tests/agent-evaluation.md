# Consumer documentation evaluation

Run these tasks in a fresh consumer workspace against one generated release. Give the agent the package manifest and the matching source checkout or immutable contract links. Start with `llms.txt`. Do not supply implementation hints from the maintainer task.

| Task prompt | Evidence required |
| --- | --- |
| Create a plain form with a required name, a checkbox, and a submit button. | Native labels, names, required validation, explicit button types, working submission and reset; optional enhancement does not block the form without JavaScript. |
| Add searchable options to choose a destination and submit its value. | Select the documented searchable component, keep visible label and submitted value consistent, verify keyboard selection, Escape, empty results, and reset. |
| Open a dialog containing a form and return to its trigger after closing. | Load declared dependencies, preserve the form's method and validation, focus inside on open, verify Escape and close controls, restore focus. |
| Render a filterable table, append rows, and update it. | Use native table markup and current documented hooks; filter new rows without duplicating listeners or replacing application state. |
| Mount and unmount a Svelte control, reorder keyed controls, and reflect native checkbox state in the application. | Import CSS and the optional attachment, use one state owner, retain keyed identity, release listeners on unmount, preserve application and ARIA agreement. |
| Stream text into a message region while a reader scrolls through older content. | Use the documented streaming component, preserve user scroll position while unpinned, follow new content only while pinned, release observers when removed. |

For each task record the package revision, selected entries, files read, generated consumer files, checks run, and failures. Evaluate the resulting page in a browser, not by inspecting its source alone.

Pass only if imports and hooks exist, declared dependencies and styles load, relevant native fallbacks work, keyboard/focus behavior matches the contract, and browser errors are absent. Include 320px width, light/dark themes, reduced motion, forced colors, and 200% browser zoom in the applicable visual checks. Report engine and assistive-technology coverage separately.

When a task fails, distinguish incorrect agent selection from an incomplete contract or an implementation defect. Fix the authoritative source and rerun the affected task. Do not freeze exact prose or add a second component inventory to enforce this protocol.

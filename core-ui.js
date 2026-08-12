/* Core UI optional progressive enhancement. Generic data-ui-part hooks remain compatible with specialised hooks. */
(function () {
    "use strict";
    const instances = new WeakMap();
    const selector = "[data-ui-component],[data-ui-disclosure],[data-ui-tabs],[data-ui-dialog],[data-ui-alert-dialog],[data-ui-sheet],[data-ui-drawer],[data-ui-popover],[data-ui-menu],[data-ui-hovercard],[data-ui-navigation-menu],[data-ui-combobox],[data-ui-select],[data-ui-command],[data-ui-calendar],[data-ui-carousel],[data-ui-otp],[data-ui-resizable],[data-ui-sidebar],[data-ui-toggle],[data-ui-toggle-group],[data-ui-toast],[data-ui-toast-viewport],[data-ui-questionnaire],[data-ui-message-scroller],[data-ui-table]";
    const focusable = "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])";
    const modalStack = [];
    const modalInert = new Map();
    const sidebarRoots = new Set();
    let sidebarKeyListener;
    const q = (root, value) => root.querySelector(value);
    const qa = (root, value) => Array.from(root.querySelectorAll(value));
    const part = (root, names) => q(root, names.split(" ").map((name) => `[data-ui-part="${name}"]`).join(","));
    const parts = (root, names) => qa(root, names.split(" ").map((name) => `[data-ui-part="${name}"]`).join(","));
    const panelFor = (trigger, root) => document.getElementById(trigger?.getAttribute("aria-controls") || trigger?.dataset.uiDialogTarget || trigger?.dataset.uiTarget || "") || part(root, "panel dialog menu listbox content") || q(root, "[data-ui-content],[data-ui-popover-content],[data-ui-menu-content],[data-ui-hovercard-content]");
    const emit = (element, name, detail) => element.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
    const open = (trigger, panel, value) => { if (!panel) return; panel.hidden = !value; if (trigger) trigger.setAttribute("aria-expanded", String(value)); };
    function add(state, node, type, fn, options) { node.addEventListener(type, fn, options); state.listeners.push([node, type, fn, options]); return () => node.removeEventListener(type, fn, options); }
    function refreshModalInert() {
        modalInert.forEach((wasInert, node) => { node.inert = wasInert; });
        modalInert.clear();
        if (!modalStack.length) { delete document.documentElement.dataset.coreUiModalOpen; return; }
        const active = modalStack.at(-1).panel;
        let child = active;
        while (child && child !== document.body) {
            const parent = child.parentElement;
            if (!parent) break;
            Array.from(parent.children).forEach((sibling) => {
                if (sibling !== child && !modalInert.has(sibling)) { modalInert.set(sibling, sibling.inert); sibling.inert = true; }
            });
            child = parent;
        }
        document.documentElement.dataset.coreUiModalOpen = "true";
    }
    function modal(root, state) {
        const triggers = qa(root, "[data-ui-part=trigger]");
        const panels = [...new Set(triggers.map((trigger) => panelFor(trigger, root)).filter(Boolean))];
        const close = (panel, restore = true) => {
            const index = modalStack.findLastIndex((entry) => entry.panel === panel);
            const entry = index >= 0 ? modalStack.splice(index, 1)[0] : undefined;
            panel.hidden = true;
            triggers.filter((trigger) => panelFor(trigger, root) === panel).forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
            refreshModalInert();
            if (restore) (entry?.trigger || state.previous)?.focus();
        };
        const activate = (panel, trigger) => {
            const existing = modalStack.findIndex((entry) => entry.panel === panel);
            if (existing >= 0) modalStack.splice(existing, 1);
            state.previous = trigger;
            panel.hidden = false;
            trigger.setAttribute("aria-expanded", "true");
            modalStack.push({ panel, trigger });
            refreshModalInert();
            (q(panel, "[autofocus]") || q(panel, focusable) || panel).focus();
        };
        triggers.forEach((trigger) => add(state, trigger, "click", (event) => { event.preventDefault(); const panel = panelFor(trigger, root); if (panel) activate(panel, trigger); }));
        panels.forEach((panel) => {
            add(state, panel, "click", (event) => { if (event.target === panel || event.target.closest("[data-ui-close],[data-close]")) close(panel); });
            add(state, panel, "keydown", (event) => {
                if (event.key === "Escape") { event.preventDefault(); close(panel); return; }
                if (event.key !== "Tab") return;
                const nodes = qa(panel, focusable); if (!nodes.length) { event.preventDefault(); panel.focus(); return; }
                const first = nodes[0], last = nodes.at(-1);
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            });
        });
        state.cleanup.push(() => panels.forEach((panel) => close(panel, false)));
    }
    function disclosure(root, state) { parts(root, "trigger").forEach((trigger) => add(state, trigger, "click", () => { const panel = panelFor(trigger, root); open(trigger, panel, trigger.getAttribute("aria-expanded") !== "true"); })); }
    function tabs(root, state) { const tabs = qa(root, "[role=tab],[data-ui-tab],[data-ui-part=trigger]"); const select = (tab, focus) => { tabs.forEach((item) => { const selected = item === tab; item.setAttribute("aria-selected", String(selected)); item.tabIndex = selected ? 0 : -1; const panel = panelFor(item, root); if (panel) panel.hidden = !selected; }); if (focus) tab.focus(); }; tabs.forEach((tab, index) => { add(state, tab, "click", () => select(tab)); add(state, tab, "keydown", (event) => { const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0; const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : delta ? (index + delta + tabs.length) % tabs.length : null; if (next !== null) { event.preventDefault(); select(tabs[next], true); } }); }); }
    function popup(root, state, type) {
        const triggers = qa(root, "[data-ui-part=trigger],[data-ui-trigger]").filter((node, index, all) => all.indexOf(node) === index);
        const pairs = triggers.map((trigger) => ({ trigger, panel: panelFor(trigger, root) })).filter((pair) => pair.panel);
        const close = (except) => pairs.forEach((pair) => { if (pair !== except) open(pair.trigger, pair.panel, false); });
        const show = (pair, focus) => { close(pair); open(pair.trigger, pair.panel, true); if (focus) menuFocus(pair.panel, 0); };
        pairs.forEach((pair) => {
            add(state, pair.trigger, "click", (event) => { event.preventDefault(); const visible = !pair.panel.hidden; close(); open(pair.trigger, pair.panel, !visible); });
            if (type === "context-menu" || type === "menubar") {
                add(state, pair.trigger, "contextmenu", (event) => { event.preventDefault(); show(pair, true); });
                add(state, pair.trigger, "keydown", (event) => { if (event.shiftKey && event.key === "F10") { event.preventDefault(); show(pair, true); } });
            }
            if (type === "tooltip" || type === "hover-card") {
                add(state, pair.trigger, "focus", () => show(pair));
                add(state, pair.trigger, "blur", () => open(pair.trigger, pair.panel, false));
                add(state, root, "pointerenter", () => show(pair));
                add(state, root, "pointerleave", () => open(pair.trigger, pair.panel, false));
            }
            menuKeys(root, state, pair, type, show, close);
        });
        add(state, document, "pointerdown", (event) => { if (!root.contains(event.target)) close(); });
        add(state, root, "keydown", (event) => { if (event.key === "Escape") { const current = pairs.find((pair) => !pair.panel.hidden); if (current) { event.preventDefault(); close(); current.trigger.focus(); } } });
    }
    function menuItems(panel) { return qa(panel, "[role=menuitem]:not([disabled]),[role=menuitemcheckbox]:not([disabled]),[role=menuitemradio]:not([disabled]),[role=option]:not([hidden])").filter((item) => !item.hidden && !item.closest("[hidden]")); }
    function menuFocus(panel, index) { const list = menuItems(panel); if (!list.length) return; list.forEach((item, position) => { item.tabIndex = position === ((index + list.length) % list.length) ? 0 : -1; }); list[(index + list.length) % list.length].focus(); }
    function menuKeys(root, state, pair, type, show, close) {
        const { trigger, panel } = pair;
        add(state, panel, "click", (event) => { if (event.target.closest?.("[data-ui-close],[data-close]")) { close(); trigger.focus(); } });
        menuItems(panel).forEach((item, index) => { item.tabIndex = index ? -1 : 0; add(state, item, "click", () => { close(); trigger.focus(); }); });
        add(state, panel, "keydown", (event) => {
            const list = menuItems(panel), at = list.indexOf(document.activeElement);
            if (event.key === "Escape") { event.preventDefault(); close(); trigger.focus(); }
            else if (event.key === "ArrowDown") { event.preventDefault(); menuFocus(panel, at + 1); }
            else if (event.key === "ArrowUp") { event.preventDefault(); menuFocus(panel, at - 1); }
            else if (event.key === "Home") { event.preventDefault(); menuFocus(panel, 0); }
            else if (event.key === "End") { event.preventDefault(); menuFocus(panel, list.length - 1); }
            else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) { const found = list.find((item) => item.textContent.trim().toLowerCase().startsWith(event.key.toLowerCase())); if (found) { event.preventDefault(); menuFocus(panel, list.indexOf(found)); } }
        });
        add(state, trigger, "keydown", (event) => {
            if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); show(pair); menuFocus(panel, event.key === "ArrowDown" ? 0 : -1); }
            if (type === "menubar" && ["ArrowLeft", "ArrowRight"].includes(event.key)) { const pairs = qa(root, "[data-ui-part=trigger],[data-ui-trigger]").map((item) => ({ trigger: item, panel: panelFor(item, root) })).filter((item) => item.panel); const index = pairs.findIndex((item) => item.trigger === trigger); const next = pairs[(index + (event.key === "ArrowRight" ? 1 : -1) + pairs.length) % pairs.length]; event.preventDefault(); close(); next.trigger.focus(); }
        });
    }
    function choices(root, state) {
        const input = part(root, "input trigger") || q(root, "input[role=combobox]");
        if (!input || input.tagName === "SELECT") return;
        const list = part(root, "listbox list content") || q(root, "[role=listbox]");
        const allItems = () => qa(list || root, "[role=option],[data-ui-option],[data-ui-command-item]");
        const items = () => allItems().filter((item) => !item.hidden);
        allItems().forEach((item, index) => { if (!item.id) item.id = `${input.id || "core-ui-choice"}-option-${index + 1}`; });
        let active = Math.max(0, items().findIndex((item) => item.getAttribute("aria-selected") === "true"));
        const setActive = (item) => { const visible = items(); active = Math.max(0, visible.indexOf(item)); visible.forEach((entry) => entry.setAttribute("aria-selected", String(entry === item))); input.setAttribute("aria-activedescendant", item?.id || ""); };
        if (items()[active]) setActive(items()[active]);
        const select = (item) => { setActive(item); input.value = item.dataset.value || item.textContent.trim(); input.setAttribute("aria-expanded", "false"); if (list) list.hidden = true; emit(root, "core-ui:select", { value: input.value, item }); };
        allItems().forEach((item) => add(state, item, "click", () => select(item)));
        const show = () => { if (list) list.hidden = false; input.setAttribute("aria-expanded", "true"); };
        add(state, input, "focus", show);
        add(state, input, "input", () => { show(); const needle = input.value.toLowerCase(); allItems().forEach((item) => { item.hidden = !item.textContent.toLowerCase().includes(needle); }); const visible = items(), empty = part(root, "empty"); if (empty) empty.hidden = visible.length > 0; if (visible.length) setActive(visible[0]); else input.removeAttribute("aria-activedescendant"); });
        add(state, input, "keydown", (event) => { const visible = items(); if (event.key === "Escape") { if (list) list.hidden = true; input.setAttribute("aria-expanded", "false"); return; } if (!visible.length) return; if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(); setActive(visible[(active + (event.key === "ArrowDown" ? 1 : -1) + visible.length) % visible.length]); } else if (event.key === "Enter") { event.preventDefault(); select(visible[active]); } });
    }
    function calendar(root, state) {
        const days = () => qa(root, "[data-ui-calendar-day], [data-ui-part=grid] button, [data-ui-calendar] button:not([data-ui-part])").filter((day) => !day.matches("[data-ui-calendar-previous],[data-ui-calendar-next]"));
        const heading = q(root, "[data-ui-part=header] h1,[data-ui-part=header] h2,[data-ui-part=header] h3") || part(root, "month") || q(root, "[aria-live]");
        const label = (date) => date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
        const shiftMonth = (delta) => {
            days().forEach((day) => { const source = day.dataset.date || day.value || day.getAttribute("aria-label"); const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(source) ? `${source}T00:00:00` : source); if (Number.isNaN(date.valueOf())) return; date.setMonth(date.getMonth() + delta); const value = date.toISOString().slice(0, 10); day.dataset.date = value; if (day.value) day.value = value; day.textContent = String(date.getDate()); day.setAttribute("aria-label", label(date)); });
            const first = days()[0]; if (heading && first?.dataset.date) heading.textContent = new Date(`${first.dataset.date}T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
            emit(root, "core-ui:month-change", { value: first?.dataset.date, month: heading?.textContent });
        };
        const select = (day, focus) => { days().forEach((item) => { item.setAttribute("aria-selected", String(item === day)); item.tabIndex = item === day ? 0 : -1; }); if (focus) day.focus(); emit(root, "core-ui:date-change", { value: day.dataset.date || day.value || day.getAttribute("aria-label") || day.textContent.trim() }); };
        const keys = (event, day) => { const all = days(), index = all.indexOf(day); if (event.key === "PageDown" || event.key === "PageUp") { event.preventDefault(); shiftMonth((event.key === "PageDown" ? 1 : -1) * (event.shiftKey ? 12 : 1)); select(days()[event.key === "PageDown" ? days().length - 1 : 0], true); return; } const offsets = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }; const offset = event.key === "Home" ? -index : event.key === "End" ? all.length - index - 1 : offsets[event.key]; if (offset !== undefined) { event.preventDefault(); select(all[Math.max(0, Math.min(index + offset, all.length - 1))], true); } }; days().forEach((day) => { add(state, day, "click", () => select(day)); add(state, day, "keydown", (event) => keys(event, day)); }); parts(root, "previous prev").filter((button) => button.matches("[data-ui-calendar-previous]") || button.getAttribute("aria-label")?.toLowerCase().includes("previous")).forEach((button) => add(state, button, "click", () => shiftMonth(-1))); parts(root, "next").filter((button) => button.matches("[data-ui-calendar-next]") || button.getAttribute("aria-label")?.toLowerCase().includes("next")).forEach((button) => add(state, button, "click", () => shiftMonth(1))); }
    function carousel(root, state) { const track = q(root, "[data-ui-carousel-track]"); const slides = () => qa(root, "[data-ui-carousel-slide],[data-ui-part=slide]"); let index = Math.max(0, slides().findIndex((slide) => slide.getAttribute("aria-hidden") !== "true" && !slide.hidden)); const show = (next) => { const all = slides(); if (!all.length) return; index = (next + all.length) % all.length; all.forEach((slide, item) => { const inactive = item !== index; slide.hidden = !track && inactive; slide.inert = inactive; slide.setAttribute("aria-hidden", String(inactive)); }); if (track) track.style.transform = `translateX(-${index * 100}%)`; const status = part(root, "status"); if (status) status.textContent = `Slide ${index + 1} of ${all.length}`; emit(root, "core-ui:slide-change", { index }); }; parts(root, "next").forEach((button) => add(state, button, "click", () => show(index + 1))); parts(root, "previous prev").forEach((button) => add(state, button, "click", () => show(index - 1))); add(state, root, "keydown", (event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); show(index + (event.key === "ArrowRight" ? 1 : -1)); } }); show(index); }
    function otp(root, state) { const fields = qa(root, "[data-ui-part=slot], input"); fields.forEach((field, index) => { add(state, field, "input", () => { field.value = field.value.slice(-1); if (field.value) fields[index + 1]?.focus(); }); add(state, field, "keydown", (event) => { if (event.key === "Backspace" && !field.value) fields[index - 1]?.focus(); }); add(state, field, "paste", (event) => { const text = event.clipboardData?.getData("text").replace(/\s/g, "") || ""; if (!text) return; event.preventDefault(); text.slice(0, fields.length - index).split("").forEach((value, offset) => { fields[index + offset].value = value; }); fields[Math.min(index + text.length, fields.length - 1)].focus(); }); }); }
    function resizable(root, state) { const handle = part(root, "handle") || q(root, "[data-ui-resize-handle]"); const pane = parts(root, "panel pane")[0] || q(root, "[data-ui-resize-pane]"); if (!handle || !pane) return; const setWidth = (width) => { const min = Number(handle.getAttribute("aria-valuemin") || 0), max = Number(handle.getAttribute("aria-valuemax") || 100), container = root.getBoundingClientRect().width || 1; width = Math.max(container * min / 100, Math.min(container * max / 100, width)); pane.style.flexBasis = `${width}px`; const value = Math.round(width / container * 100); handle.setAttribute("aria-valuenow", String(value)); handle.setAttribute("aria-valuetext", `${value} percent`); }; add(state, handle, "pointerdown", (event) => { const startX = event.clientX, startWidth = pane.getBoundingClientRect().width; handle.setPointerCapture?.(event.pointerId); const finish = () => { removeMove(); removeUp(); removeCancel(); if (handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId); }; const removeMove = add(state, handle, "pointermove", (next) => setWidth(startWidth + next.clientX - startX)); const removeUp = add(state, handle, "pointerup", finish, { once: true }); const removeCancel = add(state, handle, "pointercancel", finish, { once: true }); }); add(state, handle, "keydown", (event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); setWidth(pane.getBoundingClientRect().width + (event.key === "ArrowLeft" ? -16 : 16)); } }); }
    function extras(root, state, component) {
        const toggles = component === "toggle" || component === "toggle-group" ? parts(root, "trigger") : qa(root, "[data-ui-toggle]"); toggles.forEach((button) => add(state, button, "click", () => { const group = component === "toggle-group" ? root : button.closest("[data-ui-toggle-group]"); const pressed = button.getAttribute("aria-pressed") !== "true"; if (group && group.dataset.multiple !== "true") qa(group, "[aria-pressed]").forEach((item) => item.setAttribute("aria-pressed", "false")); button.setAttribute("aria-pressed", String(pressed)); }));
        const sliderInputs = qa(root, "input[type=range]"); qa(root, "output[for],[data-ui-slider-output]").forEach((output) => { const input = document.getElementById(output.htmlFor) || sliderInputs[0]; if (input) { const update = () => { const maximum = input.getAttribute("max") || input.max; const text = `${input.value}${output.dataset.unit || (maximum === "100" ? "%" : "")}`; output.textContent = text; input.setAttribute("aria-valuetext", output.dataset.ariaText || (maximum === "100" ? `${input.value} percent` : text)); }; update(); add(state, input, "input", update); } }); sliderInputs.filter((input) => !qa(root, "output[for],[data-ui-slider-output]").some((output) => (document.getElementById(output.htmlFor) || sliderInputs[0]) === input)).forEach((input) => { const update = () => input.setAttribute("aria-valuetext", (input.getAttribute("max") || input.max) === "100" ? `${input.value} percent` : input.value); update(); add(state, input, "input", update); });
        if (component === "toast" || root.matches("[data-ui-toast]")) { const toast = part(root, "toast"); const trigger = part(root, "trigger"); if (toast) toast.hidden = true; if (trigger && toast) add(state, trigger, "click", () => { toast.hidden = false; }); qa(root, "[data-ui-close]").forEach((button) => add(state, button, "click", () => { const target = button.closest("[data-ui-part=toast],[data-ui-toast]") || toast; if (target) target.hidden = true; })); }
        if (component === "sidebar" || root.matches("[data-ui-sidebar]")) { const trigger = part(root, "trigger"), panel = part(root, "panel"); if (trigger && panel) { add(state, trigger, "click", () => open(trigger, panel, panel.hidden)); sidebarRoots.add(root); state.cleanup.push(() => { sidebarRoots.delete(root); if (!sidebarRoots.size && sidebarKeyListener) { document.removeEventListener("keydown", sidebarKeyListener); sidebarKeyListener = undefined; } }); if (!sidebarKeyListener) { sidebarKeyListener = (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") { const sidebar = Array.from(sidebarRoots).find((item) => item.isConnected !== false); const button = sidebar && part(sidebar, "trigger"), content = sidebar && part(sidebar, "panel"); if (button && content) { event.preventDefault(); open(button, content, content.hidden); } } }; document.addEventListener("keydown", sidebarKeyListener); } } }
        if (component === "data-table" || root.matches("[data-ui-table]")) { const table = q(root, "table") || root; qa(root, "[data-ui-part=sort], th[aria-sort]").forEach((button) => add(state, button, "click", () => { const cell = button.closest("th"); if (!cell) return; const index = Array.from(cell.parentElement.children).indexOf(cell); const ascending = cell.getAttribute("aria-sort") !== "ascending"; qa(table, "th[aria-sort]").forEach((item) => item.setAttribute("aria-sort", "none")); cell.setAttribute("aria-sort", ascending ? "ascending" : "descending"); qa(table, "tbody tr").sort((a, b) => a.children[index].textContent.localeCompare(b.children[index].textContent, undefined, { numeric: true }) * (ascending ? 1 : -1)).forEach((row) => table.tBodies[0].append(row)); })); qa(root, "[data-ui-filter],[data-ui-table-filter]").forEach((input) => add(state, input, "input", () => { const rows = qa(table, "tbody tr"); rows.forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(input.value.toLowerCase()); }); const empty = part(root, "empty"); if (empty) empty.hidden = rows.some((row) => !row.hidden); })); }
        if (component === "questionnaire" || root.matches("[data-ui-questionnaire]")) { const steps = qa(root, "[data-ui-question],[data-ui-part=step]"); let index = Math.max(0, steps.findIndex((step) => !step.hidden)); const nextButtons = qa(root, "[data-ui-question-next],[data-ui-part=next]"), previous = qa(root, "[data-ui-question-prev],[data-ui-part=previous],[data-ui-part=prev]"), submit = part(root, "submit"); const update = (next) => { index = Math.max(0, Math.min(next, steps.length - 1)); steps.forEach((step, item) => { step.hidden = item !== index; }); const final = index === steps.length - 1; nextButtons.forEach((button) => { button.hidden = final; }); previous.forEach((button) => { button.hidden = index === 0; button.disabled = index === 0; }); if (submit) submit.hidden = !final; const progress = part(root, "progress"); if (progress) progress.textContent = `Step ${index + 1} of ${steps.length}`; emit(root, "core-ui:question-change", { step: index, question: steps[index] }); }; nextButtons.forEach((button) => add(state, button, "click", (event) => { const invalid = qa(steps[index], "[required]").find((field) => !field.checkValidity()); if (invalid) { event.preventDefault(); invalid.reportValidity(); return; } update(index + 1); })); previous.forEach((button) => add(state, button, "click", () => update(index - 1))); update(index); }
        if (component === "message-scroller" || root.matches("[data-ui-message-scroller]")) { const list = part(root, "list") || root, jump = q(root, "[data-ui-jump]") || part(root, "jump"); let follow = list.scrollHeight - list.scrollTop - list.clientHeight < 24; const sync = () => { follow = list.scrollHeight - list.scrollTop - list.clientHeight < 24; if (jump) jump.hidden = follow; }; add(state, list, "scroll", sync); if (jump) add(state, jump, "click", () => { list.scrollTop = list.scrollHeight; sync(); }); const observer = new MutationObserver(() => { if (follow) list.scrollTop = list.scrollHeight; sync(); }); observer.observe(list, { childList: true, subtree: true }); state.observer = observer; if (jump) jump.hidden = follow; }
    }
    function enhance(root = document) { const all = []; if (root.matches?.(selector)) all.push(root); all.push(...qa(root, selector)); all.forEach((element) => { if (instances.has(element)) return; const state = { listeners: [], cleanup: [] }; instances.set(element, state); const component = element.dataset.uiComponent || ""; if (/^(accordion|collapsible)$/.test(component) || element.matches("[data-ui-disclosure]")) disclosure(element, state); if (component === "tabs" || element.matches("[data-ui-tabs]")) tabs(element, state); if (/^(dialog|alert-dialog|sheet|drawer)$/.test(component) || element.matches("[data-ui-dialog],[data-ui-alert-dialog],[data-ui-sheet],[data-ui-drawer]")) modal(element, state); if (/^(popover|dropdown-menu|context-menu|menubar|navigation-menu|hover-card|tooltip|date-picker)$/.test(component) || element.matches("[data-ui-popover],[data-ui-menu],[data-ui-hovercard],[data-ui-navigation-menu]")) popup(element, state, component); if (/^(combobox|select|command)$/.test(component) || element.matches("[data-ui-combobox],[data-ui-select],[data-ui-command]")) choices(element, state); if (component === "calendar" || element.matches("[data-ui-calendar]")) calendar(element, state); if (component === "carousel" || element.matches("[data-ui-carousel]")) carousel(element, state); if (component === "input-otp" || element.matches("[data-ui-otp]")) otp(element, state); if (component === "resizable" || element.matches("[data-ui-resizable]")) resizable(element, state); extras(element, state, component); }); return root; }
    function destroy(root = document) { const all = []; if (root.matches?.(selector)) all.push(root); all.push(...qa(root, selector)); all.forEach((element) => { const state = instances.get(element); if (!state) return; state.listeners.forEach(([node, type, fn, options]) => node.removeEventListener(type, fn, options)); state.observer?.disconnect(); state.cleanup.forEach((cleanup) => cleanup()); instances.delete(element); }); return root; }
    window.CoreUI = Object.assign(window.CoreUI || {}, { enhance, destroy });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => enhance()); else enhance();
}());

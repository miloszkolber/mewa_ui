/* mewa_ui optional progressive enhancement. Generic data-ui-part hooks remain compatible with specialised hooks. */
(function () {
    "use strict";
    const instances = new WeakMap();
    const selector = "[data-ui-component],[data-ui-disclosure],[data-ui-tabs],[data-ui-dialog],[data-ui-alert-dialog],[data-ui-sheet],[data-ui-drawer],[data-ui-popover],[data-ui-menu],[data-ui-combobox],[data-ui-select],[data-ui-command],[data-ui-calendar],[data-ui-carousel],[data-ui-resizable],[data-ui-navbar-vertical],[data-ui-toggle],[data-ui-button-group],[data-ui-toast],[data-ui-toast-viewport],[data-ui-questionnaire],[data-ui-message-scroller],[data-ui-table]";
    const focusable = "a[href],button,input,select,textarea,[contenteditable],[tabindex]";
    const modalStack = [];
    const modalInert = new Map();
    const q = (root, value) => root.querySelector(value);
    const qa = (root, value) => Array.from(root.querySelectorAll(value));
    const part = (root, names) => q(root, names.split(" ").map((name) => `[data-ui-part="${name}"]`).join(","));
    const parts = (root, names) => qa(root, names.split(" ").map((name) => `[data-ui-part="${name}"]`).join(","));
    const panelFor = (trigger, root) => document.getElementById(trigger?.getAttribute("aria-controls") || trigger?.dataset.uiDialogTarget || trigger?.dataset.uiTarget || "") || part(root, "panel dialog menu listbox content") || q(root, "[data-ui-content],[data-ui-popover-content],[data-ui-menu-content]");
    const emit = (element, name, detail) => element.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
    const optionDisabled = (item) => !item || item.disabled || item.getAttribute("disabled") !== null || item.getAttribute("aria-disabled") === "true";
    const visibleFocusable = (root) => qa(root, focusable).filter((item) => item.tabIndex >= 0 && !optionDisabled(item) && !item.hidden && !item.closest("[hidden]") && item.getAttribute("aria-hidden") !== "true" && item.inert !== true);
    const open = (trigger, panel, value) => { if (!panel) return; panel.hidden = !value; if (trigger) trigger.setAttribute("aria-expanded", String(value)); };
    const nativeDialog = (panel) => panel?.matches?.("dialog") === true;
    const showModalPanel = (panel) => {
        if (!panel) return;
        panel.hidden = false;
        if (!nativeDialog(panel) || panel.open) return;
        if (typeof panel.showModal === "function") panel.showModal();
        else panel.setAttribute("open", "");
    };
    const hideModalPanel = (panel) => {
        if (!panel) return;
        if (!nativeDialog(panel)) { panel.hidden = true; return; }
        if (panel.open && typeof panel.close === "function") panel.close();
        else panel.removeAttribute("open");
    };
    function add(state, node, type, fn, options) { node.addEventListener(type, fn, options); state.listeners.push([node, type, fn, options]); return () => node.removeEventListener(type, fn, options); }
    function refreshModalInert() {
        modalInert.forEach((wasInert, node) => { node.inert = wasInert; });
        modalInert.clear();
        if (!modalStack.length) { delete document.documentElement.dataset.mewaUiModalOpen; return; }
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
        document.documentElement.dataset.mewaUiModalOpen = "true";
    }
    function modal(root, state) {
        const triggers = qa(root, "[data-ui-part=trigger]");
        const panels = [...new Set(triggers.map((trigger) => panelFor(trigger, root)).filter(Boolean))];
        const close = (panel, restore = true) => {
            const index = modalStack.findLastIndex((entry) => entry.panel === panel);
            const entry = index >= 0 ? modalStack.splice(index, 1)[0] : undefined;
            hideModalPanel(panel);
            if (entry) emit(root, "mewa-ui:modal-close", { panel });
            triggers.filter((trigger) => panelFor(trigger, root) === panel).forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
            refreshModalInert();
            if (restore) (entry?.trigger || state.previous)?.focus();
        };
        const activate = (panel, trigger) => {
            const existing = modalStack.findIndex((entry) => entry.panel === panel);
            if (existing >= 0) modalStack.splice(existing, 1);
            state.previous = trigger;
            showModalPanel(panel);
            emit(root, "mewa-ui:modal-open", { panel });
            trigger.setAttribute("aria-expanded", "true");
            modalStack.push({ panel, trigger });
            refreshModalInert();
            (q(panel, "[autofocus]") || visibleFocusable(panel)[0] || panel).focus();
        };
        triggers.forEach((trigger) => add(state, trigger, "click", (event) => { event.preventDefault(); const panel = panelFor(trigger, root); if (panel) activate(panel, trigger); }));
        panels.forEach((panel) => {
            add(state, panel, "click", (event) => { if (event.target === panel || event.target.closest("[data-ui-close],[data-close]")) close(panel); });
            if (nativeDialog(panel)) add(state, panel, "cancel", (event) => { event.preventDefault(); close(panel); });
            qa(panel, "form[data-ui-dialog-form]").forEach((form) => add(state, form, "submit", (event) => { if (!form.checkValidity()) return; event.preventDefault(); emit(root, "mewa-ui:dialog-submit", { form }); close(panel); }));
            add(state, panel, "keydown", (event) => {
                if (event.key === "Escape") { event.preventDefault(); close(panel); return; }
                if (event.key !== "Tab") return;
                const nodes = visibleFocusable(panel); if (!nodes.length) { event.preventDefault(); panel.focus(); return; }
                const first = nodes[0], last = nodes.at(-1);
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            });
        });
        state.cleanup.push(() => panels.forEach((panel) => close(panel, false)));
    }
    function disclosure(root, state) { parts(root, "trigger").forEach((trigger) => add(state, trigger, "click", () => { const panel = panelFor(trigger, root); open(trigger, panel, trigger.getAttribute("aria-expanded") !== "true"); })); }
    function tabs(root, state) { const tabs = qa(root, "[role=tab],[data-ui-tab],[data-ui-part=trigger]"), enabled = () => tabs.filter((tab) => !optionDisabled(tab)); const select = (tab, focus) => { if (optionDisabled(tab)) return; tabs.forEach((item) => { const selected = item === tab; item.setAttribute("aria-selected", String(selected)); item.tabIndex = selected ? 0 : -1; const panel = panelFor(item, root); if (panel) panel.hidden = !selected; }); if (focus) tab.focus(); }; tabs.forEach((tab) => { if (optionDisabled(tab)) tab.tabIndex = -1; add(state, tab, "click", () => select(tab)); add(state, tab, "keydown", (event) => { const available = enabled(), index = available.indexOf(tab), delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0; const next = event.key === "Home" ? available[0] : event.key === "End" ? available.at(-1) : delta && index >= 0 ? available[(index + delta + available.length) % available.length] : null; if (next) { event.preventDefault(); select(next, true); } }); }); }
    function popup(root, state, type) {
        const triggers = qa(root, "[data-ui-part=trigger],[data-ui-trigger]").filter((node, index, all) => all.indexOf(node) === index);
        const pairs = triggers.map((trigger) => ({ trigger, panel: panelFor(trigger, root) })).filter((pair) => pair.panel);
        const close = (except) => pairs.forEach((pair) => { if (pair !== except) { open(pair.trigger, pair.panel, false); delete pair.panel.dataset.uiPositioned; pair.panel.style.position = ""; pair.panel.style.left = ""; pair.panel.style.top = ""; } });
        const position = (pair, point) => {
            const panel = pair.panel, anchor = pair.trigger.getBoundingClientRect?.() || {}, rect = panel.getBoundingClientRect?.() || {};
            const viewWidth = window.innerWidth || document.documentElement.clientWidth || 0, viewHeight = window.innerHeight || document.documentElement.clientHeight || 0;
            const gap = 8, side = panel.dataset.side || pair.trigger.dataset.side || "bottom", align = panel.dataset.align || pair.trigger.dataset.align || "start";
            let left = point ? point.x : anchor.left || 0, top = point ? point.y : (anchor.bottom ?? ((anchor.top || 0) + (anchor.height || 0)));
            const width = rect.width || panel.offsetWidth || 0, height = rect.height || panel.offsetHeight || 0;
            if (!point) {
                if (side === "top") top = (anchor.top || 0) - height - gap;
                else if (side === "left") { left = (anchor.left || 0) - width - gap; top = anchor.top || 0; }
                else if (side === "right") { left = (anchor.right ?? ((anchor.left || 0) + (anchor.width || 0))) + gap; top = anchor.top || 0; }
                else top += gap;
                if (align === "center") { if (["top", "bottom"].includes(side)) left = (anchor.left || 0) + ((anchor.width || 0) - width) / 2; else top = (anchor.top || 0) + ((anchor.height || 0) - height) / 2; }
                if (align === "end") { if (["top", "bottom"].includes(side)) left = (anchor.right ?? ((anchor.left || 0) + (anchor.width || 0))) - width; else top = (anchor.bottom ?? ((anchor.top || 0) + (anchor.height || 0))) - height; }
                if (viewHeight && side === "bottom" && top + height > viewHeight && (anchor.top || 0) >= height + gap) top = (anchor.top || 0) - height - gap;
                if (viewHeight && side === "top" && top < 0) top = (anchor.bottom ?? ((anchor.top || 0) + (anchor.height || 0))) + gap;
                if (viewWidth && side === "right" && left + width > viewWidth && (anchor.left || 0) >= width + gap) left = (anchor.left || 0) - width - gap;
                if (viewWidth && side === "left" && left < 0) left = (anchor.right ?? ((anchor.left || 0) + (anchor.width || 0))) + gap;
            }
            panel.dataset.side = side; panel.dataset.align = align;
            panel.dataset.uiPositioned = "true"; panel.style.position = "fixed"; panel.style.left = `${Math.max(gap, Math.min(left, Math.max(gap, viewWidth - width - gap)))}px`; panel.style.top = `${Math.max(gap, Math.min(top, Math.max(gap, viewHeight - height - gap)))}px`;
        };
        const refresh = () => pairs.filter((pair) => !pair.panel.hidden).forEach((pair) => position(pair));
        const show = (pair, focus, point) => { close(pair); open(pair.trigger, pair.panel, true); position(pair, point); if (focus) menuFocus(pair.panel, 0); };
        pairs.forEach((pair) => {
            if (type !== "tooltip") add(state, pair.trigger, "click", (event) => { event.preventDefault(); const visible = !pair.panel.hidden; close(); if (!visible) show(pair); });
            if (type === "tooltip") {
                const containsPair = (target) => pair.trigger.contains(target) || pair.panel.contains(target);
                const leave = (event) => { if (!containsPair(event.relatedTarget)) open(pair.trigger, pair.panel, false); };
                add(state, pair.trigger, "focus", () => show(pair));
                add(state, pair.trigger, "blur", leave);
                add(state, pair.panel, "focusout", leave);
                add(state, pair.trigger, "pointerenter", () => show(pair));
                add(state, pair.trigger, "pointerleave", leave);
                add(state, pair.panel, "pointerenter", () => show(pair));
                add(state, pair.panel, "pointerleave", leave);
            }
            menuKeys(root, state, pair, type, show, close);
        });
        add(state, document, "pointerdown", (event) => { if (!root.contains(event.target)) close(); });
        add(state, window, "resize", refresh); add(state, window, "scroll", refresh, true);
        add(state, root, "keydown", (event) => { if (event.key === "Escape") { const current = pairs.find((pair) => !pair.panel.hidden); if (current) { event.preventDefault(); close(); current.trigger.focus(); } } });
        state.cleanup.push(() => close());
    }
    function menuItems(panel) { return qa(panel, "[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=option]").filter((item) => !item.hidden && !item.closest("[hidden]") && !optionDisabled(item)); }
    function menuFocus(panel, index) { const list = menuItems(panel); if (!list.length) return; list.forEach((item, position) => { item.tabIndex = position === ((index + list.length) % list.length) ? 0 : -1; }); list[(index + list.length) % list.length].focus(); }
    function menuKeys(root, state, pair, type, show, close) {
        const { trigger, panel } = pair;
        let typeahead = "", typeaheadTimer;
        add(state, panel, "click", (event) => { if (event.target.closest?.("[data-ui-close],[data-close]")) { close(); trigger.focus(); } });
        menuItems(panel).forEach((item, index) => { item.tabIndex = index ? -1 : 0; add(state, item, "click", () => { if (optionDisabled(item)) return; if (item.getAttribute("role") === "menuitemcheckbox") item.setAttribute("aria-checked", String(item.getAttribute("aria-checked") !== "true")); if (item.getAttribute("role") === "menuitemradio") { qa(panel, "[role=menuitemradio]").filter((radio) => !optionDisabled(radio) && (radio.dataset.uiGroup || radio.getAttribute("name") || "") === (item.dataset.uiGroup || item.getAttribute("name") || "")).forEach((radio) => radio.setAttribute("aria-checked", String(radio === item))); } close(); trigger.focus(); }); });
        add(state, panel, "keydown", (event) => {
            const list = menuItems(panel), at = list.indexOf(document.activeElement);
            if (event.key === "Escape") { event.preventDefault(); close(); trigger.focus(); }
            else if (event.key === "ArrowDown") { event.preventDefault(); menuFocus(panel, at + 1); }
            else if (event.key === "ArrowUp") { event.preventDefault(); menuFocus(panel, at - 1); }
            else if (event.key === "Home") { event.preventDefault(); menuFocus(panel, 0); }
            else if (event.key === "End") { event.preventDefault(); menuFocus(panel, list.length - 1); }
            else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
                typeahead += event.key.toLowerCase();
                clearTimeout(typeaheadTimer);
                typeaheadTimer = setTimeout(() => { typeahead = ""; }, 500);
                const ordered = list.slice(at + 1).concat(list.slice(0, at + 1));
                let found = ordered.find((item) => item.textContent.trim().toLowerCase().startsWith(typeahead));
                if (!found && typeahead.length > 1) { typeahead = event.key.toLowerCase(); found = ordered.find((item) => item.textContent.trim().toLowerCase().startsWith(typeahead)); }
                if (found) { event.preventDefault(); menuFocus(panel, list.indexOf(found)); }
            }
        });
        add(state, trigger, "keydown", (event) => {
            if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); show(pair); menuFocus(panel, event.key === "ArrowDown" ? 0 : -1); }
        });
        state.cleanup.push(() => clearTimeout(typeaheadTimer));
    }

    function autocomplete(root, state) {
        const input = part(root, "input") || q(root, "input[role=combobox]");
        const list = part(root, "listbox") || q(root, "[role=listbox]");
        const empty = part(root, "empty");
        if (!input || !list) return;
        const allItems = () => qa(list, "[role=option]");
        const items = () => allItems().filter((item) => !item.hidden && !optionDisabled(item));
        const value = (item) => item?.dataset.value || item?.textContent.trim() || "";
        let active;
        allItems().forEach((item, index) => { if (!item.id) item.id = `${input.id || "mewa-ui-autocomplete"}-option-${index + 1}`; });
        const setActive = (item) => { active = item; allItems().forEach((entry) => { if (entry === item) entry.dataset.uiActive = "true"; else delete entry.dataset.uiActive; }); if (item) input.setAttribute("aria-activedescendant", item.id); else input.removeAttribute("aria-activedescendant"); };
        const show = () => { list.hidden = false; input.setAttribute("aria-expanded", "true"); };
        const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); setActive(undefined); };
        const filter = () => { const needle = input.value.trim().toLowerCase(); allItems().forEach((item) => { item.hidden = optionDisabled(item) || !item.textContent.toLowerCase().includes(needle); }); const visible = items(); if (empty) empty.hidden = visible.length > 0; setActive(visible[0]); };
        const commit = (item) => { if (!item) return; input.value = value(item); allItems().forEach((entry) => entry.setAttribute("aria-selected", String(entry === item))); close(); emit(root, "mewa-ui:autocomplete-select", { value: input.value, item }); };
        allItems().forEach((item) => add(state, item, "click", () => commit(item)));
        add(state, input, "focus", () => { filter(); show(); });
        add(state, input, "input", () => { filter(); show(); });
        add(state, input, "keydown", (event) => {
            const visible = items();
            if (event.key === "Escape" && !list.hidden) { event.preventDefault(); close(); return; }
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) && visible.length) { event.preventDefault(); show(); const index = visible.indexOf(active); setActive(event.key === "Home" ? visible[0] : event.key === "End" ? visible.at(-1) : visible[(index + (event.key === "ArrowDown" ? 1 : -1) + visible.length) % visible.length]); }
            else if (event.key === "Enter" && active) { event.preventDefault(); commit(active); }
        });
        add(state, document, "pointerdown", (event) => { if (!root.contains(event.target)) close(); });
        add(state, root, "focusout", (event) => { if (!root.contains(event.relatedTarget)) close(); });
    }

    function checkboxGroup(root, state) {
        const master = part(root, "all");
        const items = parts(root, "item");
        const status = part(root, "status");
        if (!master || !items.length) return;
        const notify = () => emit(root, "mewa-ui:checkbox-group-change", { values: items.filter((item) => item.checked).map((item) => item.value) });
        const sync = () => {
            const enabled = items.filter((item) => !item.disabled);
            const selected = enabled.filter((item) => item.checked).length;
            master.checked = selected === enabled.length && enabled.length > 0;
            master.indeterminate = selected > 0 && selected < enabled.length;
            master.setAttribute("aria-checked", master.indeterminate ? "mixed" : String(master.checked));
            if (status) status.textContent = `${selected} of ${enabled.length} channels selected.`;
        };
        add(state, master, "change", () => { items.filter((item) => !item.disabled).forEach((item) => { item.checked = master.checked; }); sync(); notify(); });
        items.forEach((item) => add(state, item, "change", () => { sync(); notify(); }));
        sync();
    }

    function lightbox(root, state) {
        const triggers = parts(root, "trigger");
        const panel = part(root, "panel");
        const slides = parts(root, "slide");
        const previous = part(root, "previous");
        const next = part(root, "next");
        const status = part(root, "status");
        if (!panel || !slides.length) return;
        let index = 0;
        const show = (nextIndex) => { index = (nextIndex + slides.length) % slides.length; slides.forEach((slide, position) => { slide.hidden = position !== index; }); if (status) status.textContent = `Image ${index + 1} of ${slides.length}.`; emit(root, "mewa-ui:lightbox-change", { index }); };
        triggers.forEach((trigger) => add(state, trigger, "click", () => show(Number(trigger.dataset.uiSlide) || 0)));
        if (previous) add(state, previous, "click", () => show(index - 1));
        if (next) add(state, next, "click", () => show(index + 1));
        add(state, panel, "keydown", (event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); show(index + (event.key === "ArrowRight" ? 1 : -1)); } });
        show(0);
    }

    function sortableList(root, state) {
        const list = part(root, "list") || q(root, "ol,ul");
        const status = part(root, "status");
        if (!list) return;
        const items = () => parts(root, "item");
        const label = (item) => part(item, "handle")?.getAttribute("aria-label")?.replace(/^Reorder\s+/i, "") || item.textContent.trim();
        const announce = (item, prefix = "Moved") => { const position = items().indexOf(item) + 1; if (status) status.textContent = `${prefix} ${label(item)} to position ${position} of ${items().length}.`; };
        const move = (item, direction) => { const current = items(), index = current.indexOf(item), target = Math.max(0, Math.min(current.length - 1, index + direction)); if (target === index) return; const reference = direction > 0 ? current[target + 1] || null : current[target]; list.insertBefore(item, reference); announce(item); part(item, "handle")?.focus(); emit(root, "mewa-ui:sort-change", { order: items().map(label) }); };
        let dragged, dragOrigin, dropped = false;
        items().forEach((item) => {
            const handle = part(item, "handle");
            if (handle) add(state, handle, "keydown", (event) => { const grabbed = handle.getAttribute("aria-pressed") === "true"; if (event.key === " " || event.key === "Enter") { event.preventDefault(); handle.setAttribute("aria-pressed", String(!grabbed)); if (status) status.textContent = `${!grabbed ? "Lifted" : "Dropped"} ${label(item)}. ${!grabbed ? "Use Up or Down to move it." : ""}`.trim(); } else if (grabbed && (event.key === "ArrowUp" || event.key === "ArrowDown")) { event.preventDefault(); move(item, event.key === "ArrowDown" ? 1 : -1); } else if (grabbed && event.key === "Escape") { event.preventDefault(); handle.setAttribute("aria-pressed", "false"); if (status) status.textContent = `Dropped ${label(item)}.`; } });
            add(state, item, "dragstart", (event) => { dragged = item; dragOrigin = items(); dropped = false; item.dataset.uiDragging = "true"; if (event.dataTransfer) event.dataTransfer.effectAllowed = "move"; });
            add(state, item, "dragover", (event) => { if (!dragged || dragged === item) return; event.preventDefault(); const current = items(), from = current.indexOf(dragged), to = current.indexOf(item); list.insertBefore(dragged, from < to ? current[to + 1] || null : item); });
            add(state, item, "drop", (event) => { event.preventDefault(); if (dragged) { dropped = true; announce(dragged); emit(root, "mewa-ui:sort-change", { order: items().map(label) }); } });
            add(state, item, "dragend", () => { if (dragged) delete dragged.dataset.uiDragging; if (!dropped && dragOrigin) dragOrigin.forEach((entry) => list.append(entry)); dragged = undefined; dragOrigin = undefined; dropped = false; });
        });
    }

    function timeField(root, state) {
        const hour = part(root, "hour"), minute = part(root, "minute"), period = part(root, "period"), value = part(root, "value"), status = part(root, "status");
        if (!hour || !minute || !period) return;
        const numeric = (field, fallback) => { const parsed = Number(String(field.value || "").replace(/\D/g, "")); return Number.isFinite(parsed) ? parsed : fallback; };
        const sync = () => { const hourValue = Math.max(1, Math.min(12, numeric(hour, 12))), minuteValue = Math.max(0, Math.min(59, numeric(minute, 0))), offset = period.value === "PM" ? 12 : 0, hour24 = (hourValue % 12) + offset, serialized = `${String(hour24).padStart(2, "0")}:${String(minuteValue).padStart(2, "0")}`; if (value) value.value = serialized; if (status) status.textContent = `${String(hourValue).padStart(2, "0")}:${String(minuteValue).padStart(2, "0")} ${period.value || "AM"}`; emit(root, "mewa-ui:time-change", { value: serialized }); };
        const normalize = (field, minimum, maximum) => { const next = Math.max(minimum, Math.min(maximum, numeric(field, minimum))); field.value = String(next).padStart(2, "0"); sync(); };
        const step = (field, minimum, maximum, amount) => { const current = numeric(field, minimum), range = maximum - minimum + 1, next = ((current - minimum + amount) % range + range) % range + minimum; field.value = String(next).padStart(2, "0"); sync(); };
        [[hour, 1, 12], [minute, 0, 59]].forEach(([field, minimum, maximum], index) => { add(state, field, "input", () => { field.value = field.value.replace(/\D/g, "").slice(0, 2); if (index === 0 && field.value.length === 2) minute.focus(); sync(); }); add(state, field, "blur", () => normalize(field, minimum, maximum)); add(state, field, "keydown", (event) => { if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); step(field, minimum, maximum, event.key === "ArrowUp" ? 1 : -1); } }); });
        add(state, period, "change", sync);
        normalize(hour, 1, 12); normalize(minute, 0, 59); sync();
    }
    function customSelect(root, state) {
        const trigger = part(root, "trigger"), input = q(root, "input[type=hidden]") || part(root, "input"), list = part(root, "listbox list content") || q(root, "[role=listbox]");
        if (!trigger || !list) return;
        const allItems = () => qa(list, "[role=option],[data-ui-option]");
        const items = () => allItems().filter((item) => !item.hidden && !optionDisabled(item));
        const value = (item) => item?.dataset.value || item?.textContent.trim() || "";
        allItems().forEach((item, index) => { if (!item.id) item.id = `${trigger.id || "mewa-ui-select"}-option-${index + 1}`; });
        let committed = allItems().find((item) => item.getAttribute("aria-selected") === "true") || items()[0];
        let active = committed;
        let typeahead = "", typeaheadTimer;
        const setActive = (item) => { active = item; allItems().forEach((entry) => { if (entry === item) entry.dataset.uiActive = "true"; else delete entry.dataset.uiActive; }); if (item) trigger.setAttribute("aria-activedescendant", item.id); else trigger.removeAttribute("aria-activedescendant"); };
        const setCommitted = (item, notify) => {
            if (!item || optionDisabled(item)) return;
            committed = item;
            allItems().forEach((entry) => entry.setAttribute("aria-selected", String(entry === item)));
            if (input) input.value = value(item);
            const label = part(root, "value"); if (label) label.textContent = item.textContent.trim();
            setActive(item);
            if (notify) emit(root, "mewa-ui:select", { value: value(item), item });
        };
        const close = (restoreFocus) => { list.hidden = true; trigger.setAttribute("aria-expanded", "false"); setActive(committed); if (restoreFocus) trigger.focus(); };
        const show = () => { list.hidden = false; trigger.setAttribute("aria-expanded", "true"); setActive(active || committed || items()[0]); };
        const move = (next) => { const visible = items(); if (!visible.length) return; const index = visible.indexOf(active); setActive(visible[(index + next + visible.length) % visible.length]); };
        setCommitted(committed, false);
        allItems().forEach((item) => add(state, item, "click", () => { if (!optionDisabled(item)) { setCommitted(item, true); close(true); } }));
        add(state, trigger, "click", () => { if (list.hidden) show(); else close(false); });
        add(state, trigger, "keydown", (event) => {
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) { event.preventDefault(); show(); if (event.key === "Home") setActive(items()[0]); else if (event.key === "End") setActive(items().at(-1)); else move(event.key === "ArrowDown" ? 1 : -1); }
            else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (list.hidden) show(); else { setCommitted(active, true); close(true); } }
            else if (event.key === "Escape" && !list.hidden) { event.preventDefault(); close(true); }
            else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) { typeahead += event.key.toLowerCase(); clearTimeout(typeaheadTimer); typeaheadTimer = setTimeout(() => { typeahead = ""; }, 500); const found = items().find((item) => item.textContent.trim().toLowerCase().startsWith(typeahead)); if (found) { event.preventDefault(); show(); setActive(found); } }
        });
        add(state, document, "pointerdown", (event) => { if (!root.contains(event.target) && !list.hidden) close(false); });
        state.cleanup.push(() => clearTimeout(typeaheadTimer));
    }
    function choices(root, state) {
        if (root.dataset.uiComponent === "select") { customSelect(root, state); return; }
        const input = part(root, "input trigger") || q(root, "input[role=combobox]");
        const submittedValue = q(root, "input[type=hidden]");
        if (!input || input.tagName === "SELECT") return;
        const list = part(root, "listbox list content") || q(root, "[role=listbox]");
        const allItems = () => qa(list || root, "[role=option],[data-ui-option],[data-ui-command-item]");
        const items = () => allItems().filter((item) => !item.hidden && !optionDisabled(item));
        const value = (item) => item?.dataset.value || item?.textContent.trim() || "";
        allItems().forEach((item, index) => { if (!item.id) item.id = `${input.id || "mewa-ui-choice"}-option-${index + 1}`; });
        let committed = allItems().find((item) => item.getAttribute("aria-selected") === "true");
        let active = committed || items()[0];
        const setActive = (item) => { active = item; allItems().forEach((entry) => { if (entry === item) entry.dataset.uiActive = "true"; else delete entry.dataset.uiActive; }); if (item) input.setAttribute("aria-activedescendant", item.id); else input.removeAttribute("aria-activedescendant"); };
        const setCommitted = (item) => { if (!item || optionDisabled(item)) return; committed = item; allItems().forEach((entry) => entry.setAttribute("aria-selected", String(entry === item))); input.value = value(item); if (submittedValue) submittedValue.value = input.value; setActive(item); input.setAttribute("aria-expanded", "false"); if (list) list.hidden = true; emit(root, "mewa-ui:select", { value: input.value, item }); };
        const show = () => { if (list) list.hidden = false; input.setAttribute("aria-expanded", "true"); };
        const close = (restore = true) => { if (restore) { if (committed && input.value !== value(committed)) input.value = value(committed); if (submittedValue) submittedValue.value = value(committed); allItems().forEach((item) => { item.hidden = false; }); const empty = part(root, "empty"); if (empty) empty.hidden = true; setActive(committed); } if (list) list.hidden = true; input.setAttribute("aria-expanded", "false"); };
        const filter = (needle) => { allItems().forEach((item) => { item.hidden = optionDisabled(item) || !item.textContent.toLowerCase().includes(needle); }); const visible = items(), empty = part(root, "empty"); if (empty) empty.hidden = visible.length > 0; setActive(visible[0]); };
        setActive(active);
        allItems().forEach((item) => add(state, item, "click", () => setCommitted(item)));
        add(state, input, "focus", show);
        add(state, input, "input", () => { if (submittedValue && input.value !== value(committed)) submittedValue.value = ""; show(); filter(input.value.toLowerCase()); });
        add(state, input, "keydown", (event) => { const visible = items(); if (event.key === "Escape" && input.getAttribute("aria-expanded") === "true") { event.preventDefault(); close(); return; } if (!visible.length) return; if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) { event.preventDefault(); show(); const index = visible.indexOf(active); setActive(event.key === "Home" ? visible[0] : event.key === "End" ? visible.at(-1) : visible[(index + (event.key === "ArrowDown" ? 1 : -1) + visible.length) % visible.length]); } else if (event.key === "Enter") { event.preventDefault(); setCommitted(active); } });
        add(state, document, "pointerdown", (event) => { if (!root.contains(event.target)) close(); });
        add(state, root, "focusout", (event) => { if (!root.contains(event.relatedTarget)) close(); });
    }
    function calendar(root, state) {
        const parse = (value) => { const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!match) return null; const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])); return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null; };
        const iso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const addDays = (date, amount) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
        const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
        const heading = q(root, "[data-ui-part=header] h1,[data-ui-part=header] h2,[data-ui-part=header] h3") || part(root, "month") || q(root, "[aria-live]");
        const grid = q(root, "[data-ui-calendar-grid],[data-ui-part=grid]");
        const today = iso(new Date());
        const selectedButton = q(root, "[data-ui-calendar-day][aria-selected=true]");
        const firstButton = q(root, "[data-ui-calendar-day]");
        const selected = parse(root.dataset.uiValue || root.dataset.value || selectedButton?.dataset.date);
        const configuredMonth = String(root.dataset.uiMonth || "").match(/^(\d{4})-(\d{2})$/);
        const initial = selected || parse(firstButton?.dataset.date) || new Date();
        const viewed = configuredMonth ? new Date(Number(configuredMonth[1]), Number(configuredMonth[2]) - 1, 1) : new Date(initial.getFullYear(), initial.getMonth(), 1);
        const disabledDates = new Set(String(root.dataset.uiDisabledDates || "").split(",").map((value) => value.trim()).filter(Boolean));
        const minimum = parse(root.dataset.uiMin), maximum = parse(root.dataset.uiMax);
        const isDisabled = (date) => disabledDates.has(iso(date)) || Boolean(minimum && date < minimum) || Boolean(maximum && date > maximum);
        const dateLabel = (date) => date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        const monthLabel = (date) => date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
        const days = () => qa(root, "[data-ui-calendar-day]");
        const nearestEnabled = (date, amount = 1) => { const next = new Date(date); for (let attempts = 0; attempts < 3660; attempts++, next.setDate(next.getDate() + amount)) if (!isDisabled(next)) return new Date(next); return null; };
        const active = selected && !isDisabled(selected) ? selected : nearestEnabled(new Date(viewed.getFullYear(), viewed.getMonth(), 1));
        const stateful = { view: viewed, selected: selected && !isDisabled(selected) ? selected : null, active: active || new Date(viewed.getFullYear(), viewed.getMonth(), 1) };
        const syncRoot = () => { root.dataset.uiMonth = `${stateful.view.getFullYear()}-${String(stateful.view.getMonth() + 1).padStart(2, "0")}`; if (stateful.selected) root.dataset.uiValue = iso(stateful.selected); else delete root.dataset.uiValue; };
        const focus = (date, amount = 1) => { const target = isDisabled(date) ? nearestEnabled(date, amount) : date; if (!target) return; stateful.active = target; if (target.getFullYear() !== stateful.view.getFullYear() || target.getMonth() !== stateful.view.getMonth()) stateful.view = new Date(target.getFullYear(), target.getMonth(), 1); render(); q(root, `[data-ui-calendar-day][data-date="${iso(target)}"]`)?.focus(); };
        const select = (date, shouldFocus) => { if (!date || isDisabled(date)) return; stateful.selected = date; stateful.active = date; if (date.getFullYear() !== stateful.view.getFullYear() || date.getMonth() !== stateful.view.getMonth()) stateful.view = new Date(date.getFullYear(), date.getMonth(), 1); render(); const button = q(root, `[data-ui-calendar-day][data-date="${iso(date)}"]`); if (shouldFocus) button?.focus(); emit(root, "mewa-ui:date-change", { value: iso(date), date }); };
        const render = () => {
            syncRoot();
            if (heading) heading.textContent = monthLabel(stateful.view);
            if (!grid || !document.createElement) {
                days().forEach((button) => { const date = parse(button.dataset.date); if (!date) return; const replacement = new Date(stateful.view.getFullYear(), stateful.view.getMonth(), date.getDate()); button.dataset.date = iso(replacement); button.textContent = String(replacement.getDate()); button.setAttribute("aria-label", dateLabel(replacement)); });
                return;
            }
            const body = q(grid, "tbody"); if (!body) return;
            const first = new Date(stateful.view.getFullYear(), stateful.view.getMonth(), 1);
            const start = addDays(first, -first.getDay());
            const fragment = document.createDocumentFragment ? document.createDocumentFragment() : null;
            const target = fragment || body;
            for (let week = 0; week < 6; week++) {
                const row = document.createElement("tr");
                for (let day = 0; day < 7; day++) {
                    const date = addDays(start, week * 7 + day), value = iso(date), button = document.createElement("button"), cell = document.createElement("td");
                    const outside = date.getMonth() !== stateful.view.getMonth();
                    button.type = "button"; button.dataset.uiCalendarDay = ""; button.dataset.date = value; button.textContent = String(date.getDate()); button.setAttribute("aria-label", dateLabel(date)); button.setAttribute("aria-selected", String(Boolean(stateful.selected && iso(stateful.selected) === value))); button.setAttribute("tabindex", iso(stateful.active) === value ? "0" : "-1"); button.tabIndex = iso(stateful.active) === value ? 0 : -1;
                    if (value === today) button.setAttribute("aria-current", "date");
                    if (outside) button.dataset.uiCalendarOutside = "";
                    if (isDisabled(date)) { button.disabled = true; button.setAttribute("aria-disabled", "true"); }
                    cell.setAttribute("role", "gridcell"); cell.append(button); row.append(cell);
                }
                target.append(row);
            }
            if (body.replaceChildren && fragment) body.replaceChildren(fragment); else { while (body.firstElementChild) body.firstElementChild.remove(); if (fragment) body.append(fragment); }
        };
        const changeMonth = (amount) => { stateful.view = addMonths(stateful.view, amount); const last = new Date(stateful.view.getFullYear(), stateful.view.getMonth() + 1, 0).getDate(), candidate = new Date(stateful.view.getFullYear(), stateful.view.getMonth(), Math.min(stateful.active.getDate(), last)); stateful.active = nearestEnabled(candidate, amount < 0 ? -1 : 1) || candidate; render(); emit(root, "mewa-ui:month-change", { value: iso(stateful.active), month: heading?.textContent }); };
        const keys = (event, button) => {
            const date = parse(button.dataset.date); if (!date) return;
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(date, true); return; }
            if (event.key === "PageDown" || event.key === "PageUp") { event.preventDefault(); const direction = event.key === "PageDown" ? 1 : -1; changeMonth(direction * (event.shiftKey ? 12 : 1)); focus(stateful.active, direction); return; }
            const offsets = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
            const amount = event.key === "Home" ? -date.getDay() : event.key === "End" ? 6 - date.getDay() : offsets[event.key];
            if (amount !== undefined) { event.preventDefault(); focus(addDays(date, amount), amount < 0 ? -1 : 1); }
        };
        add(state, root, "click", (event) => { const day = event.target.closest?.("[data-ui-calendar-day]"); if (day) select(parse(day.dataset.date), false); });
        add(state, root, "keydown", (event) => { const day = event.target.closest?.("[data-ui-calendar-day]"); if (day) keys(event, day); });
        parts(root, "previous prev").filter((button) => button.matches("[data-ui-calendar-previous]") || button.getAttribute("aria-label")?.toLowerCase().includes("previous")).forEach((button) => add(state, button, "click", () => changeMonth(-1)));
        parts(root, "next").filter((button) => button.matches("[data-ui-calendar-next]") || button.getAttribute("aria-label")?.toLowerCase().includes("next")).forEach((button) => add(state, button, "click", () => changeMonth(1)));
        render();
    }
    function datePicker(root, state) {
        const input = part(root, "input"), trigger = part(root, "trigger") || q(root, "[data-ui-trigger]"), panel = panelFor(trigger, root), calendarRoot = q(root, "[data-ui-calendar]");
        const hidden = q(root, "input[type=hidden][data-ui-date-value]") || q(root, "input[type=hidden]");
        if (!trigger || !panel || !calendarRoot) return;
        const format = (value) => { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }); };
        const clearPosition = () => { delete panel.dataset.uiPositioned; panel.style.position = ""; panel.style.left = ""; panel.style.top = ""; };
        const position = () => { if (panel.hidden) return; const anchor = trigger.getBoundingClientRect(), rect = panel.getBoundingClientRect(), gap = 8, viewWidth = window.innerWidth || document.documentElement.clientWidth, viewHeight = window.innerHeight || document.documentElement.clientHeight; let left = anchor.left, top = anchor.bottom + gap; if (top + rect.height > viewHeight - gap && anchor.top >= rect.height + gap) top = anchor.top - rect.height - gap; left = Math.max(gap, Math.min(left, Math.max(gap, viewWidth - rect.width - gap))); top = Math.max(gap, Math.min(top, Math.max(gap, viewHeight - rect.height - gap))); panel.dataset.uiPositioned = "true"; panel.style.position = "fixed"; panel.style.left = `${left}px`; panel.style.top = `${top}px`; };
        const close = (restore) => { open(trigger, panel, false); clearPosition(); if (restore) trigger.focus(); };
        add(state, trigger, "click", (event) => { event.preventDefault(); if (panel.hidden) { open(trigger, panel, true); position(); q(calendarRoot, "[data-ui-calendar-day][tabindex='0']")?.focus(); } else close(false); });
        add(state, root, "keydown", (event) => { if (event.key === "Escape" && !panel.hidden) { event.preventDefault(); close(true); } });
        add(state, root, "mewa-ui:date-change", (event) => { if (event.target !== calendarRoot) return; const value = event.detail.value; if (input) input.value = format(value); if (hidden) hidden.value = value; root.dataset.uiValue = value; close(true); });
        add(state, document, "pointerdown", (event) => { if (!root.contains(event.target) && !panel.hidden) close(false); });
        add(state, window, "resize", position); add(state, window, "scroll", position, true);
        state.cleanup.push(() => close(false));
    }
    function carousel(root, state) { const track = q(root, "[data-ui-carousel-track]"); const slides = () => qa(root, "[data-ui-carousel-slide],[data-ui-part=slide]"); let index = Math.max(0, slides().findIndex((slide) => slide.getAttribute("aria-hidden") !== "true" && !slide.hidden)); const show = (next) => { const all = slides(); if (!all.length) return; index = (next + all.length) % all.length; all.forEach((slide, item) => { const inactive = item !== index; slide.hidden = !track && inactive; slide.inert = inactive; slide.setAttribute("aria-hidden", String(inactive)); }); if (track) track.style.transform = `translateX(-${index * 100}%)`; const status = part(root, "status"); if (status) status.textContent = `Slide ${index + 1} of ${all.length}`; emit(root, "mewa-ui:slide-change", { index }); }; parts(root, "next").forEach((button) => add(state, button, "click", () => show(index + 1))); parts(root, "previous prev").forEach((button) => add(state, button, "click", () => show(index - 1))); add(state, root, "keydown", (event) => { if (event.target !== root) return; if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); show(index + (event.key === "ArrowRight" ? 1 : -1)); } }); show(index); }
    function navbarVertical(root, state) {
        const trigger = part(root, "trigger"), collapseTrigger = part(root, "collapse-trigger"), panel = part(root, "panel");
        if (!panel) return;
        const shell = root.closest?.("[data-ui-shell]") || document.body;
        const compact = () => window.matchMedia?.("(max-width: 48rem)")?.matches === true;
        const setCollapsed = (collapsed) => {
            root.dataset.uiCollapsed = String(collapsed);
            shell.dataset.uiNavCollapsed = String(collapsed);
            if (collapseTrigger) {
                collapseTrigger.setAttribute("aria-expanded", String(!collapsed));
                collapseTrigger.setAttribute("aria-label", collapsed ? "Show menu" : "Hide menu");
            }
        };
        setCollapsed(root.dataset.uiCollapsed === "true");
        if (collapseTrigger) add(state, collapseTrigger, "click", () => setCollapsed(root.dataset.uiCollapsed !== "true"));
        if (!trigger) return;
        let wasCompact = compact();
        if (wasCompact) open(trigger, panel, false);
        add(state, trigger, "click", () => open(trigger, panel, panel.hidden));
        add(state, panel, "click", (event) => { if (compact() && event.target.closest?.("a[href]")) open(trigger, panel, false); });
        add(state, root, "keydown", (event) => { if (compact() && event.key === "Escape" && !panel.hidden) { event.preventDefault(); open(trigger, panel, false); trigger.focus(); } });
        add(state, document, "pointerdown", (event) => { if (compact() && !panel.hidden && !root.contains(event.target)) open(trigger, panel, false); });
        add(state, window, "resize", () => { const nextCompact = compact(); if (nextCompact === wasCompact) return; wasCompact = nextCompact; open(trigger, panel, !nextCompact); });
    }
    function resizable(root, state) {
        const handle = part(root, "handle") || q(root, "[data-ui-resize-handle]");
        const pane = parts(root, "panel pane")[0] || q(root, "[data-ui-resize-pane]");
        const group = part(root, "group") || root;
        if (!handle || !pane) return;
        const horizontal = handle.getAttribute("aria-orientation") === "horizontal";
        const dimension = horizontal ? "height" : "width";
        const coordinate = horizontal ? "clientY" : "clientX";
        const decreaseKey = horizontal ? "ArrowUp" : "ArrowLeft";
        const increaseKey = horizontal ? "ArrowDown" : "ArrowRight";
        const valueTextPrefix = handle.dataset.uiAriaValuetextPrefix?.trim();
        const min = Number(handle.getAttribute("aria-valuemin") || 0);
        const max = Number(handle.getAttribute("aria-valuemax") || 100);
        let targetValue = Number(handle.getAttribute("aria-valuenow"));
        const announce = (value) => { handle.setAttribute("aria-valuenow", String(value)); handle.setAttribute("aria-valuetext", valueTextPrefix ? `${valueTextPrefix}: ${value} percent` : `${value} percent`); };
        const containerSize = () => group.getBoundingClientRect()[dimension] || 1;
        const paneSize = () => pane.getBoundingClientRect()[dimension] || 0;
        const sync = () => announce(Math.max(min, Math.min(max, Math.round(paneSize() / containerSize() * 100))));
        const setSize = (size) => {
            const container = containerSize();
            size = Math.max(container * min / 100, Math.min(container * max / 100, size));
            targetValue = Math.round(size / container * 100);
            pane.style.flexBasis = `${size}px`;
            pane.style.flexShrink = "0";
            announce(targetValue);
            window.requestAnimationFrame?.(sync);
        };
        if (Number.isFinite(targetValue)) setSize(containerSize() * targetValue / 100);
        add(state, window, "resize", () => setSize(containerSize() * targetValue / 100));
        add(state, handle, "pointerdown", (event) => {
            const start = event[coordinate], initialSize = paneSize();
            handle.setPointerCapture?.(event.pointerId);
            const finish = () => { removeMove(); removeUp(); removeCancel(); if (handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId); };
            const removeMove = add(state, handle, "pointermove", (next) => setSize(initialSize + next[coordinate] - start));
            const removeUp = add(state, handle, "pointerup", finish, { once: true });
            const removeCancel = add(state, handle, "pointercancel", finish, { once: true });
        });
        add(state, handle, "keydown", (event) => {
            if (event.key === decreaseKey || event.key === increaseKey) { event.preventDefault(); setSize(paneSize() + (event.key === decreaseKey ? -16 : 16)); }
            else if (event.key === "Home" || event.key === "End") { event.preventDefault(); setSize(containerSize() * (event.key === "Home" ? min : max) / 100); }
        });
    }
    function extras(root, state, component) {
        const toggles = component === "toggle" ? parts(root, "trigger") : qa(root, "[data-ui-toggle]"); toggles.forEach((button) => add(state, button, "click", () => { if (optionDisabled(button)) return; const group = button.closest("[data-ui-button-group]"); const pressed = button.getAttribute("aria-pressed") !== "true"; if (group && group.dataset.multiple !== "true") qa(group, "[aria-pressed]").filter((item) => !optionDisabled(item)).forEach((item) => item.setAttribute("aria-pressed", "false")); button.setAttribute("aria-pressed", String(pressed)); }));
        const sliderInputs = qa(root, "input[type=range]"); qa(root, "output[for],[data-ui-slider-output]").forEach((output) => { const input = document.getElementById(output.htmlFor) || sliderInputs[0]; if (input) { const update = () => { const maximum = input.getAttribute("max") || input.max; const text = `${input.value}${output.dataset.unit || (maximum === "100" ? "%" : "")}`; output.textContent = text; input.setAttribute("aria-valuetext", output.dataset.ariaText || (maximum === "100" ? `${input.value} percent` : text)); }; update(); add(state, input, "input", update); } }); sliderInputs.filter((input) => !qa(root, "output[for],[data-ui-slider-output]").some((output) => (document.getElementById(output.htmlFor) || sliderInputs[0]) === input)).forEach((input) => { const update = () => input.setAttribute("aria-valuetext", (input.getAttribute("max") || input.max) === "100" ? `${input.value} percent` : input.value); update(); add(state, input, "input", update); });
        if (component === "diff") { const input = part(root, "control"), status = part(root, "status"); if (input) { const update = () => { const value = Math.max(0, Math.min(100, Number(input.value) || 0)); root.style.setProperty?.("--ui-diff-position", `${value}%`); if (!root.style.setProperty) root.style["--ui-diff-position"] = `${value}%`; input.setAttribute("aria-valuetext", `${value} percent after`); if (status) status.textContent = `${value}% after`; }; update(); add(state, input, "input", update); } }
        if (component === "file-input") { const input = part(root, "input") || q(root, "input[type=file]"), status = part(root, "status"); if (input && status) add(state, input, "change", () => { const files = Array.from(input.files || []); status.textContent = files.length === 0 ? "No file selected." : files.length === 1 ? `${files[0].name} selected.` : `${files.length} files selected.`; }); }
        if (component === "number-field") {
            const input = part(root, "input") || q(root, "input[type=number]"), decrement = part(root, "decrement"), increment = part(root, "increment");
            if (input) {
                const numeric = (name, fallback) => { const attribute = input.getAttribute(name); if (attribute === null || attribute === "") return fallback; const value = Number(attribute); return Number.isFinite(value) ? value : fallback; };
                const sync = () => { const value = Number(input.value); if (decrement) decrement.disabled = Number.isFinite(value) && value <= numeric("min", -Infinity); if (increment) increment.disabled = Number.isFinite(value) && value >= numeric("max", Infinity); };
                const change = (direction) => {
                    let usedNativeStep = false;
                    try { if (direction > 0 && typeof input.stepUp === "function") { input.stepUp(); usedNativeStep = true; } else if (direction < 0 && typeof input.stepDown === "function") { input.stepDown(); usedNativeStep = true; } } catch (error) { usedNativeStep = false; }
                    if (!usedNativeStep) {
                        const step = numeric("step", 1) || 1, minimum = numeric("min", -Infinity), maximum = numeric("max", Infinity), current = Number(input.value);
                        const origin = Number.isFinite(current) ? current : Number.isFinite(minimum) ? minimum : 0;
                        const decimals = (value) => String(value).split(".")[1]?.length || 0;
                        const factor = 10 ** Math.max(decimals(step), decimals(origin));
                        const next = (Math.round(origin * factor) + direction * Math.round(step * factor)) / factor;
                        input.value = String(Math.max(minimum, Math.min(maximum, next)));
                    }
                    input.dispatchEvent(new CustomEvent("input", { bubbles: true }));
                    input.dispatchEvent(new CustomEvent("change", { bubbles: true }));
                    input.focus();
                };
                if (decrement) add(state, decrement, "click", () => change(-1));
                if (increment) add(state, increment, "click", () => change(1));
                add(state, input, "input", sync); add(state, input, "change", sync); sync();
            }
        }
        if (component === "toast" || root.matches("[data-ui-toast]")) { const toast = part(root, "toast"); const trigger = part(root, "trigger"); if (trigger && toast) add(state, trigger, "click", () => { toast.hidden = false; }); qa(root, "[data-ui-close]").forEach((button) => add(state, button, "click", () => { const target = button.closest("[data-ui-part=toast],[data-ui-toast]") || toast; if (target) target.hidden = true; })); }
        if (component === "data-table" || root.matches("[data-ui-table]")) {
            const table = q(root, "table") || root, headers = qa(table, "th[data-ui-part=sort],th[aria-sort]");
            const status = part(root, "status"), empty = part(root, "empty"), range = part(root, "range");
            const filters = qa(root, "[data-ui-filter],[data-ui-table-filter]");
            const clearFilters = qa(root, "[data-ui-table-clear]");
            const rows = () => qa(table, "tbody tr");
            const total = rows().length;
            const singular = status?.dataset.uiSingular || "matching result";
            const plural = status?.dataset.uiPlural || "matching results";
            const rangeLabel = range?.dataset.uiLabel || "results";
            const syncResults = () => {
                const visible = rows().filter((row) => !row.hidden).length;
                if (empty) empty.hidden = visible !== 0;
                if (status) status.textContent = `${visible} ${visible === 1 ? singular : plural}`;
                if (range) range.textContent = `${visible ? `Showing 1–${visible}` : "Showing 0"} of ${total} ${rangeLabel}`;
            };
            const applyFilters = () => {
                const needles = filters.map((input) => input.value.trim().toLowerCase()).filter(Boolean);
                rows().forEach((row) => { const text = row.textContent.toLowerCase(); row.hidden = needles.some((needle) => !text.includes(needle)); });
                syncResults();
            };
            headers.forEach((cell) => {
                const explicitTrigger = q(cell, "[data-ui-table-sort-trigger]"), trigger = explicitTrigger || (q(cell, "button,[role=button]") ? null : cell);
                if (!trigger) return;
                add(state, trigger, "click", (event) => {
                    event.preventDefault();
                    const index = Array.from(cell.parentElement.children).indexOf(cell), ascending = cell.getAttribute("aria-sort") !== "ascending";
                    headers.forEach((item) => item.setAttribute("aria-sort", item === cell ? (ascending ? "ascending" : "descending") : "none"));
                    rows().sort((a, b) => a.children[index].textContent.localeCompare(b.children[index].textContent, undefined, { numeric: true }) * (ascending ? 1 : -1)).forEach((row) => table.tBodies[0]?.append(row));
                    syncResults();
                });
            });
            filters.forEach((input) => add(state, input, "input", applyFilters));
            clearFilters.forEach((button) => add(state, button, "click", () => { filters.forEach((input) => { input.value = ""; }); applyFilters(); filters[0]?.focus(); }));
            syncResults();
        }
        if (component === "questionnaire" || root.matches("[data-ui-questionnaire]")) { const steps = qa(root, "[data-ui-question],[data-ui-part=step]"); if (!steps.length) return; let index = Math.max(0, steps.findIndex((step) => !step.hidden)); const nextButtons = qa(root, "[data-ui-question-next],[data-ui-part=next]"), previous = qa(root, "[data-ui-question-prev],[data-ui-part=previous],[data-ui-part=prev]"), submit = part(root, "submit"); const update = (next, focusStep = false) => { index = Math.max(0, Math.min(next, steps.length - 1)); steps.forEach((step, item) => { step.hidden = item !== index; }); const final = index === steps.length - 1; nextButtons.forEach((button) => { button.hidden = final; }); previous.forEach((button) => { button.hidden = index === 0; button.disabled = index === 0; }); if (submit) submit.hidden = !final; const progress = part(root, "progress"); if (progress) progress.textContent = `Step ${index + 1} of ${steps.length}`; if (focusStep) { const step = steps[index]; if (step.getAttribute("tabindex") === null) step.setAttribute("tabindex", "-1"); step.focus(); } emit(root, "mewa-ui:question-change", { step: index, question: steps[index] }); }; update(index); nextButtons.forEach((button) => add(state, button, "click", (event) => { const invalid = qa(steps[index], "[required]").find((field) => !field.checkValidity()); if (invalid) { event.preventDefault(); invalid.reportValidity(); return; } event.preventDefault(); update(index + 1, true); })); previous.forEach((button) => add(state, button, "click", (event) => { event.preventDefault(); update(index - 1, true); })); }
        if (component === "message-scroller" || root.matches("[data-ui-message-scroller]")) { const list = part(root, "list") || root, messages = part(root, "messages"), composer = part(root, "composer"), textarea = composer && q(composer, "textarea"), status = part(root, "status"), jump = q(root, "[data-ui-jump]") || part(root, "jump"), bottom = () => Math.max(0, list.scrollHeight - list.clientHeight); let follow = list.scrollTop >= bottom() - 24; const sync = () => { list.scrollTop = Math.max(0, Math.min(list.scrollTop, bottom())); follow = list.scrollTop >= bottom() - 24; if (jump) jump.hidden = follow; }; add(state, list, "scroll", sync); if (jump) add(state, jump, "click", () => { list.scrollTop = bottom(); sync(); }); const observer = new MutationObserver(() => { if (follow) list.scrollTop = bottom(); sync(); }); observer.observe(list, { childList: true, subtree: true }); state.observer = observer; if (textarea) add(state, textarea, "input", () => textarea.setCustomValidity("")); if (composer && textarea && messages) add(state, composer, "submit", (event) => { event.preventDefault(); const message = textarea.value.trim(); textarea.setCustomValidity(message ? "" : "Enter a message."); if (!composer.checkValidity() || !message) { composer.reportValidity(); return; } const item = document.createElement("li"), article = document.createElement("article"), header = document.createElement("header"), author = document.createElement("h3"), time = document.createElement("time"), body = document.createElement("p"), metadata = document.createElement("p"), now = new Date(); author.className = "ui-message-title"; author.textContent = composer.dataset.uiMessageAuthor || root.dataset.uiMessageAuthor || "You"; time.className = "ui-meta-text"; time.dateTime = now.toISOString(); time.textContent = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); body.textContent = message; metadata.className = "ui-meta-text"; metadata.textContent = "Added to this discussion"; header.append(author, time); article.append(header, body, metadata); item.append(article); follow = true; messages.append(item); textarea.value = ""; list.scrollTop = bottom(); sync(); if (status) status.textContent = "Message added. You are viewing the latest messages."; }); sync(); }
    }
    function enhance(root = document) { const all = []; if (root.matches?.(selector)) all.push(root); all.push(...qa(root, selector)); all.forEach((element) => { if (instances.has(element)) return; const state = { listeners: [], cleanup: [] }; instances.set(element, state); const component = element.dataset.uiComponent || ""; if (/^(accordion|collapsible)$/.test(component) || element.matches("[data-ui-disclosure]")) disclosure(element, state); if (component === "tabs" || element.matches("[data-ui-tabs]")) tabs(element, state); if (/^(dialog|sheet|drawer|lightbox)$/.test(component) || (component === "alert" && q(element, "[data-ui-alert-dialog]")) || element.matches("[data-ui-dialog],[data-ui-alert-dialog],[data-ui-sheet],[data-ui-drawer]")) modal(element, state); if (/^(popover|dropdown-menu|tooltip|split-button)$/.test(component) || (component !== "date-picker" && element.matches("[data-ui-popover],[data-ui-menu]"))) popup(element, state, component); if (component === "autocomplete") autocomplete(element, state); if (/^(combobox|select|command)$/.test(component) || element.matches("[data-ui-combobox],[data-ui-select],[data-ui-command]")) choices(element, state); if (component === "checkbox-group") checkboxGroup(element, state); if (component === "lightbox") lightbox(element, state); if (component === "sortable-list") sortableList(element, state); if (component === "time-field") timeField(element, state); if (component === "calendar" || element.matches("[data-ui-calendar]")) calendar(element, state); if (component === "date-picker") datePicker(element, state); if (component === "carousel" || element.matches("[data-ui-carousel]")) carousel(element, state); if (component === "resizable" || element.matches("[data-ui-resizable]")) resizable(element, state); if (component === "navbar-vertical" || element.matches("[data-ui-navbar-vertical]")) navbarVertical(element, state); extras(element, state, component); }); return root; }
    function destroy(root = document) { const all = []; if (root.matches?.(selector)) all.push(root); all.push(...qa(root, selector)); all.forEach((element) => { const state = instances.get(element); if (!state) return; state.listeners.forEach(([node, type, fn, options]) => node.removeEventListener(type, fn, options)); state.observer?.disconnect(); state.cleanup.forEach((cleanup) => cleanup()); instances.delete(element); }); return root; }
    window.MewaUI = Object.assign(window.MewaUI || {}, { enhance, destroy });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => enhance()); else enhance();
}());

"use strict";

// This intentionally small DOM is a runtime contract harness, not a browser.
// It executes src/components.js without a package or browser binary and covers the
// selectors, events, focus, and mutable state the progressive enhancement uses.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function dataName(name) { return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()); }
function splitSelectors(selector) {
    const result = []; let depth = 0, current = "";
    for (const character of selector) { if (character === "[") depth++; if (character === "]") depth--; if (character === "," && !depth) { result.push(current); current = ""; } else current += character; }
    return result.concat(current).map((value) => value.trim()).filter(Boolean);
}
function tokenMatches(element, token) {
    token = token.trim();
    if (token === "*") return true;
    const not = token.match(/:not\(\[([^\]]+)\]\)/);
    if (not && attrMatches(element, not[1])) return false;
    token = token.replace(/:not\([^)]*\)/g, "");
    const tag = token.match(/^[a-z][\w-]*/i);
    if (tag && element.tagName.toLowerCase() !== tag[0].toLowerCase()) return false;
    const id = token.match(/#([\w-]+)/); if (id && element.id !== id[1]) return false;
    return Array.from(token.matchAll(/\[([^\]]+)\]/g)).every((match) => attrMatches(element, match[1]));
}
function attrMatches(element, expression) {
    const match = expression.match(/^([\w:-]+)(?:\s*(\^=|=)\s*['"]?([^'"]*)['"]?)?$/);
    if (!match) return false;
    const actual = element.getAttribute(match[1]);
    return actual !== null && (!match[2] || (match[2] === "^=" ? actual.startsWith(match[3]) : actual === match[3]));
}
function matchesSelector(element, selector, root) {
    if (selector === ":scope > *") return element.parentElement === root;
    const tokens = selector.split(/\s+/).filter(Boolean);
    if (!tokenMatches(element, tokens.pop())) return false;
    let parent = element.parentElement;
    while (tokens.length) { const token = tokens.at(-1); while (parent && !tokenMatches(parent, token)) parent = parent.parentElement; if (!parent) return false; tokens.pop(); parent = parent.parentElement; }
    return true;
}
class EventLike {
    constructor(type, init = {}) { Object.assign(this, init, { type, bubbles: Boolean(init.bubbles), defaultPrevented: false }); }
    preventDefault() { this.defaultPrevented = true; }
}
class Element {
    constructor(tag = "div", attributes = {}) {
        this.tagName = tag.toUpperCase(); this.attributes = new Map(); this.children = []; this.parentElement = null;
        this.listeners = {}; this.dataset = {}; this.style = {}; this.hidden = false; this.inert = false; this.tabIndex = 0; this.validationMessage = "";
        this.textContent = ""; this.value = ""; this.clientHeight = 100; this.scrollHeight = 200; this.scrollTop = 0; this.rect = { width: 100, height: 20, left: 0, top: 0, right: 100, bottom: 20 }; this.offsetWidth = 100; this.offsetHeight = 20;
        Object.entries(attributes).forEach(([name, value]) => this.setAttribute(name, value));
    }
    setAttribute(name, value) { value = String(value); this.attributes.set(name, value); if (name.startsWith("data-")) this.dataset[dataName(name.slice(5))] = value; if (name === "id") this.id = value; if (name === "for") this.htmlFor = value; }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    removeAttribute(name) { this.attributes.delete(name); if (name.startsWith("data-")) delete this.dataset[dataName(name.slice(5))]; }
    append(...nodes) { nodes.forEach((node) => { if (node.parentElement) node.remove(); node.parentElement = this; this.children.push(node); }); }
    insertBefore(node, reference) { if (node.parentElement) node.remove(); node.parentElement = this; const index = reference ? this.children.indexOf(reference) : -1; if (index < 0) this.children.push(node); else this.children.splice(index, 0, node); return node; }
    remove() { if (this.parentElement) this.parentElement.children.splice(this.parentElement.children.indexOf(this), 1); this.parentElement = null; }
    get firstElementChild() { return this.children[0] || null; }
    get tBodies() { return this.children.filter((node) => node.tagName === "TBODY"); }
    get isConnected() { return this === document || document.contains(this); }
    contains(node) { for (; node; node = node.parentElement) if (node === this) return true; return false; }
    matches(selector) { return splitSelectors(selector).some((part) => matchesSelector(this, part, this.parentElement)); }
    closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null; }
    querySelectorAll(selector) { const result = []; const visit = (node) => node.children.forEach((child) => { if (splitSelectors(selector).some((part) => matchesSelector(child, part, this))) result.push(child); visit(child); }); visit(this); return result; }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    addEventListener(type, listener, options) { (this.listeners[type] ||= []).push({ listener, options }); }
    removeEventListener(type, listener) { this.listeners[type] = (this.listeners[type] || []).filter((entry) => entry.listener !== listener); }
    dispatchEvent(event) { event.target ||= this; (this.listeners[event.type] || []).slice().forEach((entry) => { entry.listener.call(this, event); if (entry.options && entry.options.once) this.removeEventListener(event.type, entry.listener); }); if (event.bubbles && this.parentElement) this.parentElement.dispatchEvent(event); return !event.defaultPrevented; }
    focus() { document.activeElement = this; }
    getBoundingClientRect() { return this.rect; }
    setPointerCapture() {} releasePointerCapture() {}
    setCustomValidity(message) { this.validationMessage = String(message); }
    checkValidity() { if (this.tagName === "FORM") return this.querySelectorAll("input,select,textarea").every((field) => field.checkValidity()); return !this.validationMessage && (!this.required || Boolean(this.value)); } reportValidity() { this.reported = true; return this.checkValidity(); }
}
class Document extends Element {
    constructor() { super("#document"); this.readyState = "complete"; this.documentElement = new Element("html"); this.body = new Element("body"); this.documentElement.append(this.body); this.append(this.documentElement); this.activeElement = this.body; }
    getElementById(id) { return this.querySelector(`#${id}`); }
}
const document = new Document();
const window = new Element("window"); window.document = document; window.innerWidth = 800; window.innerHeight = 600;
global.document = document;
function node(tag, attributes, text) { const result = new Element(tag, attributes); result.textContent = text || ""; return result; }
function fire(target, type, init) { const event = new EventLike(type, init); target.dispatchEvent(event); return event; }
function key(target, value, extra) { return fire(target, "keydown", { key: value, ...extra }); }
function mount(root) { document.body.append(root); window.MewaUI.enhance(root); return root; }
function listeners(target, type) { return (target.listeners[type] || []).length; }

vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "src", "components.js"), "utf8"), { window, document, CustomEvent: EventLike, MutationObserver: class { observe() {} disconnect() {} }, setTimeout, clearTimeout, console });

function test(name, run) { try { run(); console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}\n${error.stack}`); process.exitCode = 1; } }

test("disclosure and tabs wire triggers, panels, and arrow selection", () => {
    const disclosure = node("section", { "data-ui-disclosure": "" }), trigger = node("button", { "data-ui-part": "trigger", "aria-controls": "details", "aria-expanded": "false" }), panel = node("div", { id: "details" }); panel.hidden = true; disclosure.append(trigger, panel); mount(disclosure); fire(trigger, "click"); assert.equal(panel.hidden, false); assert.equal(trigger.getAttribute("aria-expanded"), "true");
    const tabs = node("section", { "data-ui-tabs": "" }), one = node("button", { role: "tab", "aria-controls": "one" }), disabled = node("button", { role: "tab", "aria-controls": "disabled", disabled: "" }), two = node("button", { role: "tab", "aria-controls": "two" }), first = node("div", { id: "one" }), unavailable = node("div", { id: "disabled" }), second = node("div", { id: "two" }); tabs.append(one, disabled, two, first, unavailable, second); mount(tabs); key(one, "ArrowRight"); assert.equal(two.getAttribute("aria-selected"), "true"); assert.equal(disabled.getAttribute("aria-selected"), "false"); assert.equal(first.hidden, true); assert.equal(unavailable.hidden, true); assert.equal(document.activeElement, two);
});

test("modal restores focus and popup tooltip opens and closes", () => {
    const dialog = node("section", { "data-ui-dialog": "" }), opener = node("button", { "data-ui-part": "trigger", "aria-controls": "modal" }), modal = node("div", { id: "modal" }), close = node("button", { "data-ui-close": "" }); modal.hidden = true; modal.append(close); dialog.append(opener, modal); mount(dialog); fire(opener, "click"); assert.equal(modal.hidden, false); assert.equal(document.documentElement.dataset.mewaUiModalOpen, "true"); assert.equal(document.activeElement, close); key(modal, "Escape"); assert.equal(modal.hidden, true); assert.equal(document.activeElement, opener);
    const tooltip = node("section", { "data-ui-component": "tooltip" }), tipTrigger = node("button", { "data-ui-part": "trigger", "aria-controls": "tip" }), tip = node("div", { id: "tip" }); tip.hidden = true; tooltip.append(tipTrigger, tip); mount(tooltip); fire(tipTrigger, "focus"); assert.equal(tip.hidden, false); fire(tipTrigger, "blur"); assert.equal(tip.hidden, true); fire(tooltip, "pointerenter"); assert.equal(tip.hidden, true, "hovering unrelated tooltip container space must not expose the description"); fire(tipTrigger, "pointerenter"); assert.equal(tip.hidden, false); fire(tipTrigger, "pointerleave", { relatedTarget: document.body }); assert.equal(tip.hidden, true);
});

test("opt-in dialog forms validate and close without native navigation", () => {
    const dialog = node("section", { "data-ui-component": "dialog" }), opener = node("button", { "data-ui-part": "trigger", "aria-controls": "form-modal" }), panel = node("div", { id: "form-modal" }), form = node("form", { "data-ui-dialog-form": "" }), field = node("input"); panel.hidden = true; field.required = true; form.append(field); panel.append(form); dialog.append(opener, panel); mount(dialog); fire(opener, "click"); const invalid = fire(form, "submit", { bubbles: true }); assert.equal(invalid.defaultPrevented, false); assert.equal(panel.hidden, false); field.value = "Valid"; const valid = fire(form, "submit", { bubbles: true }); assert.equal(valid.defaultPrevented, true); assert.equal(panel.hidden, true); assert.equal(document.activeElement, opener);
});

test("destroying an active modal restores page state", () => {
    const page = node("main"), dialog = node("section", { "data-ui-dialog": "" }), opener = node("button", { "data-ui-part": "trigger", "aria-controls": "destroy-modal" }), modal = node("div", { id: "destroy-modal" });
    modal.hidden = true; dialog.append(opener, modal); document.body.append(page); mount(dialog); fire(opener, "click");
    assert.equal(page.inert, true);
    window.MewaUI.destroy(dialog);
    assert.equal(page.inert, false);
    assert.equal(document.documentElement.dataset.mewaUiModalOpen, undefined);
    assert.equal(modal.hidden, true);
});

test("dropdown and split-button menus close through every keyboard route", () => {
    const dropdown = node("section", { "data-ui-component": "dropdown-menu" }), trigger = node("button", { "data-ui-part": "trigger", "aria-controls": "file-menu", "aria-expanded": "false" }), panel = node("menu", { id: "file-menu", "data-ui-part": "content", role: "menu" });
    const first = node("button", { role: "menuitem" }, "First"), second = node("button", { role: "menuitem" }, "Second"), close = node("button", { "data-ui-close": "" }, "Close"); panel.hidden = true; panel.append(first, second, close); dropdown.append(trigger, panel); mount(dropdown);
    key(trigger, "ArrowDown"); assert.equal(panel.hidden, false); assert.equal(document.activeElement, first); key(panel, "ArrowDown"); assert.equal(document.activeElement, second);
    key(panel, "Escape", { bubbles: true }); assert.equal(panel.hidden, true); assert.equal(document.activeElement, trigger);
    fire(trigger, "click"); fire(close, "click", { bubbles: true }); assert.equal(panel.hidden, true, "menu close control closes its containing popup");
    const split = node("div", { "data-ui-component": "split-button" }), splitTrigger = node("button", { "data-ui-part": "trigger", "aria-controls": "split-menu" }), splitPanel = node("menu", { id: "split-menu", "data-ui-part": "content", role: "menu" }), splitItem = node("button", { role: "menuitem" }, "Schedule"); splitPanel.hidden = true; splitPanel.append(splitItem); split.append(splitTrigger, splitPanel); mount(split); fire(splitTrigger, "click"); assert.equal(splitPanel.hidden, false); fire(splitItem, "click"); assert.equal(splitPanel.hidden, true);
});

test("menus honor disabled and checked roles while keeping popup positioning", () => {
    const root = node("section", { "data-ui-component": "dropdown-menu" }), trigger = node("button", { "data-ui-part": "trigger", "aria-controls": "menu" }), panel = node("menu", { id: "menu", "data-ui-part": "content", role: "menu" }); panel.hidden = true;
    const disabled = node("button", { role: "menuitem", "aria-disabled": "true" }, "Blocked"), check = node("button", { role: "menuitemcheckbox", "aria-checked": "false" }, "Checked"), one = node("button", { role: "menuitemradio", name: "view", "aria-checked": "true" }, "One"), two = node("button", { role: "menuitemradio", name: "view", "aria-checked": "false" }, "Two"); panel.append(disabled, check, one, two); root.append(trigger, panel); mount(root);
    fire(trigger, "click"); assert.equal(panel.style.position, "fixed"); assert.equal(panel.dataset.side, "bottom"); fire(disabled, "click"); assert.equal(panel.hidden, false, "disabled menu items do not activate or close the menu"); fire(check, "click"); assert.equal(check.getAttribute("aria-checked"), "true"); fire(trigger, "click"); fire(two, "click"); assert.equal(one.getAttribute("aria-checked"), "false"); assert.equal(two.getAttribute("aria-checked"), "true");
});

test("menu typeahead accumulates characters and searches from the active item", () => {
    const root = node("section", { "data-ui-component": "dropdown-menu" }), trigger = node("button", { "data-ui-part": "trigger", "aria-controls": "typeahead-menu" }), panel = node("menu", { id: "typeahead-menu", "data-ui-part": "content", role: "menu" }); panel.hidden = true;
    const alpha = node("button", { role: "menuitem" }, "Alpha"), save = node("button", { role: "menuitem" }, "Save"), search = node("button", { role: "menuitem" }, "Search"); panel.append(alpha, save, search); root.append(trigger, panel); mount(root);
    key(trigger, "ArrowDown"); key(panel, "s"); assert.equal(document.activeElement, save); key(panel, "e"); assert.equal(document.activeElement, search); window.MewaUI.destroy(root);
});

test("tooltip hover pairs retain containment", () => {
    const hover = node("section", { "data-ui-component": "tooltip" }), trigger = node("button", { "data-ui-part": "trigger", "aria-controls": "contained-tip" }), tip = node("div", { id: "contained-tip" }); tip.hidden = true; hover.append(trigger, tip); mount(hover); fire(trigger, "pointerenter"); fire(trigger, "pointerleave", { relatedTarget: tip });
    assert.equal(tip.hidden, false, "leaving a trigger for its own panel keeps the pair open");
    fire(tip, "pointerleave", { relatedTarget: document.body }); assert.equal(tip.hidden, true);
});

test("combobox filters and selects with keys, calendar moves selection, carousel changes state", () => {
    const combo = node("section", { "data-ui-combobox": "" }), input = node("input", { "data-ui-part": "input", role: "combobox" }), submittedValue = node("input", { type: "hidden" }), list = node("div", { "data-ui-part": "listbox", role: "listbox" }), empty = node("p", { "data-ui-part": "empty" }), alpha = node("div", { role: "option", id: "alpha", "aria-selected": "true" }, "Alpha"), beta = node("div", { role: "option", id: "beta", "aria-selected": "false" }, "Beta"); input.value = submittedValue.value = "Alpha"; list.hidden = true; empty.hidden = true; list.append(alpha, beta); combo.append(input, submittedValue, list, empty); mount(combo); assert.equal(input.getAttribute("aria-activedescendant"), "alpha"); input.value = "none"; fire(input, "input"); assert.equal(submittedValue.value, ""); assert.equal(empty.hidden, false); fire(document, "pointerdown"); assert.equal(input.value, "Alpha"); assert.equal(submittedValue.value, "Alpha"); assert.equal(input.getAttribute("aria-activedescendant"), "alpha"); assert.equal(alpha.hidden, false); assert.equal(beta.hidden, false); input.value = "none"; fire(input, "input"); key(input, "Escape"); assert.equal(input.value, "Alpha"); assert.equal(submittedValue.value, "Alpha"); assert.equal(input.getAttribute("aria-activedescendant"), "alpha"); input.value = "bet"; fire(input, "input"); assert.equal(empty.hidden, true); assert.equal(alpha.hidden, true); assert.equal(input.getAttribute("aria-activedescendant"), "beta"); assert.equal(beta.dataset.uiActive, "true"); assert.equal(beta.getAttribute("aria-selected"), "false"); assert.equal(alpha.getAttribute("aria-selected"), "true"); key(input, "Enter"); assert.equal(input.value, "Beta"); assert.equal(submittedValue.value, "Beta"); assert.equal(beta.getAttribute("aria-selected"), "true"); assert.equal(list.hidden, true);
    const calendar = node("section", { "data-ui-calendar": "" }), header = node("div", { "data-ui-part": "header" }), title = node("h2", {}, "June 2026"), previousMonth = node("button", { "data-ui-calendar-previous": "", "data-ui-part": "previous", "aria-label": "Previous month" }), days = [1, 2, 3, 4, 5, 6, 7, 8].map((day) => node("button", { "data-ui-calendar-day": "", "data-date": `2026-06-0${day}`, "aria-label": `June ${day}, 2026` }, String(day))); header.append(previousMonth, title); calendar.append(header, ...days); mount(calendar); fire(previousMonth, "click"); assert.notEqual(title.textContent, "June 2026"); days[7].focus(); key(calendar, "PageUp"); assert.match(days[7].dataset.date, /^2026-05-/); assert.equal(document.activeElement, days[7]);
    const carousel = node("section", { "data-ui-carousel": "" }), previous = node("button", { "data-ui-part": "previous" }), next = node("button", { "data-ui-part": "next" }), status = node("output", { "data-ui-part": "status" }), slides = ["a", "b"].map((value) => node("div", { "data-ui-carousel-slide": "" }, value)); carousel.append(previous, next, status, ...slides); mount(carousel); const childEvent = key(next, "ArrowRight", { bubbles: true }); assert.equal(childEvent.defaultPrevented, false, "carousel shortcuts must not steal arrows from descendant controls"); assert.equal(slides[0].getAttribute("aria-hidden"), "false"); const event = key(carousel, "ArrowRight"); assert.equal(event.defaultPrevented, true); assert.equal(slides[1].getAttribute("aria-hidden"), "false"); assert.equal(slides[0].inert, true); assert.equal(status.textContent, "Slide 2 of 2"); fire(previous, "click"); assert.equal(slides[0].getAttribute("aria-hidden"), "false");
});

test("resizable, grouped toggles, toast, and vertical navbar execute their hooks", () => {
    const resize = node("section", { "data-ui-resizable": "" }), handle = node("button", { "data-ui-part": "handle", "aria-valuemin": "0", "aria-valuemax": "100" }), pane = node("div", { "data-ui-part": "panel" }); resize.rect.width = 200; pane.rect.width = 100; resize.append(handle, pane); mount(resize); key(handle, "ArrowRight"); assert.equal(handle.getAttribute("aria-valuenow"), "58"); fire(handle, "pointerdown", { clientX: 10, pointerId: 1 }); fire(handle, "pointermove", { clientX: 20, pointerId: 1 }); pane.rect.width = 110; fire(handle, "pointermove", { clientX: 30, pointerId: 1 }); assert.equal(pane.style.flexBasis, "120px"); fire(handle, "pointercancel", { pointerId: 1 }); assert.equal(listeners(handle, "pointermove"), 0); assert.equal(listeners(handle, "pointerup"), 0); assert.equal(listeners(handle, "pointercancel"), 0);
    const verticalResize = node("section", { "data-ui-resizable": "" }), verticalHandle = node("button", { "data-ui-part": "handle", "aria-orientation": "horizontal", "aria-valuemin": "20", "aria-valuemax": "80", "aria-valuenow": "50" }), verticalPane = node("div", { "data-ui-part": "panel" }); verticalResize.rect.height = 200; verticalPane.rect.height = 100; verticalResize.append(verticalHandle, verticalPane); mount(verticalResize); key(verticalHandle, "ArrowDown"); assert.equal(verticalPane.style.flexBasis, "116px"); key(verticalHandle, "Home"); assert.equal(verticalPane.style.flexBasis, "40px");
    const group = node("section", { "data-ui-button-group": "" }), left = node("button", { "data-ui-toggle": "", "data-ui-part": "trigger", "aria-pressed": "false" }), right = node("button", { "data-ui-toggle": "", "data-ui-part": "trigger", "aria-pressed": "false" }), disabledToggle = node("button", { "data-ui-toggle": "", "data-ui-part": "trigger", "aria-pressed": "false", "aria-disabled": "true" }); group.append(left, right, disabledToggle); mount(group); fire(left, "click"); fire(right, "click"); fire(disabledToggle, "click"); assert.equal(left.getAttribute("aria-pressed"), "false"); assert.equal(right.getAttribute("aria-pressed"), "true"); assert.equal(disabledToggle.getAttribute("aria-pressed"), "false");
    const toastRoot = node("section", { "data-ui-toast": "" }), toastTrigger = node("button", { "data-ui-part": "trigger" }), region = node("div", { "data-ui-part": "region" }), toast = node("div", { "data-ui-part": "toast" }), dismiss = node("button", { "data-ui-close": "" }); toast.hidden = true; toast.append(dismiss); toastRoot.append(toastTrigger, region, toast); mount(toastRoot); assert.equal(toast.hidden, true); fire(toastTrigger, "click"); assert.equal(toast.hidden, false); fire(dismiss, "click"); assert.equal(toast.hidden, true); fire(toastTrigger, "click"); assert.equal(toast.hidden, false);
    const navbar = node("nav", { "data-ui-navbar-vertical": "", "data-ui-component": "navbar-vertical" }), navbarButton = node("button", { "data-ui-part": "trigger", "aria-expanded": "false" }), navbarPanel = node("div", { "data-ui-part": "panel" }), navbarLink = node("a", { href: "#overview" }); navbarPanel.append(navbarLink); navbar.append(navbarButton, navbarPanel); const globalPointers = listeners(document, "pointerdown"), previousMatchMedia = window.matchMedia; window.matchMedia = () => ({ matches: true }); mount(navbar); assert.equal(navbarPanel.hidden, true); fire(navbarButton, "click"); assert.equal(navbarPanel.hidden, false); key(navbar, "Escape"); assert.equal(navbarPanel.hidden, true); assert.equal(document.activeElement, navbarButton); fire(navbarButton, "click"); fire(navbarLink, "click", { bubbles: true }); assert.equal(navbarPanel.hidden, true); fire(navbarButton, "click"); fire(document, "pointerdown"); assert.equal(navbarPanel.hidden, true); window.MewaUI.destroy(navbar); assert.equal(listeners(document, "pointerdown"), globalPointers);
    const shell = node("div", { "data-ui-shell": "", "data-ui-nav-collapsed": "false" }), desktopNavbar = node("nav", { "data-ui-navbar-vertical": "", "data-ui-component": "navbar-vertical", "data-ui-collapsed": "false" }), desktopTrigger = node("button", { "data-ui-part": "trigger", "aria-expanded": "true" }), collapseTrigger = node("button", { "data-ui-part": "collapse-trigger", "aria-expanded": "true" }), desktopPanel = node("div", { "data-ui-part": "panel" }); desktopPanel.append(collapseTrigger); desktopNavbar.append(desktopTrigger, desktopPanel); shell.append(desktopNavbar); window.matchMedia = () => ({ matches: false }); mount(shell); fire(collapseTrigger, "click"); assert.equal(desktopNavbar.dataset.uiCollapsed, "true"); assert.equal(shell.dataset.uiNavCollapsed, "true"); assert.equal(collapseTrigger.getAttribute("aria-expanded"), "false"); assert.equal(collapseTrigger.getAttribute("aria-label"), "Show menu"); fire(collapseTrigger, "click"); assert.equal(desktopNavbar.dataset.uiCollapsed, "false"); assert.equal(shell.dataset.uiNavCollapsed, "false"); assert.equal(collapseTrigger.getAttribute("aria-expanded"), "true"); window.MewaUI.destroy(shell); window.matchMedia = previousMatchMedia;
});

test("data table filtering and sorting, questionnaire steps, and message jump work", () => {
    const tableRoot = node("section", { "data-ui-table": "" }), filter = node("input", { "data-ui-filter": "" }), table = node("table"), header = node("thead"), headerRow = node("tr"), sort = node("th", { "aria-sort": "none" }, "Name"), body = node("tbody"), empty = node("p", { "data-ui-part": "empty" }); empty.hidden = true; headerRow.append(sort); header.append(headerRow); const rowB = node("tr", {}, "Bravo"), rowA = node("tr", {}, "Alpha"); rowB.append(node("td", {}, "Bravo")); rowA.append(node("td", {}, "Alpha")); body.append(rowB, rowA); table.append(header, body); tableRoot.append(filter, table, empty); mount(tableRoot); fire(sort, "click"); assert.equal(body.children[0], rowA); filter.value = "none"; fire(filter, "input"); assert.equal(empty.hidden, false); filter.value = "bravo"; fire(filter, "input"); assert.equal(empty.hidden, true); assert.equal(rowA.hidden, true); assert.equal(rowB.hidden, false);
    const questionnaire = node("section", { "data-ui-questionnaire": "" }), stepOne = node("div", { "data-ui-question": "" }), stepTwo = node("div", { "data-ui-question": "" }), previous = node("button", { "data-ui-question-prev": "", "data-ui-part": "previous" }), next = node("button", { "data-ui-question-next": "", "data-ui-part": "next" }), submit = node("button", { "data-ui-part": "submit" }), progress = node("output", { "data-ui-part": "progress" }); stepTwo.hidden = true; submit.hidden = true; questionnaire.append(stepOne, stepTwo, previous, next, submit, progress); mount(questionnaire); assert.equal(previous.hidden, true); assert.equal(previous.disabled, true); fire(next, "click"); assert.equal(stepOne.hidden, true); assert.equal(stepTwo.hidden, false); assert.equal(previous.disabled, false); assert.equal(next.hidden, true); assert.equal(submit.hidden, false); assert.equal(progress.textContent, "Step 2 of 2");
    const scroller = node("section", { "data-ui-message-scroller": "" }), list = node("div", { "data-ui-part": "list" }), jump = node("button", { "data-ui-jump": "" }); list.scrollTop = 0; list.scrollHeight = 500; list.clientHeight = 100; scroller.append(list, jump); mount(scroller); assert.equal(jump.hidden, false); fire(jump, "click"); assert.equal(list.scrollTop, 400); assert.equal(jump.hidden, true); list.scrollTop = 0; fire(list, "scroll"); assert.equal(jump.hidden, false); list.scrollTop = 400; fire(list, "scroll"); assert.equal(jump.hidden, true);
});

test("data table filtering updates grammar and range, and clear-filter restores rows", () => {
    const root = node("section", { "data-ui-table": "" }), filter = node("input", { "data-ui-table-filter": "" }), status = node("p", { "data-ui-part": "status", "data-ui-singular": "matching project", "data-ui-plural": "matching projects" }), range = node("p", { "data-ui-part": "range", "data-ui-label": "projects" }), clear = node("button", { "data-ui-table-clear": "" }), empty = node("div", { "data-ui-part": "empty" }), table = node("table"), body = node("tbody"), alpha = node("tr", {}, "Alpha"), beta = node("tr", {}, "Beta");
    alpha.append(node("td", {}, "Alpha")); beta.append(node("td", {}, "Beta")); body.append(alpha, beta); table.append(body); empty.hidden = true; root.append(filter, status, range, table, empty, clear); mount(root);
    filter.value = "alpha"; fire(filter, "input"); assert.equal(status.textContent, "1 matching project"); assert.equal(range.textContent, "Showing 1–1 of 2 projects");
    filter.value = "none"; fire(filter, "input"); assert.equal(empty.hidden, false); assert.equal(range.textContent, "Showing 0 of 2 projects"); fire(clear, "click"); assert.equal(filter.value, ""); assert.equal(alpha.hidden, false); assert.equal(beta.hidden, false); assert.equal(document.activeElement, filter);
});

test("native selects remain native and sliders publish their accessible value", () => {
    const selectRoot = node("section", { "data-ui-component": "select" }), select = node("select"), option = node("option", { value: "one" }, "One"); select.value = "one"; select.append(option); selectRoot.append(select); mount(selectRoot); assert.equal(select.value, "one"); assert.equal(select.getAttribute("aria-activedescendant"), null);
    const sliderRoot = node("section", { "data-ui-component": "slider" }), slider = node("input", { id: "volume", type: "range", min: "0", max: "100", value: "60" }), output = node("output", { for: "volume" }); slider.value = "60"; slider.max = "100"; sliderRoot.append(slider, output); mount(sliderRoot); slider.value = "75"; fire(slider, "input"); assert.equal(slider.getAttribute("aria-valuetext"), "75 percent");
});

test("diff, file input, and number field execute their focused interaction contracts", () => {
    const diff = node("figure", { "data-ui-component": "diff" }), diffInput = node("input", { type: "range", max: "100", "data-ui-part": "control" }), diffStatus = node("output", { "data-ui-part": "status" }); diffInput.value = "54"; diff.append(diffInput, diffStatus); mount(diff); diffInput.value = "72"; fire(diffInput, "input"); assert.equal(diff.style["--ui-diff-position"], "72%"); assert.equal(diffStatus.textContent, "72% after"); assert.equal(diffInput.getAttribute("aria-valuetext"), "72 percent after");
    const fileRoot = node("section", { "data-ui-component": "file-input" }), fileInput = node("input", { type: "file", "data-ui-part": "input" }), fileStatus = node("p", { "data-ui-part": "status" }); fileInput.files = [{ name: "artifact.zip" }]; fileRoot.append(fileInput, fileStatus); mount(fileRoot); fire(fileInput, "change"); assert.equal(fileStatus.textContent, "artifact.zip selected.");
    const numberRoot = node("section", { "data-ui-component": "number-field" }), decrement = node("button", { "data-ui-part": "decrement" }), numberInput = node("input", { type: "number", min: "1", max: "4", step: "1", "data-ui-part": "input" }), increment = node("button", { "data-ui-part": "increment" }); numberInput.value = "3"; numberRoot.append(decrement, numberInput, increment); mount(numberRoot); fire(increment, "click"); assert.equal(numberInput.value, "4"); assert.equal(increment.disabled, true); assert.equal(document.activeElement, numberInput); fire(decrement, "click"); assert.equal(numberInput.value, "3"); assert.equal(increment.disabled, false);
});

test("number field fallback stepping preserves decimal precision", () => {
    const root = node("section", { "data-ui-component": "number-field" }), input = node("input", { type: "number", min: "0", max: "1", step: "0.1", "data-ui-part": "input" }), increment = node("button", { "data-ui-part": "increment" }); input.value = "0.2"; root.append(input, increment); mount(root); fire(increment, "click"); assert.equal(input.value, "0.3");
});

test("autocomplete, checkbox group, lightbox, sortable list, and time field execute their contracts", () => {
    const auto = node("section", { "data-ui-component": "autocomplete" }), autoInput = node("input", { "data-ui-part": "input", role: "combobox" }), autoList = node("ul", { "data-ui-part": "listbox", role: "listbox" }), autoEmpty = node("p", { "data-ui-part": "empty" }), alpha = node("li", { role: "option", id: "auto-alpha", "data-value": "Alpha" }, "Alpha"), beta = node("li", { role: "option", id: "auto-beta", "data-value": "Beta" }, "Beta"); autoList.hidden = true; autoEmpty.hidden = true; autoList.append(alpha, beta); auto.append(autoInput, autoList, autoEmpty); mount(auto); autoInput.focus(); fire(autoInput, "focus"); autoInput.value = "be"; fire(autoInput, "input"); assert.equal(alpha.hidden, true); assert.equal(autoInput.getAttribute("aria-activedescendant"), "auto-beta"); key(autoInput, "Enter"); assert.equal(autoInput.value, "Beta"); autoInput.value = "Custom"; fire(autoInput, "input"); fire(document, "pointerdown"); assert.equal(autoInput.value, "Custom", "autocomplete preserves free-form values");

    const group = node("fieldset", { "data-ui-component": "checkbox-group" }), all = node("input", { "data-ui-part": "all" }), email = node("input", { "data-ui-part": "item", value: "email" }), push = node("input", { "data-ui-part": "item", value: "push" }), groupStatus = node("output", { "data-ui-part": "status" }); email.checked = true; push.checked = false; group.append(all, email, push, groupStatus); mount(group); assert.equal(all.indeterminate, true); assert.equal(all.getAttribute("aria-checked"), "mixed"); all.checked = true; fire(all, "change"); assert.equal(email.checked, true); assert.equal(push.checked, true); assert.equal(groupStatus.textContent, "2 of 2 channels selected.");

    const lightbox = node("section", { "data-ui-component": "lightbox" }), openOne = node("button", { "data-ui-part": "trigger", "data-ui-slide": "0", "aria-controls": "lightbox-panel" }), openTwo = node("button", { "data-ui-part": "trigger", "data-ui-slide": "1", "aria-controls": "lightbox-panel" }), lightboxPanel = node("div", { id: "lightbox-panel", "data-ui-part": "panel" }), previous = node("button", { "data-ui-part": "previous" }), next = node("button", { "data-ui-part": "next" }), lightboxStatus = node("output", { "data-ui-part": "status" }), slideOne = node("figure", { "data-ui-part": "slide" }), slideTwo = node("figure", { "data-ui-part": "slide" }); lightboxPanel.hidden = true; slideTwo.hidden = true; lightboxPanel.append(previous, next, lightboxStatus, slideOne, slideTwo); lightbox.append(openOne, openTwo, lightboxPanel); mount(lightbox); fire(openTwo, "click"); assert.equal(lightboxPanel.hidden, false); assert.equal(slideOne.hidden, true); assert.equal(slideTwo.hidden, false); key(lightboxPanel, "ArrowRight"); assert.equal(slideOne.hidden, false); assert.equal(lightboxStatus.textContent, "Image 1 of 2.");

    const sortable = node("section", { "data-ui-component": "sortable-list" }), list = node("ol", { "data-ui-part": "list" }), sortStatus = node("p", { "data-ui-part": "status" }), itemOne = node("li", { "data-ui-part": "item" }), itemTwo = node("li", { "data-ui-part": "item" }), handleOne = node("button", { "data-ui-part": "handle", "aria-label": "Reorder One", "aria-pressed": "false" }), handleTwo = node("button", { "data-ui-part": "handle", "aria-label": "Reorder Two", "aria-pressed": "false" }); itemOne.append(handleOne); itemTwo.append(handleTwo); list.append(itemOne, itemTwo); sortable.append(list, sortStatus); mount(sortable); key(handleOne, " "); key(handleOne, "ArrowDown"); assert.equal(list.children[1], itemOne); assert.match(sortStatus.textContent, /Moved One to position 2 of 2/);

    const time = node("fieldset", { "data-ui-component": "time-field" }), hour = node("input", { "data-ui-part": "hour" }), minute = node("input", { "data-ui-part": "minute" }), period = node("select", { "data-ui-part": "period" }), timeValue = node("input", { "data-ui-part": "value" }), timeStatus = node("output", { "data-ui-part": "status" }); hour.value = "12"; minute.value = "59"; period.value = "PM"; time.append(hour, minute, period, timeValue, timeStatus); mount(time); key(minute, "ArrowUp"); assert.equal(minute.value, "00"); assert.equal(timeValue.value, "12:00"); assert.equal(timeStatus.textContent, "12:00 PM");
});

test("pointer sorting emits a committed order and canceled drags restore the original order", () => {
    const root = node("section", { "data-ui-component": "sortable-list" }), list = node("ol", { "data-ui-part": "list" }), one = node("li", { "data-ui-part": "item" }), two = node("li", { "data-ui-part": "item" }), oneHandle = node("button", { "data-ui-part": "handle", "aria-label": "Reorder One" }), twoHandle = node("button", { "data-ui-part": "handle", "aria-label": "Reorder Two" }); one.append(oneHandle); two.append(twoHandle); list.append(one, two); root.append(list); let changes = 0; root.addEventListener("mewa-ui:sort-change", () => { changes += 1; }); mount(root);
    fire(one, "dragstart", { dataTransfer: {} }); fire(two, "dragover"); fire(two, "drop"); fire(one, "dragend"); assert.equal(changes, 1); assert.equal(list.children[1], one);
    fire(one, "dragstart", { dataTransfer: {} }); fire(two, "dragover"); fire(one, "dragend"); assert.equal(list.children[1], one, "canceling pointer drag restores the prior DOM order");
});

test("calendar rejects rollover dates and questionnaires permit empty markup", () => {
    const calendar = node("section", { "data-ui-calendar": "", "data-ui-value": "2026-02-30" }), day = node("button", { "data-ui-calendar-day": "", "data-date": "2026-02-30" }); calendar.append(day); mount(calendar); assert.equal(calendar.dataset.uiValue, undefined);
    mount(node("form", { "data-ui-questionnaire": "" }));
});

test("date picker positions, dismisses, and clears global lifecycle state", () => {
    const resizeListeners = listeners(window, "resize"), scrollListeners = listeners(window, "scroll");
    const picker = node("section", { "data-ui-component": "date-picker" }), trigger = node("button", { "data-ui-part": "trigger", "aria-controls": "picker-panel", "aria-expanded": "false" }), panel = node("div", { id: "picker-panel", "data-ui-part": "content" }), calendar = node("section", { "data-ui-calendar": "", "data-ui-value": "2026-06-10" }), day = node("button", { "data-ui-calendar-day": "", "data-date": "2026-06-10", "aria-selected": "true", tabindex: "0" });
    panel.hidden = true; calendar.append(day); panel.append(calendar); picker.append(trigger, panel); mount(picker); fire(trigger, "click");
    assert.equal(panel.hidden, false); assert.equal(panel.style.position, "fixed"); assert.equal(panel.dataset.uiPositioned, "true"); assert.equal(document.activeElement, day);
    fire(document, "pointerdown"); assert.equal(panel.hidden, true); assert.equal(panel.style.position, ""); assert.equal(trigger.getAttribute("aria-expanded"), "false");
    fire(trigger, "click"); window.MewaUI.destroy(picker); assert.equal(panel.hidden, true); assert.equal(panel.dataset.uiPositioned, undefined); assert.equal(listeners(window, "resize"), resizeListeners); assert.equal(listeners(window, "scroll"), scrollListeners);
});

test("calendar skips disabled dates and editable choices dismiss outside", () => {
    const calendar = node("section", { "data-ui-calendar": "", "data-ui-month": "2026-06", "data-ui-disabled-dates": "2026-06-01,2026-06-03" }), days = [1, 2, 3, 4].map((day) => node("button", { "data-ui-calendar-day": "", "data-date": `2026-06-0${day}` })); calendar.append(...days); mount(calendar);
    days[1].focus(); key(days[1], "ArrowRight", { bubbles: true }); assert.equal(document.activeElement, days[3]);
    const combo = node("section", { "data-ui-combobox": "" }), input = node("input", { "data-ui-part": "input", role: "combobox" }), list = node("div", { "data-ui-part": "listbox", role: "listbox" }), option = node("div", { role: "option" }, "Alpha"); list.hidden = true; list.append(option); combo.append(input, list); mount(combo); input.focus(); fire(input, "focus"); assert.equal(list.hidden, false); fire(document, "pointerdown"); assert.equal(list.hidden, true); assert.equal(input.getAttribute("aria-expanded"), "false"); fire(input, "focus"); fire(combo, "focusout", { relatedTarget: document.body }); assert.equal(list.hidden, true);
});

test("tooltip click does not hide a focused description", () => {
    const tooltip = node("section", { "data-ui-component": "tooltip" }), trigger = node("button", { "data-ui-part": "trigger", "aria-controls": "stable-tip" }), panel = node("div", { id: "stable-tip", "data-ui-part": "content" }); panel.hidden = true; tooltip.append(trigger, panel); mount(tooltip); fire(trigger, "focus"); fire(trigger, "click"); assert.equal(panel.hidden, false);
});

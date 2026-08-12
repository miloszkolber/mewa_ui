"use strict";

// This intentionally small DOM is a runtime contract harness, not a browser.
// It executes core-ui.js without a package or browser binary and covers the
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
        this.listeners = {}; this.dataset = {}; this.style = {}; this.hidden = false; this.inert = false; this.tabIndex = 0;
        this.textContent = ""; this.value = ""; this.clientHeight = 100; this.scrollHeight = 200; this.scrollTop = 0; this.rect = { width: 100 };
        Object.entries(attributes).forEach(([name, value]) => this.setAttribute(name, value));
    }
    setAttribute(name, value) { value = String(value); this.attributes.set(name, value); if (name.startsWith("data-")) this.dataset[dataName(name.slice(5))] = value; if (name === "id") this.id = value; if (name === "for") this.htmlFor = value; }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    removeAttribute(name) { this.attributes.delete(name); if (name.startsWith("data-")) delete this.dataset[dataName(name.slice(5))]; }
    append(...nodes) { nodes.forEach((node) => { if (node.parentElement) node.remove(); node.parentElement = this; this.children.push(node); }); }
    remove() { if (this.parentElement) this.parentElement.children.splice(this.parentElement.children.indexOf(this), 1); this.parentElement = null; }
    get firstElementChild() { return this.children[0] || null; }
    get tBodies() { return this.children.filter((node) => node.tagName === "TBODY"); }
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
    checkValidity() { return !this.required || Boolean(this.value); } reportValidity() { this.reported = true; }
}
class Document extends Element {
    constructor() { super("#document"); this.readyState = "complete"; this.documentElement = new Element("html"); this.body = new Element("body"); this.documentElement.append(this.body); this.append(this.documentElement); this.activeElement = this.body; }
    getElementById(id) { return this.querySelector(`#${id}`); }
}
const document = new Document();
const window = { document };
global.document = document;
function node(tag, attributes, text) { const result = new Element(tag, attributes); result.textContent = text || ""; return result; }
function fire(target, type, init) { const event = new EventLike(type, init); target.dispatchEvent(event); return event; }
function key(target, value, extra) { return fire(target, "keydown", { key: value, ...extra }); }
function mount(root) { document.body.append(root); window.CoreUI.enhance(root); return root; }

vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "core-ui.js"), "utf8"), { window, document, CustomEvent: EventLike, MutationObserver: class { observe() {} disconnect() {} }, console });

function test(name, run) { try { run(); console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}\n${error.stack}`); process.exitCode = 1; } }

test("disclosure and tabs wire triggers, panels, and arrow selection", () => {
    const disclosure = node("section", { "data-ui-disclosure": "" }), trigger = node("button", { "data-ui-part": "trigger", "aria-controls": "details", "aria-expanded": "false" }), panel = node("div", { id: "details" }); panel.hidden = true; disclosure.append(trigger, panel); mount(disclosure); fire(trigger, "click"); assert.equal(panel.hidden, false); assert.equal(trigger.getAttribute("aria-expanded"), "true");
    const tabs = node("section", { "data-ui-tabs": "" }), one = node("button", { role: "tab", "aria-controls": "one" }), two = node("button", { role: "tab", "aria-controls": "two" }), first = node("div", { id: "one" }), second = node("div", { id: "two" }); tabs.append(one, two, first, second); mount(tabs); key(one, "ArrowRight"); assert.equal(two.getAttribute("aria-selected"), "true"); assert.equal(first.hidden, true); assert.equal(document.activeElement, two);
});

test("modal restores focus and popup tooltip opens and closes", () => {
    const dialog = node("section", { "data-ui-dialog": "" }), opener = node("button", { "data-ui-part": "trigger", "aria-controls": "modal" }), modal = node("div", { id: "modal" }), close = node("button", { "data-ui-close": "" }); modal.hidden = true; modal.append(close); dialog.append(opener, modal); mount(dialog); fire(opener, "click"); assert.equal(modal.hidden, false); assert.equal(document.documentElement.dataset.coreUiModalOpen, "true"); assert.equal(document.activeElement, close); key(modal, "Escape"); assert.equal(modal.hidden, true); assert.equal(document.activeElement, opener);
    const tooltip = node("section", { "data-ui-component": "tooltip" }), tipTrigger = node("button", { "data-ui-part": "trigger", "aria-controls": "tip" }), tip = node("div", { id: "tip" }); tip.hidden = true; tooltip.append(tipTrigger, tip); mount(tooltip); fire(tipTrigger, "focus"); assert.equal(tip.hidden, false); fire(tipTrigger, "blur"); assert.equal(tip.hidden, true);
});

test("combobox filters and selects with keys, calendar moves selection, carousel changes state", () => {
    const combo = node("section", { "data-ui-combobox": "" }), input = node("input", { "data-ui-part": "input", role: "combobox" }), list = node("div", { "data-ui-part": "listbox", role: "listbox" }), alpha = node("div", { role: "option", id: "alpha" }, "Alpha"), beta = node("div", { role: "option", id: "beta" }, "Beta"); list.hidden = true; list.append(alpha, beta); combo.append(input, list); mount(combo); input.value = "bet"; fire(input, "input"); assert.equal(alpha.hidden, true); key(input, "ArrowDown"); key(input, "Enter"); assert.equal(input.value, "Beta"); assert.equal(list.hidden, true);
    const calendar = node("section", { "data-ui-calendar": "" }), days = [1, 2, 3].map((day) => node("button", { "data-ui-calendar-day": "", "aria-label": String(day) }, String(day))); calendar.append(...days); mount(calendar); key(days[0], "ArrowRight"); assert.equal(days[1].getAttribute("aria-selected"), "true");
    const carousel = node("section", { "data-ui-carousel": "" }), previous = node("button", { "data-ui-part": "previous" }), next = node("button", { "data-ui-part": "next" }), slides = ["a", "b"].map((value) => node("div", { "data-ui-carousel-slide": "" }, value)); carousel.append(previous, next, ...slides); mount(carousel); fire(next, "click"); assert.equal(slides[1].getAttribute("aria-hidden"), "false"); fire(previous, "click"); assert.equal(slides[0].getAttribute("aria-hidden"), "false");
});

test("OTP, resizable, toggle group, toast, and sidebar execute their hooks", () => {
    const otp = node("section", { "data-ui-otp": "" }), slots = [node("input"), node("input")]; otp.append(...slots); mount(otp); slots[0].value = "12"; fire(slots[0], "input"); assert.equal(slots[0].value, "2"); assert.equal(document.activeElement, slots[1]); fire(slots[1], "paste", { clipboardData: { getData: () => "34" } }); assert.deepEqual(slots.map((slot) => slot.value), ["2", "3"]);
    const resize = node("section", { "data-ui-resizable": "" }), handle = node("button", { "data-ui-part": "handle", "aria-valuemin": "0", "aria-valuemax": "100" }), pane = node("div", { "data-ui-part": "panel" }); resize.rect.width = 200; pane.rect.width = 100; resize.append(handle, pane); mount(resize); key(handle, "ArrowRight"); assert.equal(handle.getAttribute("aria-valuenow"), "58");
    const group = node("section", { "data-ui-toggle-group": "" }), left = node("button", { "data-ui-toggle": "", "data-ui-part": "trigger", "aria-pressed": "false" }), right = node("button", { "data-ui-toggle": "", "data-ui-part": "trigger", "aria-pressed": "false" }); group.append(left, right); mount(group); fire(left, "click"); fire(right, "click"); assert.equal(left.getAttribute("aria-pressed"), "false"); assert.equal(right.getAttribute("aria-pressed"), "true");
    const toastRoot = node("section", { "data-ui-toast": "" }), toastTrigger = node("button", { "data-ui-part": "trigger" }), region = node("div", { "data-ui-part": "region" }), toast = node("div", { "data-ui-part": "toast" }), dismiss = node("button", { "data-ui-close": "" }); toast.append(dismiss); toastRoot.append(toastTrigger, region, toast); mount(toastRoot); fire(toastTrigger, "click"); assert.equal(toast.hidden, false); fire(dismiss, "click"); assert.equal(toast.parentElement, null);
    const sidebar = node("section", { "data-ui-sidebar": "" }), sidebarButton = node("button", { "data-ui-part": "trigger", "aria-expanded": "false" }), sidebarPanel = node("aside", { "data-ui-part": "panel" }); sidebarPanel.hidden = true; sidebar.append(sidebarButton, sidebarPanel); mount(sidebar); fire(sidebarButton, "click"); assert.equal(sidebarPanel.hidden, false);
});

test("data table filtering and sorting, questionnaire steps, and message jump work", () => {
    const tableRoot = node("section", { "data-ui-table": "" }), filter = node("input", { "data-ui-filter": "" }), table = node("table"), header = node("thead"), headerRow = node("tr"), sort = node("th", { "aria-sort": "none" }, "Name"), body = node("tbody"); headerRow.append(sort); header.append(headerRow); const rowB = node("tr", {}, "Bravo"), rowA = node("tr", {}, "Alpha"); rowB.append(node("td", {}, "Bravo")); rowA.append(node("td", {}, "Alpha")); body.append(rowB, rowA); table.append(header, body); tableRoot.append(filter, table); mount(tableRoot); fire(sort, "click"); assert.equal(body.children[0], rowA); filter.value = "bravo"; fire(filter, "input"); assert.equal(rowA.hidden, true); assert.equal(rowB.hidden, false);
    const questionnaire = node("section", { "data-ui-questionnaire": "" }), stepOne = node("div", { "data-ui-question": "" }), stepTwo = node("div", { "data-ui-question": "" }), next = node("button", { "data-ui-question-next": "" }), progress = node("output", { "data-ui-part": "progress" }); stepTwo.hidden = true; questionnaire.append(stepOne, stepTwo, next, progress); mount(questionnaire); fire(next, "click"); assert.equal(stepOne.hidden, true); assert.equal(stepTwo.hidden, false); assert.equal(progress.textContent, "Step 2 of 2");
    const scroller = node("section", { "data-ui-message-scroller": "" }), list = node("div", { "data-ui-part": "list" }), jump = node("button", { "data-ui-jump": "" }); list.scrollTop = 0; list.scrollHeight = 500; list.clientHeight = 100; scroller.append(list, jump); mount(scroller); assert.equal(jump.hidden, false); fire(jump, "click"); assert.equal(list.scrollTop, 500); assert.equal(jump.hidden, true);
});

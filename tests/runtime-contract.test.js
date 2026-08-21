"use strict";

// This is a dependency-free runtime contract for the current component modules.
// It uses a deliberately small DOM implementation so the optional enhancements
// can be exercised in Node without a browser binary or a package dependency.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const componentsDir = path.join(root, "components");

function dataProperty(name) {
  return name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function dataAttribute(name) {
  return `data-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function splitSelectorList(selector) {
  const result = [];
  let current = "";
  let brackets = 0;
  let parentheses = 0;

  for (const character of selector) {
    if (character === "[") brackets += 1;
    if (character === "]") brackets -= 1;
    if (character === "(") parentheses += 1;
    if (character === ")") parentheses -= 1;
    if (character === "," && brackets === 0 && parentheses === 0) {
      if (current.trim()) result.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  if (current.trim()) result.push(current.trim());
  return result;
}

function tokenizeSelector(selector) {
  const tokens = [];
  let current = "";
  let brackets = 0;
  let parentheses = 0;
  let pendingRelation = null;
  let sawSpace = false;

  const flush = () => {
    const simple = current.trim();
    if (!simple) return;
    tokens.push({
      simple,
      relation: tokens.length === 0 ? null : pendingRelation || (sawSpace ? " " : " ")
    });
    current = "";
    pendingRelation = null;
    sawSpace = false;
  };

  for (const character of selector.trim()) {
    if (character === "[") brackets += 1;
    if (character === "]") brackets -= 1;
    if (character === "(") parentheses += 1;
    if (character === ")") parentheses -= 1;

    if (brackets === 0 && parentheses === 0 && character === ">") {
      flush();
      pendingRelation = ">";
      sawSpace = false;
    } else if (brackets === 0 && parentheses === 0 && /\s/.test(character)) {
      if (current.trim()) flush();
      sawSpace = true;
    } else {
      if (sawSpace && tokens.length && !pendingRelation && !current) pendingRelation = " ";
      sawSpace = false;
      current += character;
    }
  }
  flush();
  return tokens;
}

function attributeMatches(element, expression) {
  const match = expression.trim().match(/^([\w:-]+)\s*(?:(\^=|=)\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?$/);
  if (!match) return false;
  const actual = element.getAttribute(match[1]);
  if (actual === null) return false;
  const expected = match[3] ?? match[4] ?? match[5];
  if (!match[2]) return true;
  return match[2] === "^=" ? actual.startsWith(expected) : actual === expected;
}

function matchesSimple(element, selector, scope) {
  let simple = selector.trim();
  const notSelectors = [];
  simple = simple.replace(/:not\(([^()]*)\)/g, (_, value) => {
    notSelectors.push(value);
    return "";
  });
  if (notSelectors.some((value) => matchesSelector(element, value, scope))) return false;

  if (simple.includes(":scope")) {
    if (element !== scope) return false;
    simple = simple.replaceAll(":scope", "");
  }

  const tag = simple.match(/^[a-z][\w-]*/i);
  if (tag && element.tagName.toLowerCase() !== tag[0].toLowerCase()) return false;
  if (simple.startsWith("*") === false && !tag && !/[.#\[]/.test(simple)) return false;

  for (const match of simple.matchAll(/#([\w-]+)/g)) {
    if (element.id !== match[1]) return false;
  }
  for (const match of simple.matchAll(/\.([\w-]+)/g)) {
    if (!element.classList.contains(match[1])) return false;
  }
  for (const match of simple.matchAll(/\[([^\]]+)\]/g)) {
    if (!attributeMatches(element, match[1])) return false;
  }
  return true;
}

function matchesSelector(element, selector, scope = element.parentElement) {
  return splitSelectorList(selector).some((part) => {
    const tokens = tokenizeSelector(part);
    if (!tokens.length) return false;

    const matchAt = (candidate, index) => {
      if (!candidate || !matchesSimple(candidate, tokens[index].simple, scope)) return false;
      if (index === 0) return true;

      if (tokens[index].relation === ">") return matchAt(candidate.parentElement, index - 1);
      for (let parent = candidate.parentElement; parent; parent = parent.parentElement) {
        if (matchAt(parent, index - 1)) return true;
      }
      return false;
    };

    return matchAt(element, tokens.length - 1);
  });
}

class EventLike {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = Boolean(init.bubbles);
    this.cancelable = init.cancelable !== false;
    this.defaultPrevented = false;
    this.target = null;
    this.currentTarget = null;
    this.propagationStopped = false;
    Object.assign(this, init, { type });
  }

  preventDefault() {
    if (this.cancelable) this.defaultPrevented = true;
  }

  stopPropagation() {
    this.propagationStopped = true;
  }
}

class WindowLike {
  constructor() {
    this.listeners = {};
    this.innerWidth = 1024;
    this.innerHeight = 768;
  }

  addEventListener(type, listener) {
    (this.listeners[type] ||= []).push(listener);
  }

  removeEventListener(type, listener) {
    this.listeners[type] = (this.listeners[type] || []).filter((entry) => entry !== listener);
  }

  dispatchEvent(event) {
    event.target ||= this;
    (this.listeners[event.type] || []).slice().forEach((listener) => listener.call(this, event));
    return !event.defaultPrevented;
  }
}

class Element {
  constructor(tag = "div", attributes = {}) {
    this.tagName = tag.toUpperCase();
    this.attributes = new Map();
    this.children = [];
    this.parentElement = null;
    this.ownerDocument = null;
    this.listeners = {};
    this._dataset = Object.create(null);
    this.dataset = new Proxy(this._dataset, {
      set: (target, property, value) => {
        target[property] = String(value);
        if (typeof property === "string") this.attributes.set(dataAttribute(property), String(value));
        return true;
      },
      deleteProperty: (target, property) => {
        delete target[property];
        if (typeof property === "string") this.attributes.delete(dataAttribute(property));
        return true;
      }
    });
    this.style = {};
    this._text = "";
    this._hidden = false;
    this.value = "";
    this.checked = false;
    this.indeterminate = false;
    this.disabled = false;
    this.required = false;
    this.validationMessage = "";
    this.reported = false;
    this.tabIndex = 0;
    this.clientHeight = 100;
    this.scrollHeight = 200;
    this.scrollTop = 0;
    this.rect = { width: 100, height: 100, left: 0, top: 0, right: 100, bottom: 100 };
    this._pointerCapture = new Set();
    this.classList = {
      add: (...names) => {
        const values = new Set(this.className.split(/\s+/).filter(Boolean));
        names.forEach((name) => values.add(name));
        this.className = Array.from(values).join(" ");
      },
      remove: (...names) => {
        const removed = new Set(names);
        this.className = this.className.split(/\s+/).filter((name) => name && !removed.has(name)).join(" ");
      },
      contains: (name) => this.className.split(/\s+/).filter(Boolean).includes(name),
      toggle: (name, force) => {
        const shouldAdd = force === undefined ? !this.classList.contains(name) : Boolean(force);
        if (shouldAdd) this.classList.add(name);
        else this.classList.remove(name);
        return shouldAdd;
      }
    };

    Object.defineProperty(this, "hidden", {
      get: () => this._hidden,
      set: (value) => {
        this._hidden = Boolean(value);
        if (this._hidden) this.attributes.set("hidden", "");
        else this.attributes.delete("hidden");
      }
    });
    Object.defineProperty(this, "className", {
      get: () => this.getAttribute("class") || "",
      set: (value) => this.setAttribute("class", value)
    });

    Object.entries(attributes).forEach(([name, value]) => this.setAttribute(name, value));
    if (this.hasAttribute("hidden")) this._hidden = true;
    if (this.hasAttribute("value")) this.value = this.getAttribute("value");
    if (this.hasAttribute("checked")) this.checked = true;
    if (this.hasAttribute("disabled")) this.disabled = true;
    if (this.hasAttribute("required")) this.required = true;
  }

  setAttribute(name, value) {
    const normalized = String(name);
    const stringValue = String(value);
    this.attributes.set(normalized, stringValue);
    if (normalized.startsWith("data-")) this._dataset[dataProperty(normalized)] = stringValue;
    if (normalized === "id") this.id = stringValue;
    if (normalized === "for") this.htmlFor = stringValue;
    if (normalized === "hidden") this._hidden = true;
    if (normalized === "disabled") this.disabled = true;
    if (normalized === "required") this.required = true;
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name.startsWith("data-")) delete this._dataset[dataProperty(name)];
    if (name === "id") this.id = "";
    if (name === "hidden") this._hidden = false;
    if (name === "disabled") this.disabled = false;
    if (name === "required") this.required = false;
  }

  append(...nodes) {
    nodes.forEach((node) => {
      if (node.parentElement) node.remove();
      node.parentElement = this;
      node.setOwnerDocument(this.ownerDocument || (this.tagName === "#DOCUMENT" ? this : null));
      this.children.push(node);
      notifyMutation(this, [node]);
    });
  }

  appendChild(node) {
    this.append(node);
    return node;
  }

  insertBefore(node, reference) {
    if (node.parentElement) node.remove();
    node.parentElement = this;
    node.setOwnerDocument(this.ownerDocument || (this.tagName === "#DOCUMENT" ? this : null));
    const index = reference ? this.children.indexOf(reference) : -1;
    if (index < 0) this.children.push(node);
    else this.children.splice(index, 0, node);
    notifyMutation(this, [node]);
    return node;
  }

  remove() {
    if (!this.parentElement) return;
    const parent = this.parentElement;
    parent.children.splice(parent.children.indexOf(this), 1);
    this.parentElement = null;
  }

  setOwnerDocument(document) {
    this.ownerDocument = document;
    this.children.forEach((child) => child.setOwnerDocument(document));
  }

  get firstElementChild() {
    return this.children[0] || null;
  }

  get tBodies() {
    return this.children.filter((child) => child.tagName === "TBODY");
  }

  get rows() {
    return this.children.filter((child) => child.tagName === "TR");
  }

  get cells() {
    return this.children.filter((child) => child.tagName === "TD" || child.tagName === "TH");
  }

  get isConnected() {
    return Boolean(this.ownerDocument && this.ownerDocument.contains(this));
  }

  get textContent() {
    return this.children.length ? this.children.map((child) => child.textContent).join("") : this._text;
  }

  set textContent(value) {
    this.children = [];
    this._text = String(value);
  }

  contains(node) {
    for (let current = node; current; current = current.parentElement) {
      if (current === this) return true;
    }
    return false;
  }

  matches(selector) {
    return matchesSelector(this, selector, this.parentElement || this);
  }

  closest(selector) {
    for (let current = this; current; current = current.parentElement) {
      if (current.matches(selector)) return current;
    }
    return null;
  }

  querySelectorAll(selector) {
    const result = [];
    const visit = (node) => {
      node.children.forEach((child) => {
        if (matchesSelector(child, selector, this)) result.push(child);
        visit(child);
      });
    };
    visit(this);
    return result;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  addEventListener(type, listener, options = {}) {
    (this.listeners[type] ||= []).push({ listener, options });
  }

  removeEventListener(type, listener) {
    this.listeners[type] = (this.listeners[type] || []).filter((entry) => entry.listener !== listener);
  }

  dispatchEvent(event) {
    event.target ||= this;
    event.currentTarget = this;
    (this.listeners[event.type] || []).slice().forEach((entry) => {
      entry.listener.call(this, event);
      if (entry.options.once) this.removeEventListener(event.type, entry.listener);
    });
    if (event.bubbles && !event.propagationStopped && this.parentElement) this.parentElement.dispatchEvent(event);
    return !event.defaultPrevented;
  }

  focus() {
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }

  getBoundingClientRect() {
    return this.rect;
  }

  setPointerCapture(pointerId) {
    this._pointerCapture.add(pointerId);
  }

  releasePointerCapture(pointerId) {
    this._pointerCapture.delete(pointerId);
  }

  hasPointerCapture(pointerId) {
    return this._pointerCapture.has(pointerId);
  }

  setCustomValidity(message) {
    this.validationMessage = String(message);
  }

  checkValidity() {
    if (this.disabled) return true;
    if (this.validationMessage) return false;
    return !this.required || Boolean(String(this.value || "").trim());
  }

  reportValidity() {
    this.reported = true;
    return this.checkValidity();
  }

  get validity() {
    return { valid: this.checkValidity() };
  }

  get willValidate() {
    return !this.disabled;
  }
}

class Document extends Element {
  constructor() {
    super("#document");
    this.ownerDocument = this;
    this._mutationObservers = new Set();
    this.documentElement = new Element("html");
    this.body = new Element("body");
    this.append(this.documentElement);
    this.documentElement.append(this.body);
    this.activeElement = this.body;
    this.readyState = "complete";
  }

  createElement(tag) {
    const element = new Element(tag);
    element.setOwnerDocument(this);
    return element;
  }

  getElementById(id) {
    return this.querySelector(`#${id}`);
  }
}

function notifyMutation(target, addedNodes) {
  const document = target.ownerDocument;
  if (!document?._mutationObservers) return;
  const record = { type: "childList", target, addedNodes };
  document._mutationObservers.forEach((observer) => {
    const observesTarget = observer.target === target;
    const observesSubtree = observer.options.subtree && observer.target.contains(target);
    if (observer.options.childList && (observesTarget || observesSubtree)) observer.callback([record], observer);
  });
}

function createRuntime() {
  const document = new Document();
  const window = new WindowLike();
  window.document = document;

  class MutationObserverLike {
    constructor(callback) {
      this.callback = callback;
      this.target = null;
      this.options = {};
    }

    observe(target, options = {}) {
      this.target = target;
      this.options = options;
      document._mutationObservers.add(this);
    }

    disconnect() {
      document._mutationObservers.delete(this);
      this.target = null;
    }
  }

  class ResizeObserverLike {
    constructor(callback) {
      this.callback = callback;
    }

    observe() {}
    disconnect() {}
  }

  const context = {
    document,
    window,
    Event: EventLike,
    CustomEvent: EventLike,
    MutationObserver: MutationObserverLike,
    ResizeObserver: ResizeObserverLike,
    queueMicrotask: (callback) => callback(),
    console
  };
  return { document, window, context };
}

function node(tag, attributes = {}, text) {
  const element = new Element(tag, attributes);
  if (text !== undefined) element.textContent = text;
  return element;
}

function fire(target, type, init = {}) {
  const event = new EventLike(type, { bubbles: init.bubbles ?? true, ...init });
  target.dispatchEvent(event);
  return event;
}

function key(target, value, extra = {}) {
  return fire(target, "keydown", { key: value, ...extra });
}

function listeners(target, type) {
  return (target.listeners[type] || []).length;
}

function loadModule(slug, componentRoot) {
  const runtime = createRuntime();
  runtime.document.body.append(componentRoot);
  const filename = path.join(componentsDir, slug, `${slug}.js`);
  const source = fs.readFileSync(filename, "utf8");
  new vm.Script(source, { filename }).runInNewContext(runtime.context);
  return { ...runtime, root: componentRoot };
}

let failures = 0;

function test(name, callback) {
  try {
    callback();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}\n  ${error.message}`);
  }
}

test("canonical enhancement modules are present and parse as browser scripts", () => {
  const files = fs.readdirSync(componentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(componentsDir, entry.name, `${entry.name}.js`))
    .filter((filename) => fs.existsSync(filename));

  assert(files.length > 0, "expected current component modules");
  files.forEach((filename) => {
    assert.doesNotThrow(
      () => new vm.Script(fs.readFileSync(filename, "utf8"), { filename }),
      filename
    );
  });
});

test("checkbox groups coordinate select-all state and disabled items", () => {
  const group = node("fieldset", { class: "checkbox-group", "data-checkbox-group": "" });
  const selectAll = node("input", { class: "checkbox", type: "checkbox", "data-checkbox-all": "" });
  const email = node("input", { class: "checkbox", type: "checkbox", "data-checkbox-item": "", value: "email" });
  const push = node("input", { class: "checkbox", type: "checkbox", "data-checkbox-item": "", value: "push" });
  const disabled = node("input", { class: "checkbox", type: "checkbox", "data-checkbox-item": "", value: "sms", disabled: "" });
  const status = node("output", { class: "checkbox-group-status", "data-checkbox-status": "" });
  email.checked = true;
  push.checked = false;
  disabled.checked = false;
  group.append(selectAll, email, push, disabled, status);
  const runtime = loadModule("checkbox", group);
  const changes = [];
  group.addEventListener("checkbox-group:change", (event) => changes.push(event.detail));

  assert.equal(group.dataset.state, "partial");
  assert.equal(selectAll.indeterminate, true);
  assert.equal(status.textContent, "1 of 2 options selected.");
  selectAll.checked = true;
  fire(selectAll, "change");
  assert.equal(email.checked, true);
  assert.equal(push.checked, true);
  assert.equal(disabled.checked, false);
  assert.equal(group.dataset.state, "complete");
  assert.equal(status.textContent, "2 of 2 options selected.");
  assert.deepEqual(Array.from(changes[0].values), ["email", "push"]);
  assert.equal(changes[0].selected, 2);
  assert.equal(changes[0].total, 2);
  assert.equal(changes[0].source, "select-all");
  assert.equal(runtime.document.activeElement, runtime.document.body);
});

test("time fields normalize segments, serialize canonical time, and step minutes", () => {
  const field = node("fieldset", { class: "time-field" });
  const hour = node("input", { class: "time-field-input", "data-time-part": "hour" });
  const minute = node("input", { class: "time-field-input", "data-time-part": "minute" });
  const period = node("select", { class: "time-field-select", "data-time-part": "period" });
  const submitted = node("input", { type: "hidden", "data-time-part": "value", disabled: "" });
  const status = node("output", { class: "time-field-status", "data-time-part": "status" });
  hour.value = "11";
  minute.value = "59";
  period.value = "PM";
  field.append(hour, minute, period, submitted, status);
  const runtime = loadModule("time-field", field);

  assert.equal(submitted.disabled, false);
  assert.equal(submitted.value, "23:59");
  assert.equal(status.textContent, "11:59 PM");
  const event = key(minute, "ArrowUp");
  assert.equal(event.defaultPrevented, true);
  assert.equal(minute.value, "00");
  assert.equal(submitted.value, "23:00");
  assert.equal(status.textContent, "11:00 PM");
  minute.value = "x4";
  fire(minute, "input");
  assert.equal(minute.value, "4");
  assert.equal(runtime.document.activeElement, runtime.document.body);
});

test("questionnaires validate before advancing and update native step state", () => {
  const questionnaire = node("form", { class: "questionnaire", "data-questionnaire": "" });
  const first = node("fieldset", { class: "questionnaire-step", "data-questionnaire-step": "" });
  const second = node("fieldset", { class: "questionnaire-step", "data-questionnaire-step": "" });
  const required = node("input", { required: "", name: "goal" });
  const back = node("button", { type: "button", "data-questionnaire-back": "" });
  const next = node("button", { type: "button", "data-questionnaire-next": "" });
  const submit = node("button", { type: "submit", "data-questionnaire-submit": "" });
  const progress = node("output", { class: "questionnaire-progress", "data-questionnaire-progress": "" });
  first.append(required);
  first.hidden = false;
  second.hidden = false;
  questionnaire.append(first, second, back, next, submit, progress);
  const runtime = loadModule("questionnaire", questionnaire);

  assert.equal(first.hidden, false);
  assert.equal(second.hidden, true);
  assert.equal(back.hidden, true);
  assert.equal(back.disabled, true);
  assert.equal(submit.hidden, true);
  assert.equal(progress.textContent, "Step 1 of 2");
  const invalid = fire(next, "click");
  assert.equal(invalid.defaultPrevented, true);
  assert.equal(required.reported, true);
  assert.equal(first.hidden, false);

  required.value = "collaborate";
  fire(next, "click");
  assert.equal(first.hidden, true);
  assert.equal(second.hidden, false);
  assert.equal(back.disabled, false);
  assert.equal(next.hidden, true);
  assert.equal(submit.hidden, false);
  assert.equal(progress.textContent, "Step 2 of 2");
  assert.equal(runtime.document.activeElement, second);
  fire(back, "click");
  assert.equal(first.hidden, false);
  assert.equal(second.hidden, true);
  assert.equal(progress.textContent, "Step 1 of 2");
});

test("message scrollers follow the latest message and append valid submissions", () => {
  const scroller = node("section", { class: "message-scroller", "data-message-author": "You" });
  const viewport = node("div", { class: "message-scroller-viewport", "data-message-part": "viewport", role: "log" });
  const messages = node("ol", { class: "message-scroller-messages", "data-message-part": "messages" });
  const jump = node("button", { class: "message-scroller-jump", "data-message-part": "jump", type: "button" });
  const status = node("p", { class: "message-scroller-status", "data-message-part": "status" });
  const composer = node("form", { class: "message-scroller-composer", "data-message-part": "composer" });
  const textarea = node("textarea", { required: "" });
  const existing = node("li", {}, "Existing message");
  viewport.clientHeight = 100;
  viewport.scrollHeight = 500;
  jump.hidden = true;
  messages.append(existing);
  composer.append(textarea);
  scroller.append(viewport, messages, jump, status, composer);
  const runtime = loadModule("message-scroller", scroller);

  assert.equal(viewport.scrollTop, 500);
  assert.equal(scroller.dataset.state, "latest");
  assert.equal(jump.hidden, true);
  viewport.scrollTop = 100;
  fire(viewport, "scroll");
  assert.equal(scroller.dataset.state, "unread");
  assert.equal(jump.hidden, false);
  assert.equal(status.textContent, "You are viewing older messages.");
  textarea.value = "  Follow up  ";
  const submitted = fire(composer, "submit");
  assert.equal(submitted.defaultPrevented, true);
  assert.equal(messages.children.length, 2);
  assert.equal(messages.children[1].querySelector("p").textContent, "Follow up");
  assert.equal(textarea.value, "");
  assert.equal(viewport.scrollTop, 100);
  assert.equal(jump.hidden, false);
  assert.equal(status.textContent, "New messages are available. Jump to latest.");
  fire(jump, "click");
  assert.equal(viewport.scrollTop, 500);
  assert.equal(jump.hidden, true);
  assert.equal(status.textContent, "You are viewing the latest messages.");
  assert.equal(runtime.document.activeElement, runtime.document.body);
});

test("data tables filter, sort, announce counts, and clear through native controls", () => {
  const tableRoot = node("section", { class: "data-table" });
  const filter = node("input", { class: "data-table-filter", "data-table-filter": "" });
  const status = node("p", {
    class: "data-table-summary",
    "data-table-status": "",
    "data-singular": "project",
    "data-plural": "projects",
    role: "status"
  });
  const range = node("p", { class: "data-table-range", "data-table-range": "", "data-range-label": "projects" });
  const clear = node("button", { type: "button", "data-table-clear": "" });
  const table = node("table");
  const head = node("thead");
  const headingRow = node("tr");
  const heading = node("th", { "aria-sort": "none" });
  const sort = node("button", { type: "button", class: "data-table-sort", "data-table-sort": "" }, "Project");
  const body = node("tbody");
  const bravo = node("tr");
  const alpha = node("tr");
  bravo.append(node("td", {}, "Bravo"));
  alpha.append(node("td", {}, "Alpha"));
  heading.append(sort);
  headingRow.append(heading);
  head.append(headingRow);
  body.append(bravo, alpha);
  table.append(head, body);
  const empty = node("p", { class: "data-table-empty", "data-table-empty": "" });
  empty.hidden = true;
  tableRoot.append(filter, status, range, clear, table, empty);
  const runtime = loadModule("data-table", tableRoot);

  fire(sort, "click");
  assert.equal(body.children[0], alpha);
  assert.equal(heading.getAttribute("aria-sort"), "ascending");
  assert.equal(status.textContent, "2 projects");
  assert.equal(range.textContent, "Showing 1–2 of 2 projects");
  filter.value = "bravo";
  fire(filter, "input");
  assert.equal(alpha.hidden, true);
  assert.equal(bravo.hidden, false);
  assert.equal(empty.hidden, true);
  assert.equal(status.textContent, "1 project");
  filter.value = "missing";
  fire(filter, "input");
  assert.equal(empty.hidden, false);
  assert.equal(range.textContent, "Showing 0 of 2 projects");
  fire(clear, "click");
  assert.equal(filter.value, "");
  assert.equal(alpha.hidden, false);
  assert.equal(bravo.hidden, false);
  assert.equal(runtime.document.activeElement, filter);
});

test("resizable panels respond to keyboard and pointer separator changes", () => {
  const resizable = node("section", { class: "resizable" });
  const group = node("div", { class: "resizable-group", "data-orientation": "vertical" });
  const first = node("aside", { class: "resizable-panel" });
  const handle = node("button", {
    class: "resizable-handle",
    type: "button",
    role: "separator",
    "aria-orientation": "vertical",
    "aria-valuemin": "20",
    "aria-valuemax": "80",
    "aria-valuenow": "50",
    "data-value-label": "Files"
  });
  const second = node("article", { class: "resizable-panel" });
  const output = node("output", {});
  group.rect.width = 200;
  first.rect.width = 100;
  group.append(first, handle, second);
  resizable.append(group, output);
  const runtime = loadModule("resizable", resizable);
  const changes = [];
  resizable.addEventListener("resizable-change", (event) => changes.push(event.detail));

  assert.equal(first.style.flexBasis, "100px");
  assert.equal(output.textContent, "Files: 50 percent");
  key(handle, "ArrowRight");
  assert.equal(handle.getAttribute("aria-valuenow"), "51");
  assert.equal(first.style.flexBasis, "102px");
  assert.equal(changes[0].source, "keyboard");
  key(handle, "Home");
  assert.equal(handle.getAttribute("aria-valuenow"), "20");
  assert.equal(first.style.flexBasis, "40px");

  fire(handle, "pointerdown", { button: 0, clientX: 10, pointerId: 1, isPrimary: true });
  assert.equal(resizable.hasAttribute("data-resizing"), true);
  fire(handle, "pointermove", { clientX: 30, pointerId: 1 });
  assert.equal(first.style.flexBasis, "120px");
  fire(handle, "pointercancel", { pointerId: 1 });
  assert.equal(resizable.hasAttribute("data-resizing"), false);
  assert.equal(listeners(handle, "pointermove"), 0);
  assert.equal(listeners(handle, "pointerup"), 0);
  assert.equal(listeners(handle, "pointercancel"), 0);
  assert.equal(runtime.document.activeElement, runtime.document.body);
});

if (failures) process.exitCode = 1;

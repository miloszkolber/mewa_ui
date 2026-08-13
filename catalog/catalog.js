(() => {
    "use strict";

    const catalogUrl = "/ui/catalog/components.json";
    const snippetsBaseUrl = "/ui/snippets/";
    const sourceStart = "<!-- mewa-ui-snippet:start -->";
    const sourceEnd = "<!-- mewa-ui-snippet:end -->";
    const elements = {
        count: document.querySelector("#component-count"),
        search: document.querySelector("#component-search"),
        list: document.querySelector("#component-list"),
        detail: document.querySelector(".ui-catalog-detail"),
        title: document.querySelector("#component-title"),
        description: document.querySelector("#component-description"),
        preview: document.querySelector("#component-preview"),
        source: document.querySelector("#component-source code"),
        copy: document.querySelector("#copy-source"),
        copyStatus: document.querySelector("#copy-status")
    };
    let components = [];
    let selectedSlug = "";
    let sourceRequest;

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
    }

    function previewDocument(component, fragment) {
        return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(component.name)} preview</title><link rel="stylesheet" href="/ui/src/base.css"><link rel="stylesheet" href="/ui/src/components.css"><script src="/ui/src/components.js" defer><\/script></head><body class="ui-demo ui-demo-preview">${fragment}</body></html>`;
    }

    function resizePreview() {
        try {
            const height = elements.preview.contentDocument?.documentElement.scrollHeight || 0;
            elements.preview.style.height = `${Math.max(256, Math.min(960, height))}px`;
        } catch (error) {
            elements.preview.style.height = "16rem";
        }
    }

    function snippetUrl(slug) {
        return new URL(`${slug}.html`, new URL(snippetsBaseUrl, window.location.origin)).pathname;
    }

    function extractMarkedFragment(documentSource) {
        const start = documentSource.indexOf(sourceStart);
        const end = documentSource.indexOf(sourceEnd);
        if (start === -1 || end === -1 || end < start) {
            throw new Error("The snippet does not contain a marked source fragment.");
        }
        return documentSource.slice(start + sourceStart.length, end).trim();
    }

    function currentComponents() {
        const term = elements.search.value.trim().toLocaleLowerCase();
        return components.filter((component) => {
            return !term || `${component.name} ${component.group}`.toLocaleLowerCase().includes(term);
        });
    }

    function renderList() {
        const visible = currentComponents();
        elements.list.replaceChildren();
        elements.count.textContent = visible.length === components.length
            ? `${components.length} components`
            : `${visible.length} of ${components.length} components`;
        if (!visible.length) {
            const empty = document.createElement("li");
            empty.className = "ui-catalog-empty";
            empty.textContent = "No matching components.";
            elements.list.append(empty);
            return;
        }
        visible.forEach((component) => {
            const item = document.createElement("li");
            const button = document.createElement("button");
            const name = document.createElement("span");
            const group = document.createElement("small");
            button.type = "button";
            button.dataset.componentSlug = component.slug;
            button.setAttribute("aria-current", String(component.slug === selectedSlug));
            name.textContent = component.name;
            group.textContent = component.group;
            button.append(name, group);
            item.append(button);
            elements.list.append(item);
        });
    }

    async function loadSource(component) {
        if (sourceRequest) {
            sourceRequest.abort();
        }
        sourceRequest = new AbortController();
        elements.source.textContent = "Loading marked source fragment…";
        try {
            const response = await fetch(snippetUrl(component.slug), { signal: sourceRequest.signal });
            if (!response.ok) {
                throw new Error(`Source request failed (${response.status}).`);
            }
            const documentSource = await response.text();
            if (component.slug !== selectedSlug) {
                return;
            }
            const fragment = extractMarkedFragment(documentSource);
            elements.source.textContent = fragment;
            elements.preview.srcdoc = previewDocument(component, fragment);
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }
            elements.source.textContent = `Source unavailable: ${error.message}`;
        }
    }

    function selectComponent(slug) {
        const component = components.find((item) => item.slug === slug);
        if (!component) {
            return;
        }
        selectedSlug = component.slug;
        elements.title.textContent = component.name;
        elements.description.textContent = component.description;
        elements.preview.removeAttribute("src");
        elements.preview.srcdoc = "";
        elements.preview.title = `${component.name} preview`;
        elements.copyStatus.textContent = "";
        elements.detail.setAttribute("aria-busy", "false");
        if (window.location.hash !== `#${component.slug}`) {
            window.history.replaceState(null, "", `#${component.slug}`);
        }
        renderList();
        void loadSource(component);
    }

    function legacyCopy(source) {
        const field = document.createElement("textarea");
        field.value = source;
        field.setAttribute("readonly", "");
        field.className = "ui-sr-only";
        document.body.append(field);
        field.select();
        field.setSelectionRange(0, field.value.length);
        const copied = document.execCommand("copy");
        field.remove();
        if (!copied) throw new Error("Legacy copy was rejected.");
    }

    async function copySource() {
        const source = elements.source.textContent;
        if (!source || source.startsWith("Loading") || source.startsWith("Source unavailable")) {
            elements.copyStatus.textContent = "There is no source fragment to copy.";
            return;
        }
        try {
            let copied = false;
            try {
                legacyCopy(source);
                copied = true;
            } catch (error) {
                copied = false;
            }
            if (navigator.clipboard && window.isSecureContext) {
                try {
                    await navigator.clipboard.writeText(source);
                    copied = true;
                } catch (error) {
                    // The synchronous fallback already copied successfully.
                }
            }
            if (!copied) throw new Error("Copy was rejected.");
            elements.copy.textContent = "Copied";
            elements.copyStatus.textContent = "Code copied to the clipboard.";
            window.setTimeout(() => { elements.copy.textContent = "Copy code"; }, 1600);
        } catch (error) {
            elements.copyStatus.textContent = "Copy failed. Select the source text and copy it manually.";
        }
    }

    async function initialize() {
        try {
            const response = await fetch(catalogUrl);
            if (!response.ok) {
                throw new Error(`Catalog request failed (${response.status}).`);
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error("Catalog data is not an array.");
            }
            components = data.filter((component) => typeof component.name === "string" && /^[a-z0-9-]+$/.test(component.slug));
            renderList();
            if (components.length) {
                const requested = window.location.hash.slice(1);
                selectComponent(components.some((component) => component.slug === requested) ? requested : components[0].slug);
            }
        } catch (error) {
            elements.detail.setAttribute("aria-busy", "false");
            elements.title.textContent = "Catalog unavailable";
            elements.source.textContent = error.message;
        }
    }

    elements.search.addEventListener("input", renderList);
    elements.list.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-component-slug]");
        if (button) {
            selectComponent(button.dataset.componentSlug);
        }
    });
    elements.copy.addEventListener("click", () => void copySource());
    elements.preview.addEventListener("load", () => {
        resizePreview();
        try {
            const observer = new ResizeObserver(resizePreview);
            observer.observe(elements.preview.contentDocument.documentElement);
            window.setTimeout(() => observer.disconnect(), 5000);
        } catch (error) {
            resizePreview();
        }
    });
    void initialize();
})();

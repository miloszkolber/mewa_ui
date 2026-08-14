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
        preview: document.querySelector("#component-preview")
    };
    let components = [];
    let selectedSlug = "";
    let previewRequest;
    let previewResizeObserver;
    let previewModalObserver;
    let previewResizeTimer;

    function setPreviewModalState(open) {
        elements.preview.classList.toggle("ui-catalog-preview-modal", open);
        document.documentElement.classList.toggle("ui-catalog-modal-open", open);
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
    }

    function previewDocument(component, fragment) {
        return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(component.name)} preview</title><link rel="stylesheet" href="/ui/src/base.css"><link rel="stylesheet" href="/ui/src/mewa.css"><link rel="stylesheet" href="/ui/src/demo.css"><script src="/ui/src/components.js" defer><\/script></head><body class="ui-demo ui-demo-preview">${fragment}</body></html>`;
    }

    function resizePreview() {
        try {
            const height = elements.preview.contentDocument?.documentElement.scrollHeight || 0;
            elements.preview.style.height = `${Math.max(288, Math.min(960, height))}px`;
        } catch (error) {
            elements.preview.style.height = "18rem";
        }
    }

    function snippetUrl(slug) {
        return new URL(`${slug}.html`, new URL(snippetsBaseUrl, window.location.origin)).pathname;
    }

    function extractMarkedFragment(documentSource) {
        const start = documentSource.indexOf(sourceStart);
        const end = documentSource.indexOf(sourceEnd);
        if (start === -1 || end === -1 || end < start) {
            throw new Error("The snippet does not contain a marked preview fragment.");
        }
        return documentSource.slice(start + sourceStart.length, end).trim();
    }

    function currentComponents() {
        const term = elements.search.value.trim().toLocaleLowerCase();
        return components.filter((component) => !term || `${component.name} ${component.group} ${component.description}`.toLocaleLowerCase().includes(term));
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

    async function loadPreview(component) {
        previewRequest?.abort();
        previewRequest = new AbortController();
        elements.detail.setAttribute("aria-busy", "true");
        try {
            const response = await fetch(snippetUrl(component.slug), { signal: previewRequest.signal });
            if (!response.ok) throw new Error(`Preview request failed (${response.status}).`);
            const fragment = extractMarkedFragment(await response.text());
            if (component.slug !== selectedSlug) return;
            elements.preview.srcdoc = previewDocument(component, fragment);
            elements.detail.setAttribute("aria-busy", "false");
        } catch (error) {
            if (error.name === "AbortError") return;
            elements.preview.srcdoc = previewDocument(component, `<p role="alert">${escapeHtml(error.message)}</p>`);
            elements.detail.setAttribute("aria-busy", "false");
        }
    }

    function selectComponent(slug) {
        const component = components.find((item) => item.slug === slug);
        if (!component) return;
        setPreviewModalState(false);
        selectedSlug = component.slug;
        elements.title.textContent = component.name;
        elements.description.textContent = component.description;
        elements.preview.srcdoc = "";
        elements.preview.title = `${component.name} preview`;
        if (window.location.hash !== `#${component.slug}`) window.history.replaceState(null, "", `#${component.slug}`);
        renderList();
        void loadPreview(component);
    }

    async function initialize() {
        try {
            const response = await fetch(catalogUrl);
            if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error("Catalog data is not an array.");
            components = data.filter((component) => typeof component.name === "string" && /^[a-z0-9-]+$/.test(component.slug));
            renderList();
            if (components.length) {
                const requested = window.location.hash.slice(1);
                selectComponent(components.some((component) => component.slug === requested) ? requested : components[0].slug);
            }
        } catch (error) {
            elements.detail.setAttribute("aria-busy", "false");
            elements.title.textContent = "Catalog unavailable";
            elements.description.textContent = error.message;
        }
    }

    elements.search.addEventListener("input", renderList);
    elements.list.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-component-slug]");
        if (button) selectComponent(button.dataset.componentSlug);
    });
    elements.preview.addEventListener("load", () => {
        previewResizeObserver?.disconnect();
        previewModalObserver?.disconnect();
        if (previewResizeTimer) window.clearTimeout(previewResizeTimer);
        previewResizeObserver = undefined;
        previewModalObserver = undefined;
        previewResizeTimer = undefined;
        resizePreview();
        try {
            const previewDocument = elements.preview.contentDocument;
            const previewRoot = previewDocument.documentElement;
            const resizeObserver = new ResizeObserver(resizePreview);
            const modalObserver = new MutationObserver(() => {
                setPreviewModalState(previewRoot.hasAttribute("data-mewa-ui-modal-open"));
            });
            previewResizeObserver = resizeObserver;
            previewModalObserver = modalObserver;
            resizeObserver.observe(previewRoot);
            modalObserver.observe(previewRoot, { attributes: true, attributeFilter: ["data-mewa-ui-modal-open"] });
            previewResizeTimer = window.setTimeout(() => {
                resizeObserver.disconnect();
                if (previewResizeObserver === resizeObserver) previewResizeObserver = undefined;
                previewResizeTimer = undefined;
            }, 5000);
            previewDocument.addEventListener("mewa-ui:modal-open", () => setPreviewModalState(true));
            previewDocument.addEventListener("mewa-ui:modal-close", () => setPreviewModalState(false));
            setPreviewModalState(previewRoot.hasAttribute("data-mewa-ui-modal-open"));
        } catch (error) {
            resizePreview();
        }
    });
    void initialize();
})();

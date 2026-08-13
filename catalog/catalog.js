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
        group: document.querySelector("#component-group"),
        title: document.querySelector("#component-title"),
        kind: document.querySelector("#component-kind"),
        preview: document.querySelector("#component-preview"),
        source: document.querySelector("#component-source code"),
        copy: document.querySelector("#copy-source"),
        copyStatus: document.querySelector("#copy-status")
    };
    let components = [];
    let selectedSlug = "";
    let sourceRequest;

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
        elements.count.textContent = `${visible.length} of ${components.length} components`;
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
            elements.source.textContent = extractMarkedFragment(documentSource);
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
        elements.group.textContent = component.group;
        elements.title.textContent = component.name;
        elements.kind.textContent = component.static ? "Static" : "Interactive";
        elements.preview.src = snippetUrl(component.slug);
        elements.preview.title = `${component.name} preview`;
        elements.copyStatus.textContent = "";
        elements.detail.setAttribute("aria-busy", "false");
        if (window.location.hash !== `#${component.slug}`) {
            window.history.replaceState(null, "", `#${component.slug}`);
        }
        renderList();
        void loadSource(component);
    }

    async function copySource() {
        const source = elements.source.textContent;
        if (!source || source.startsWith("Loading") || source.startsWith("Source unavailable")) {
            elements.copyStatus.textContent = "There is no source fragment to copy.";
            return;
        }
        try {
            await navigator.clipboard.writeText(source);
            elements.copyStatus.textContent = "Source fragment copied.";
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
    void initialize();
})();

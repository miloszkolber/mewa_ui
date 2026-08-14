(() => {
    "use strict";

    const catalogUrl = "/ui/catalog/components.json";
    const snippetsBaseUrl = "/ui/snippets/";
    const sourceStart = "<!-- mewa-ui-snippet:start -->";
    const sourceEnd = "<!-- mewa-ui-snippet:end -->";
    const paletteSteps = ["050", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
    const paletteRoles = {
        "050": "Foundation surface",
        "100": "Raised surface",
        "200": "Hover background",
        "300": "Active background",
        "400": "Subtle border",
        "500": "Default border",
        "600": "Strong border",
        "700": "Decorative content",
        "800": "Muted text",
        "900": "Secondary text",
        "950": "Primary text"
    };
    const palettes = [
        { prefix: "gray", name: "Gray", description: "Neutral application roles." },
        { prefix: "red", name: "Red", description: "Errors and destructive actions." },
        { prefix: "amber", name: "Amber", description: "Warnings and pending states." },
        { prefix: "green", name: "Green", description: "Success and healthy states." },
        { prefix: "alpha-white", name: "Alpha white", description: "Role-aligned overlays on darker backdrops.", alpha: true, backdrop: "--ui-gray-050" },
        { prefix: "alpha-black", name: "Alpha black", description: "Role-aligned overlays on lighter backdrops.", alpha: true, backdrop: "--ui-gray-950" }
    ];
    const elements = {
        count: document.querySelector("#component-count"),
        search: document.querySelector("#component-search"),
        list: document.querySelector("#component-list"),
        detail: document.querySelector(".ui-catalog-detail"),
        title: document.querySelector("#component-title"),
        description: document.querySelector("#component-description"),
        preview: document.querySelector("#component-preview"),
        previewWrap: document.querySelector("#component-preview-wrap"),
        paletteLink: document.querySelector("[data-catalog-view=\"colors\"]"),
        paletteView: document.querySelector("#palette-view"),
        paletteScales: document.querySelector("#palette-scales")
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

    function parseOklch(value) {
        const match = value.match(/^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i);
        if (!match) throw new Error(`Unsupported palette value: ${value}`);
        return {
            lightness: Number(match[1]) / 100,
            chroma: Number(match[2]),
            hue: Number(match[3]),
            alpha: match[4] === undefined ? 1 : Number(match[4])
        };
    }

    function oklchToSrgb({ lightness, chroma, hue }) {
        const radians = hue * Math.PI / 180;
        const a = chroma * Math.cos(radians);
        const b = chroma * Math.sin(radians);
        const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
        const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
        const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;
        const l = lPrime ** 3;
        const m = mPrime ** 3;
        const s = sPrime ** 3;
        const linear = [
            4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
        ];
        return linear.map((channel) => {
            const encoded = channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
            return Math.max(0, Math.min(1, encoded));
        });
    }

    // APCA 0.0.98G-4g. Source and usage guidance: https://git.apcacontrast.com/documentation/
    function apcaLuminance([red, green, blue]) {
        return 0.2126729 * red ** 2.4 + 0.7151522 * green ** 2.4 + 0.0721750 * blue ** 2.4;
    }

    function apcaSoftClamp(luminance) {
        return luminance < 0.022 ? luminance + (0.022 - luminance) ** 1.414 : luminance;
    }

    function apcaContrast(foreground, background) {
        const text = apcaSoftClamp(apcaLuminance(foreground));
        const surface = apcaSoftClamp(apcaLuminance(background));
        if (Math.abs(surface - text) < 0.0005) return 0;
        if (surface > text) {
            const contrast = (surface ** 0.56 - text ** 0.57) * 1.14;
            return (contrast < 0.1 ? 0 : contrast - 0.027) * 100;
        }
        const contrast = (surface ** 0.65 - text ** 0.62) * 1.14;
        return (contrast > -0.1 ? 0 : contrast + 0.027) * 100;
    }

    function tokenValue(prefix, step) {
        return getComputedStyle(document.documentElement).getPropertyValue(`--ui-${prefix}-${step}`).trim();
    }

    function signedMetric(value, digits = 0) {
        if (Math.abs(value) < 0.5 * 10 ** -digits) return (0).toFixed(digits);
        return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(digits)}`;
    }

    function renderPalettes() {
        if (elements.paletteScales.childElementCount) return;
        palettes.forEach((palette) => {
            const section = document.createElement("section");
            const header = document.createElement("header");
            const heading = document.createElement("h2");
            const description = document.createElement("p");
            const grid = document.createElement("ol");
            const values = paletteSteps.map((step) => parseOklch(tokenValue(palette.prefix, step)));
            const colors = values.map(oklchToSrgb);
            const contrastAnchor = colors[1];
            section.className = "ui-catalog-palette";
            header.className = "ui-catalog-palette-header";
            heading.textContent = palette.name;
            description.textContent = palette.description;
            grid.className = "ui-catalog-palette-grid";
            header.append(heading, description);
            section.append(header, grid);
            paletteSteps.forEach((step, index) => {
                const item = document.createElement("li");
                const swatch = document.createElement("div");
                const meta = document.createElement("div");
                const name = document.createElement("strong");
                const role = document.createElement("span");
                const delta = document.createElement("span");
                const contrast = document.createElement("span");
                const value = values[index];
                item.className = "ui-catalog-palette-step";
                swatch.className = "ui-catalog-palette-swatch";
                meta.className = "ui-catalog-palette-meta";
                role.className = "ui-catalog-palette-role";
                delta.className = "ui-catalog-palette-metric";
                contrast.className = "ui-catalog-palette-metric";
                swatch.style.setProperty("--ui-palette-color", `var(--ui-${palette.prefix}-${step})`);
                if (palette.alpha) swatch.style.setProperty("--ui-palette-backdrop", `var(${palette.backdrop})`);
                name.textContent = step;
                role.textContent = paletteRoles[step];
                if (palette.alpha) {
                    delta.textContent = `L ${(value.lightness * 100).toFixed(1)} · α ${value.alpha.toFixed(2)}`;
                    contrast.textContent = "Lc depends on backdrop";
                } else {
                    delta.textContent = `L ${(value.lightness * 100).toFixed(1)}`;
                    contrast.textContent = `Lc ${signedMetric(apcaContrast(colors[index], contrastAnchor))} vs 100`;
                }
                meta.append(name, role, delta, contrast);
                item.append(swatch, meta);
                grid.append(item);
            });
            elements.paletteScales.append(section);
        });
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
        elements.paletteLink.removeAttribute("aria-current");
        elements.paletteView.hidden = true;
        elements.previewWrap.hidden = false;
        elements.title.textContent = component.name;
        elements.description.textContent = component.description;
        elements.preview.srcdoc = "";
        elements.preview.title = `${component.name} preview`;
        if (window.location.hash !== `#${component.slug}`) window.history.replaceState(null, "", `#${component.slug}`);
        renderList();
        void loadPreview(component);
    }

    function selectPaletteView() {
        previewRequest?.abort();
        setPreviewModalState(false);
        selectedSlug = "colors";
        elements.title.textContent = "Color palettes";
        elements.description.textContent = "Theme-specific OKLCH scales organized by interface role and measured with APCA.";
        elements.preview.srcdoc = "";
        elements.previewWrap.hidden = true;
        elements.paletteView.hidden = false;
        elements.paletteLink.setAttribute("aria-current", "page");
        elements.detail.setAttribute("aria-busy", "false");
        if (window.location.hash !== "#colors") window.history.replaceState(null, "", "#colors");
        renderList();
        renderPalettes();
    }

    function selectRequestedView() {
        if (!components.length) return;
        const requested = window.location.hash.slice(1);
        if (requested === "colors") {
            if (selectedSlug !== "colors") selectPaletteView();
            return;
        }
        const nextSlug = components.some((component) => component.slug === requested) ? requested : components[0].slug;
        if (selectedSlug !== nextSlug) selectComponent(nextSlug);
    }

    async function initialize() {
        try {
            const response = await fetch(catalogUrl);
            if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error("Catalog data is not an array.");
            components = data.filter((component) => typeof component.name === "string" && /^[a-z0-9-]+$/.test(component.slug));
            renderList();
            selectRequestedView();
        } catch (error) {
            elements.detail.setAttribute("aria-busy", "false");
            elements.title.textContent = "Catalog unavailable";
            elements.description.textContent = error.message;
        }
    }

    elements.search.addEventListener("input", renderList);
    elements.paletteLink.addEventListener("click", (event) => {
        event.preventDefault();
        selectPaletteView();
    });
    window.addEventListener("hashchange", selectRequestedView);
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

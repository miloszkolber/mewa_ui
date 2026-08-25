# App Shell

## Native basis

A semantic page frame composed from `<body>`, `<header>`, `<nav>`, `<main>`, native route links, and native action buttons. CSS provides shared application chrome without replacing navigation or document landmarks. The optional module adds an OS-aware, persisted theme toggle.

## Native Web APIs

- [`<header>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header) and [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) provide named application navigation.
- [`aria-current="page"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) exposes the current route on its native link.
- [`Window.matchMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) reads and follows the OS color-scheme preference until the user makes a manual choice.
- [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) persists the optional manual theme choice when storage is available.

## Page frame

Put `.app-shell` on `<body>`. The direct `<main>` child grows to fill the viewport. Use a skip link before the header and give the main landmark a stable ID. The main landmark includes a default sticky-header scroll offset. Set `--app-shell-header-offset` on `.app-shell` only when a consumer's wrapped header is taller than the default `3.5rem`.

```html
<body class="app-shell">
  <a class="skip-link" href="#main-content">Skip to content</a>

  <header class="app-header">
    <div class="app-header-inner">
      <a class="brand" href="/" aria-label="Example service home">
        <span class="brand-mark" aria-hidden="true">
          <i data-lucide="command"></i>
        </span>
        <span>Example service</span>
      </a>

      <nav class="app-nav" aria-label="Primary">
        <a href="/jobs" aria-current="page">Jobs</a>
        <a href="/history">History</a>
      </nav>

      <div class="app-header-actions">
        <button class="btn" type="button" data-variant="outline" data-size="icon" data-theme-toggle aria-label="Toggle theme">
          <i data-lucide="moon" aria-hidden="true"></i>
          <i data-lucide="sun" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </header>

  <main id="main-content">
    <!-- Page content -->
  </main>
</body>
```

Use native links for routes and native buttons for actions. Keep `aria-current="page"` on only the current route. `.brand-mark` is the same signet used by the Sidebar header: a 32px square inverted container with a 16px icon inside. `.brand-logo` is the icon slot inside it. The current route reads as a line tab — a 2px bottom border under the link — so hover never covers it.

## Toolbar alternative

Use `.app-toolbar` with `.app-toolbar-inner` for a sticky breadcrumb-and-actions bar in a sidebar application. Do not stack it below `.app-header`, because each region is independently sticky at the viewport start.

```html
<header class="app-toolbar">
  <div class="app-toolbar-inner">
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li class="breadcrumb-item"><a href="/">Home</a></li>
        <li class="breadcrumb-item" aria-current="page">Workers</li>
      </ol>
    </nav>
    <div class="app-toolbar-actions">
      <button class="btn" type="button" data-variant="outline">Refresh</button>
    </div>
  </div>
</header>
```

## Edge accent

Add `.app-shell-edge` beside `.app-shell` on `<body>` to pin a decorative diagonal hatch to both inline edges of the viewport. The accent is a flat hard-stop pattern painted in a border role, ignores pointer input, and never moves. Omit the class when the edges must stay clean; the shell is fully usable without it.

```html
<body class="app-shell app-shell-edge">
```

## Page overview

Use one `.page-overview` near the start of `<main>` for route context, a sentence-case heading, a concise description, optional actions, and an inline stats strip. The uppercase `.eyebrow` is the reserved monospace technical label. Do not uppercase ordinary headings or controls.

```html
<section class="page-overview" aria-labelledby="jobs-heading">
  <div>
    <p class="eyebrow">Worker control</p>
    <h1 class="page-heading" id="jobs-heading">Pipeline jobs</h1>
    <p class="page-description">Inspect current workers and retry failed jobs.</p>
  </div>

  <div class="page-actions">
    <button class="btn" type="button" data-variant="outline">Refresh</button>
  </div>

  <p class="stats">
    <span><span class="stat-label">Queued:</span> <span class="stat-value">12</span></span>
    <span class="stat-separator" aria-hidden="true">/</span>
    <span><span class="stat-label">Failed:</span> <span class="stat-value">2</span></span>
  </p>
</section>
```

Set `--app-shell-max: 64rem` on `.app-shell` for focused single-purpose tools. The default `90rem` canvas suits dense tables and media surfaces.

## Shared content canvas

Use `.app-content` for a content region that should use the same max-width and centered margin math as the header, toolbar, and page overview. It has no card treatment, so consumers can compose their own sections inside it.

```html
<main id="main-content">
  <div class="app-content">
    <!-- Route content uses the shared shell canvas. -->
  </div>
</main>
```

## Status and empty states

`.status-dot` is a compact status marker. `.status-icon` is a circular status-glyph container. Both accept `data-state="positive"`, `data-state="caution"`, `data-state="negative"`, or `data-state="running"`. Always pair a color marker with visible status text. Use `.app-empty` for a short empty result message and add `role="status"` when asynchronous updates replace its text.

```html
<span class="stat-status">
  <span class="status-dot" data-state="positive" aria-hidden="true"></span>
  Ready
</span>

<p class="app-empty" role="status">No jobs match the current filter.</p>
```

For a dense collection of independently actionable statuses, use `.app-status-list` and one `.app-status-row` per item. Place the existing `.status-icon` or `.status-dot` first, keep copy in `.app-status-copy`, and put optional controls in `.app-status-actions`. Both markers share a fixed slot so titles align across rows. Rows are separated by borders and do not add nested cards.

```html
<ul class="app-status-list" aria-label="Worker status">
  <li class="app-status-row">
    <span class="status-icon" data-state="running" aria-hidden="true">...</span>
    <div class="app-status-copy">
      <p class="app-status-title">Resolve model manifest</p>
      <p class="app-status-description">Checking revisions and compatible quantizations.</p>
    </div>
    <div class="app-status-actions">
      <button class="btn" type="button" data-variant="outline" data-size="sm">View run</button>
    </div>
  </li>
</ul>
```

## Filter rail

Use `.app-filter-rail` for a narrow vertical filter navigation shared by bookmarks and rss. It keeps the same section canvas as dense rows but uses a vertical list with an inset left-border active indicator. Pair with `.app-filter-list` or `.app-filter-tags`.

```html
<aside class="app-filter-rail" aria-label="Bookmark filters">
  <section class="app-section app-filter-section" aria-labelledby="filter-categories-title">
    <div class="app-section-header">
      <h2 class="app-section-title" id="filter-categories-title">Categories</h2>
    </div>
    <div class="app-section-content">
      <ul class="app-filter-list">
        <li><a href="/" aria-current="page"><span>All</span><small>12</small></a></li>
        <li><a href="/?category=3"><span>Research</span><small>4</small></a></li>
      </ul>
    </div>
  </section>
</aside>
```

Active link uses `aria-current="page"` and receives the same `background: var(--surface-secondary)` treatment as category rows in rss. Keep the rail width at `16rem` (bookmarks) or `15–19rem` (rss) and collapse to full-width at `48rem`.

## Section canvas

Use `.app-section` for a bordered full-width section that holds dense rows (tables, status lists, or custom row grids). It replaces the common but visually heavy `card > table` nesting. Put the border on the section, not on each row.

```html
<section class="app-section" aria-labelledby="jobs-title">
  <div class="app-section-header">
    <h2 class="app-section-title" id="jobs-title">Scheduled services</h2>
  </div>
  <div class="table-container">
    <table class="table table--dense">…</table>
  </div>
</section>
```

When a section directly wraps a table, status list, or bookmark list, the inner container's border is removed so the section provides the single outer canvas.

For empty states inside a section, use `.app-empty--compact` (dashed border) rather than a standalone card.

```html
<p class="app-empty app-empty--compact" role="status">No bookmarks match.</p>
```

## Sizing guidance

- Header actions (`.app-header-actions` > `.btn`): default size, `data-variant="outline"` for Theme and Refresh. Do not use `data-size="sm"` in headers.
- In-row actions (inside `.app-status-row`, `.bookmark-row`, table `actions` cells): `data-size="sm"`.
- Filled destructive (`data-variant="destructive"`) reserved for the primary confirm in a dialog; secondary/row actions use outline or ghost variants with `data-variant="destructive"` for red text without filled mass.
- Refresh buttons: outline + refresh icon + visible label ("Refresh", "Refresh inventory", "Refresh all") in `.app-header-actions`.

## Header refresh pattern

Use the same outline button with icon and label in every header. Do not invent `secondary` variants or custom wording per service.

```html
<button class="btn" type="button" data-variant="outline">
  <i data-lucide="refresh-cw" aria-hidden="true"></i>
  Refresh
</button>
```

## Optional theme enhancement

Load the optional module only when the page includes `[data-theme-toggle]`. Without the module, the control stays hidden and the rest of the shell remains usable.

```html
<script type="module" src="/ui/components/app-shell/app-shell.js"></script>
```

To avoid a first-paint mismatch, put this small inline decision script in `<head>` after the foundation links and before application styles. It follows the OS until a manual choice has been stored. The legacy key preserves existing mewa_ui consumer preferences during migration.

```html
<script>
  (function () {
    var stored = null;
    try {
      stored = localStorage.getItem('mewa-ui-theme') || localStorage.getItem('mewa-theme');
    } catch (error) {}
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }());
</script>
```

The module writes only `mewa-ui-theme`, updates the toggle's action label, and sets `data-theme="light"` or `data-theme="dark"` for the icon treatment: the moon is shown in light mode and the sun in dark mode, and the module's `data-theme` state swaps which one renders.

## Accessibility

- Use one main landmark and a skip link whose fragment resolves to it.
- Give every navigation landmark a visible heading or an `aria-label`.
- Keep route navigation as native links. Do not add tab roles to application routes.
- Give icon-only actions an accessible name and mark decorative SVGs `aria-hidden="true"`.
- Pair status color with visible text and use live status semantics only for content that changes asynchronously.
- Keep the shell usable at narrow widths and 200% zoom. Header rows wrap instead of hiding actions.
- The shell is square, border-led, and motionless. Status circles are the only circular geometry it introduces.

## No-JavaScript behavior

The header, navigation, page overview, status text, empty state, and native actions remain usable without JavaScript. The optional theme control is hidden until its module initializes. When the inline preference script is omitted, `src/tokens.css` still provides the default light theme and consumers may rely on their own theme policy.

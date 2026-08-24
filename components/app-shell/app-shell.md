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
        <span class="brand-mark" aria-hidden="true">EX</span>
        <span>Example service</span>
      </a>

      <nav class="app-nav" aria-label="Primary">
        <a href="/jobs" aria-current="page">Jobs</a>
        <a href="/history">History</a>
      </nav>

      <div class="app-header-actions">
        <button class="btn" type="button" data-variant="outline" data-theme-toggle>
          Theme
        </button>
      </div>
    </div>
  </header>

  <main id="main-content">
    <!-- Page content -->
  </main>
</body>
```

Use native links for routes and native buttons for actions. Keep `aria-current="page"` on only the current route. `.brand-logo` sizes an image or inline SVG. `.brand-mark` provides a square text fallback when no logo asset is available.

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

## Status and empty states

`.status-dot` is a compact status marker. `.status-icon` is a circular status-glyph container. Both accept `data-state="positive"`, `data-state="caution"`, `data-state="negative"`, or `data-state="running"`. Always pair a color marker with visible status text. Use `.app-empty` for a short empty result message and add `role="status"` when asynchronous updates replace its text.

```html
<span class="stat-status">
  <span class="status-dot" data-state="positive" aria-hidden="true"></span>
  Ready
</span>

<p class="app-empty" role="status">No jobs match the current filter.</p>
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

The module writes only `mewa-ui-theme`, updates the toggle's action label, and sets `data-theme="light"` or `data-theme="dark"` for an optional visual icon treatment. A storage failure affects persistence only.

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

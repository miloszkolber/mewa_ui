# App Shell

## Purpose

App Shell supplies shared chrome and page-region primitives for utility applications.

Use `library/system/layouts.md` when you need a complete shell composition.

Do not treat App Shell as a complete route template.

Do not put route data or business logic in App Shell.

## Native basis

App Shell uses `<body>`, `<header>`, `<nav>`, `<main>`, native links, and native buttons.

CSS supplies shared chrome and page regions.

The optional module supplies an OS-aware persisted theme toggle.

## Native Web APIs

- [`<header>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header) identifies application chrome.
- [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) identifies route navigation.
- [`<main>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main) identifies the primary page content.
- [`aria-current="page"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) identifies the current route.
- [`Window.matchMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) reads the OS color preference.
- [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) stores the optional manual theme choice.

## Structure

Put `.app-shell` on `<body>`.

Put one skip link before repeated application chrome.

Give the main landmark a stable ID.

Use native links for routes.

Use native buttons for actions.

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
        <button class="btn"
                type="button"
                data-variant="outline"
                data-size="icon"
                data-theme-toggle
                aria-label="Toggle theme">
          <i data-lucide="moon" aria-hidden="true"></i>
          <i data-lucide="sun" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </header>

  <main id="main-content">
    <div class="app-content">
      <!-- Route content. -->
    </div>
  </main>
</body>
```

Keep `aria-current="page"` on only one route in each navigation landmark.

Use `.brand-mark` for the shared 32px signet.

Do not duplicate the same product brand in another visible shell region.

## Toolbar

Use `.app-toolbar` for breadcrumbs and local page actions in a sidebar shell.

Do not stack `.app-toolbar` under `.app-header`.

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

Add `.app-shell-edge` to `<body>` to show the optional viewport-edge hatch.

Use the hatch only on a complete shell.

Do not use the hatch on an inner region.

```html
<body class="app-shell app-shell-edge">
```

The hatch disappears below `--breakpoint-compact`, `48rem`.

## Page overview

Use one `.page-overview` near the start of the main content.

Use the region for route context, one heading, one short description, and page actions.

Use `.eyebrow` only for a short technical label.

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
</section>
```

Use `--app-shell-max: var(--breakpoint-max-dense)` for dense data surfaces.

Use `--app-shell-max: var(--breakpoint-max-focused)` for a focused tool.

Do not add another shell width preset.

## Shared content canvas

Use `.app-content` for content that follows the shell width and centering rules.

Do not add a card treatment to `.app-content`.

```html
<main id="main-content">
  <div class="app-content">
    <!-- Route content. -->
  </div>
</main>
```

## Inline status

Use `.status-dot` for a compact state marker.

Use `.status-icon` when the glyph adds useful meaning.

Use `data-state="positive"`, `data-state="caution"`, `data-state="negative"`, or `data-state="running"`.

Always pair the marker with visible state text.

```html
<span class="stat-status">
  <span class="status-dot" data-state="positive" aria-hidden="true"></span>
  Ready
</span>
```

## Status list

Use `.app-status-list` for dense independently actionable status rows.

Use one `.app-status-row` for each item.

Put the state marker first.

Put optional controls in `.app-status-actions`.

Do not wrap each row in a card.

```html
<ul class="app-status-list" aria-label="Worker status">
  <li class="app-status-row">
    <span class="status-dot" data-state="running" aria-hidden="true"></span>
    <div class="app-status-copy">
      <p class="app-status-title">Resolve model manifest</p>
      <p class="app-status-description">Check compatible revisions.</p>
    </div>
    <div class="app-status-actions">
      <button class="btn" type="button" data-variant="outline" data-size="sm">View run</button>
    </div>
  </li>
</ul>
```

## Status icon glyph swap

Use this pattern when the glyph inside `status-icon` must change with state.

Keep one `status-icon` per row.

Put each state glyph inside the `status-icon`.

Toggle glyph visibility from the row `data-state`.

Keep color on the `status-icon` via its own `data-state`.

```html
<li class="app-status-row" data-state="positive" aria-labelledby="device-status">
  <span class="status-icon" data-state="positive" aria-hidden="true">
    <svg class="status-glyph status-glyph-loading" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>
    <svg class="status-glyph status-glyph-positive" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
    <svg class="status-glyph status-glyph-caution" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
  </span>
  <div class="app-status-copy">
    <p id="device-status" class="app-status-title">Device connected</p>
    <p class="app-status-description">Available at 192.0.2.10</p>
  </div>
</li>
```

```css
.status-glyph { display: none; }
.status-glyph-loading { display: block; }
.app-status-row[data-state="positive"] .status-glyph-loading,
.app-status-row[data-state="caution"] .status-glyph-loading { display: none; }
.app-status-row[data-state="positive"] .status-glyph-positive { display: block; }
.app-status-row[data-state="caution"] .status-glyph-caution { display: block; }
```

Synchronize the `data-state` on the row and on the `status-icon`.

Do not add a new component for this swap.
## Dense row list

Use `.app-dense-list` for a collection of content rows.

Use one `.app-dense-row` for each item.

Put a marker or selection control in `.app-dense-leading`.

Put the label and supporting content in `.app-dense-copy`.

Use `.app-dense-heading` for the label and nearby metadata.

Use `.app-dense-actions` for compact row actions.

Use `.app-dense-row--plain` when a row has no leading slot.

Put the outer border on `.app-section`.

Do not wrap each row in a card.

```html
<section class="app-section">
  <ul class="app-dense-list" aria-label="Feeds">
    <li class="app-dense-row">
      <span class="app-dense-leading status-dot" data-state="positive" aria-hidden="true"></span>
      <div class="app-dense-copy">
        <div class="app-dense-heading">
          <h3 class="app-dense-title">Core updates</h3>
          <span class="badge" data-variant="outline">Healthy</span>
        </div>
        <p class="app-dense-description">https://example.com/feed.xml</p>
        <p class="app-dense-meta">Fetched today · Next fetch in 30 minutes</p>
      </div>
      <div class="app-dense-actions">
        <button class="btn" type="button" data-variant="ghost" data-size="sm">Refresh</button>
      </div>
    </li>
  </ul>
</section>
```

Use native list elements when the items form a collection.

Use `role="list"` and `role="listitem"` only when another semantic element must be the row.

Keep the list usable without JavaScript.

## Section canvas

Use `.app-section` for one bordered region that contains dense rows or a table.

Put the outer border on the section.

Remove the child container border when the child fills the section.

Do not wrap a table in Card.

```html
<section class="app-section" aria-labelledby="jobs-title">
  <div class="app-section-header">
    <div>
      <h2 class="app-section-title" id="jobs-title">Scheduled services</h2>
      <p class="app-section-description">Current execution state.</p>
    </div>
  </div>
  <div class="table-container">
    <table class="table table--dense">
      <!-- Table rows. -->
    </table>
  </div>
</section>
```

## Filter rail

Use `.app-filter-rail` for narrow route or result filters beside primary content.

Use `.app-filter-list` for category links.

Use `.app-filter-tags` for tag links.

Use `aria-current="page"` on the active link.

Collapse the rail before it makes the primary content too narrow.

Do not use a filter rail for primary application navigation.

## Empty state

Use `.app-empty` for a concise empty result message.

Add `role="status"` only when an asynchronous update replaces the message.

Use `.app-empty--compact` inside a bordered section.

Do not add an illustration when one sentence and one recovery action are sufficient.

```html
<p class="app-empty app-empty--compact" role="status">No jobs match the current filter.</p>
```

## Behavior

The shell keeps one continuous application canvas.

The sticky header or toolbar stays at the viewport start.

The current route uses a border-led active treatment.

Dense sections share one outer border.

Status rows align markers, copy, and actions without nested cards.

Narrow viewports stack status actions below the copy.

The optional edge hatch disappears below `--breakpoint-compact`, `48rem`.

## Action sizing

Use default Button size for header actions.

Use small Button size for row actions.

Use Outline for ordinary secondary actions.

Use Ghost for low-emphasis row actions.

Reserve a filled Destructive button for a destructive confirmation.

Use an icon and visible label for Refresh actions.

## Optional theme enhancement

Load the module only when the page contains `[data-theme-toggle]`.

The theme control stays hidden until the module initializes.

```html
<script type="module" src="/ui/library/components/app-shell/app-shell.js"></script>
```

Put the pre-paint preference script in `<head>` after the foundation styles.

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

The module writes the `mewa-ui-theme` storage key.

The module follows the OS preference until the user selects a theme.

## Accessibility

Use one main landmark.

Make the skip-link fragment resolve to the main landmark.

Give every navigation landmark an accessible name.

Keep routes as links.

Do not add tab roles to route navigation.

Give every icon-only action an accessible name.

Hide decorative icons from assistive technology.

Pair status color with visible text.

Use live-region semantics only for asynchronous updates.

Keep the shell usable at 200 percent zoom.

Keep the shell usable at 320 CSS pixels.

Keep every interactive control keyboard reachable.

## Runtime

The page frame, navigation, overview, status, sections, and empty states need no JavaScript.

The theme toggle uses optional JavaScript.

The shell stays usable when the optional module does not load.

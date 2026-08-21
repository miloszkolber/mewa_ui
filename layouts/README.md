# Layout templates

These are complete, serveable HTML templates. Start a static server at the repository root and open `layouts/vertical-navbar.html` or `layouts/horizontal-navbar.html`.

## Templates

- `vertical-navbar.html` is the application shell. It combines the current Sidebar component with a sticky breadcrumb header, flat icon-and-label links, a footer collapse control, mobile dialog navigation, utility rail, filters, status rows, and a resource table. Replace the sample data and set `data-utility="start"` when the utility rail belongs on the left.
- `horizontal-navbar.html` is the top-navigation shell. It provides a responsive primary navigation bar and a profile/resume composition with experience, work, and contact sections.
- `layouts.css` contains only layout-template rules. It does not modify shared components.
- `layouts.js` inlines local icons from `src/icons/` and provides an optional light/dark theme toggle. It has no third-party dependencies.

## Source mapping

The vertical template covers the expanded, collapsed, left-utility, right-utility, and operations compositions. The horizontal template covers the top-navigation composition. The older six compositions therefore remain two adaptable templates instead of six copies.

## Progressive enhancement

Desktop sidebar collapse and the mobile navigation dialog use the current Sidebar component and its native `<dialog>` path. The account menu uses `<details>`, while the sidebar itself stays a flat labelled nav with its collapse control in the footer. At narrow widths with JavaScript disabled, the component presents the primary nav as a normal block instead of leaving an inert dialog trigger. Forms, links, progress indicators, tables, and buttons retain native behavior if JavaScript is unavailable. Serve over HTTP so ES modules and local icon fetches work.

The templates intentionally use placeholder copy such as “Your name”, “Company name”, and “Replace these examples”. Replace those values and form actions before shipping. The vertical account menu's sign-out button exposes `data-layout-action="sign-out"` for the consuming application to wire. The horizontal project cards expose placeholder text where a real case-study route belongs.

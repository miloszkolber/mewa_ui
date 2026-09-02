# Footer

## Purpose

Footer identifies page-level supporting information and secondary navigation.

Use Footer for site information, policy links, or other content that applies to the complete page.

Use a local action region when the content belongs only to one card, form, or section.

Do not use Footer as a generic bottom-alignment container.

## Native basis

Footer uses a native `<footer>` element.

CSS provides a compact wrapping layout and a structural top border.

Footer requires no JavaScript.

## Native Web APIs

- [`<footer>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer) provides content-information semantics when it is not nested in sectioning content.
- [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) identifies optional secondary navigation.
- [`aria-current="page"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) identifies a current footer destination when necessary.
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) provides keyboard focus treatment.

## Structure

Use `.footer-layout` for the content row.

Use a labelled navigation landmark when Footer contains a meaningful route list.

```html
<footer class="footer">
  <div class="footer-layout">
    <p class="footer-meta">© 2026 Atlas</p>

    <nav class="footer-navigation" aria-label="Footer">
      <ul class="footer-list">
        <li><a class="footer-link" href="/privacy">Privacy</a></li>
        <li><a class="footer-link" href="/accessibility">Accessibility</a></li>
        <li><a class="footer-link" href="/support">Support</a></li>
      </ul>
    </nav>
  </div>
</footer>
```

Keep secondary links concise.

Keep legal or ownership text in `.footer-meta`.

Remove the navigation landmark when Footer has no route list.

## Keyboard

Tab moves through Footer links in document order.

Enter follows the focused link.

Footer adds no custom keyboard behavior.

## Accessibility

Use one page-level Footer as the content-information landmark.

A Footer nested inside `<article>`, `<aside>`, `<main>`, `<nav>`, or `<section>` identifies only that local content.

Give every navigation landmark a clear accessible name.

Keep destinations as native links.

Use `aria-current="page"` only when a Footer link represents the current route.

Do not repeat primary navigation without a clear reason.

## Runtime

Footer requires no component module.

Footer remains complete without JavaScript.

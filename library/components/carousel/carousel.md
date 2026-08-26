# Carousel

## Purpose

Carousel presents a short sequence of peer items in one bounded horizontal region.

Use Carousel when the sequence must share limited space and direct horizontal browsing helps the task.

Do not use Carousel for required content that should remain visible in normal page flow.

Do not use Carousel for primary application navigation.

## Native basis

Carousel uses a horizontally scrollable container with CSS scroll snap.

Native buttons provide previous, next, and optional direct-slide controls.

The module uses `IntersectionObserver` to track the active slide.

## Native Web APIs

- [`scroll-snap-type`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type) keeps horizontal scrolling aligned to slides.
- [`scroll-snap-align`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-align) defines each slide snap point.
- [`overscroll-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior) limits scroll chaining.
- [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver) tracks the visible slide without a scroll polling loop.
- [`scrollIntoView()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView) moves to a selected slide without smooth scrolling.
- [WAI-ARIA Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) informs the region and slide semantics.

## Structure

```html
<div class="carousel"
     role="region"
     aria-roledescription="carousel"
     aria-label="Featured projects">
  <div class="carousel-viewport">
    <div class="carousel-slide"
         role="group"
         aria-roledescription="slide"
         aria-label="1 of 3">
      First project
    </div>
    <div class="carousel-slide"
         role="group"
         aria-roledescription="slide"
         aria-label="2 of 3">
      Second project
    </div>
    <div class="carousel-slide"
         role="group"
         aria-roledescription="slide"
         aria-label="3 of 3">
      Third project
    </div>
  </div>

  <button class="carousel-prev" type="button" aria-label="Previous slide">
    <i data-lucide="chevron-left" aria-hidden="true"></i>
  </button>
  <button class="carousel-next" type="button" aria-label="Next slide">
    <i data-lucide="chevron-right" aria-hidden="true"></i>
  </button>
</div>
```

Keep the carousel accessible name specific to its content.

Do not include the word “carousel” in the accessible name.

## Dot navigation

Add an empty `.carousel-dots` group when direct slide selection helps the task.

```html
<div class="carousel-dots" role="group" aria-label="Choose a slide"></div>
```

The module creates one button for each slide.

Each generated button has a 24px target and a compact inner marker.

The active marker uses `aria-current="true"`.

Do not use tiny visual indicators as tiny pointer targets.

## Counter

Add `.carousel-counter` when position text helps orientation.

```html
<p class="carousel-counter" aria-live="polite">Slide 1 of 3</p>
```

Use either direct dots, a counter, or both only when each adds useful information.

## Loop mode

Add `data-loop` when circular navigation matches the content.

```html
<div class="carousel"
     data-loop
     role="region"
     aria-roledescription="carousel"
     aria-label="Reference images">
  <!-- Slides and controls. -->
</div>
```

Do not enable looping when the sequence has a meaningful start or end.

## Slide sizing

The canonical component shows one slide at a time.

Create a consumer composition when several slides must remain visible at once.

Do not put inline layout styles in the canonical Carousel markup.

Promote repeated multi-slide sizing to a documented variant before several consumers copy the same override.

## Behavior

Native scrolling remains available with a mouse wheel, trackpad, touch input, or keyboard scrolling.

The previous and next buttons move one slide at a time.

The module disables boundary controls when loop mode is off.

The module updates the active dot and optional counter after the visible slide changes.

The module creates direct-slide buttons when an empty dot group is present.

The component does not autoplay.

The component does not use smooth scrolling.

The component does not animate slide changes.

## Keyboard

Tab moves through the previous, next, and direct-slide buttons.

Enter or Space activates the focused button.

Arrow keys keep their native scrolling behavior when focus is inside scrollable content.

Do not create a second arrow-key focus model for slide content.

## Accessibility

Keep each slide position available through `aria-label` or equivalent visible text.

Give previous and next buttons explicit accessible names.

Hide decorative icons from assistive technology.

Keep direct-slide controls at least 24px by 24px.

Keep disabled boundary controls visually understandable.

Keep required information outside a carousel when hiding peer content would make the task harder.

Do not use an always-live carousel viewport for passive scrolling.

Use the optional counter live region when an explicit control changes the current slide and announcement improves orientation.

## Runtime

Load `carousel.js` whenever Carousel controls or active-slide state are present.

The viewport remains horizontally scrollable without JavaScript.

Previous, next, dots, and active-state synchronization require the module.

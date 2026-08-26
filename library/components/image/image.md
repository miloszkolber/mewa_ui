# Image

## Purpose

Image presents meaningful visual content with an optional caption, fallback, aspect ratio, and larger preview.

Use Image when the visual itself carries information or needs a consistent figure treatment.

Use a normal decorative CSS image when the visual has no content meaning.

Do not use Image as a generic card or layout container.

## Native basis

Image uses `<figure>`, `<img>`, and optional `<figcaption>`.

The optional preview enhancement creates one shared native `<dialog>`.

The module also marks failed images so the documented fallback can appear.

## Native Web APIs

- [`<figure>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure) groups self-contained visual content.
- [`<figcaption>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption) provides a visible caption.
- [`<img>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img) provides intrinsic image loading and alternative text.
- [`loading="lazy"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#loading) defers non-critical images.
- [`aspect-ratio`](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) constrains the figure geometry.
- [`object-fit`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) controls image fitting.
- [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) provides modal preview behavior.

## Structure

```html
<figure class="image">
  <img src="/images/system-map.png"
       alt="Service topology with three worker nodes">
</figure>
```

Add a caption when visible context helps interpretation.

```html
<figure class="image">
  <img src="/images/system-map.png"
       alt="Service topology with three worker nodes">
  <figcaption class="image-caption">
    Current worker topology.
  </figcaption>
</figure>
```

Use `alt=""` when the image is decorative and nearby text already communicates its content.

## Fallback

Add `.image-fallback` when a failed image needs an explicit visual replacement.

```html
<figure class="image">
  <img src="/images/preview.png" alt="Generated preview">
  <div class="image-fallback" aria-hidden="true">
    <i data-lucide="image-off"></i>
  </div>
</figure>
```

Keep important failure information in visible text outside a decorative fallback icon.

## Aspect ratio

Use `data-ratio` only when the image region needs predictable geometry.

Supported values are `1/1`, `4/3`, `3/2`, `16/9`, `21/9`, and `3/4`.

```html
<figure class="image" data-ratio="16/9">
  <img src="/images/preview.png" alt="Generated preview">
</figure>
```

Do not crop information-critical content only to satisfy a ratio.

## Fit

Omit `data-fit` for the default cover treatment.

Use `data-fit="contain"` when the entire image must remain visible.

Use `data-fit="fill"` only when distortion is acceptable.

Use `data-fit="none"` only when natural image dimensions are required.

## Circular variant

Use `data-radius="full"` only when circular image geometry has semantic meaning.

Use Avatar instead when the image represents a person or entity identity.

Do not round normal media or preview surfaces.

## Preview

Add `data-preview` when a larger inspection view improves the task.

```html
<figure class="image" data-preview>
  <img src="/images/log-scan.png" alt="Log scan with highlighted failures">
</figure>
```

The module makes a preview-enabled figure keyboard operable.

The module creates one shared dialog for all preview-enabled images.

The preview provides zoom in, zoom out, rotate left, rotate right, reset, and close controls.

The preview opens with Enter, Space, or pointer activation.

Escape closes the native dialog.

Backdrop activation closes the dialog.

Do not enable preview when the source image has no additional useful detail.

## Behavior

A successful image load shows the image normally.

A failed image receives `data-error` from the module.

A successful later load clears `data-error`.

Preview controls update image zoom and rotation immediately.

Preview state resets each time a new image opens.

The component adds no transition or animation.

## Accessibility

Give every content image an appropriate `alt` value.

Keep decorative images at `alt=""`.

Use a visible caption when users need persistent context.

Let the module derive the preview control name from image alternative text when possible.

Give a preview-enabled figure an explicit label when the derived label is not sufficient.

Keep preview toolbar controls explicitly named.

Do not put essential information only in the enlarged preview.

## Runtime

Load `image.js` when the page uses automatic failure fallback or `data-preview`.

A basic figure and image remain fully readable without JavaScript.

Preview behavior requires the module.

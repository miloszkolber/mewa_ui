// -- Carousel -------------------------------------------------

import { queryAll, createLifecycle, attributeSnapshot } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('carousel');
const slideOwners = new WeakMap();

export function enhance(root) {
  // Re-derive the state of already-enhanced carousels before returning early,
  // so a public property changed on a live carousel takes effect.
  lifecycle.refresh(root);
  queryAll(root, '.carousel').forEach((carousel) => {
    carousel.dataset.init = '';
    if (lifecycle.has(carousel)) return;
    carousel.dataset.mewaCarouselInit = '';

    const viewport = carousel.querySelector('.carousel-viewport');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    const counter = carousel.querySelector('.carousel-counter');
    // A carousel without a viewport cannot work, so do not report it ready.
    if (!viewport) {
      delete carousel.dataset.mewaCarouselInit;
      return;
    }

    const slides = () =>
      Array.from(viewport.querySelectorAll('.carousel-slide')).filter(
        (slide) => slide.closest('.carousel') === carousel
      );
    // Read at use time: this public property can change on a live carousel.
    const isLoop = () => carousel.hasAttribute('data-loop');

    let currentIndex = 0;
    let currentSlide = null;
    let knownSlides = [];

    // ── ARIA setup ───────────────────────────────
    // Every attribute written below is owned here and restored on destroy.
    const { set: setAttribute, restore } = attributeSnapshot();
    lifecycle.add(carousel, restore);

    if (!carousel.hasAttribute('role')) setAttribute(carousel, 'role', 'region');
    setAttribute(carousel, 'aria-roledescription', 'carousel');
    if (!carousel.hasAttribute('aria-label') && !carousel.hasAttribute('aria-labelledby')) {
      setAttribute(carousel, 'aria-label', 'Carousel');
    }

    const slideStates = new Map();
    const generatedDots = new Map();
    const generateDots = dotsContainer && !dotsContainer.children.length;
    const releaseSlide = (slide) => {
      observer.unobserve(slide);
      slideStates.get(slide)?.attributes.restore();
      slideStates.delete(slide);
      if (slideOwners.get(slide) === releaseSlide) slideOwners.delete(slide);
      const dot = generatedDots.get(slide);
      if (dot?.parentElement === dotsContainer) dot.remove();
      generatedDots.delete(slide);
    };

    // ── Scroll to index ─────────────────────────
    const scrollToIndex = (index) => {
      const allSlides = slides();
      if (!allSlides.length) return;

      let target = index;
      if (isLoop()) {
        target = ((index % allSlides.length) + allSlides.length) % allSlides.length;
      } else {
        target = Math.max(0, Math.min(index, allSlides.length - 1));
      }

      const slide = allSlides[target];
      viewport.scrollTo({ left: slide.offsetLeft - viewport.offsetLeft, behavior: 'auto' });
    };

    // ── Update state (buttons, dots, counter) ───
    const updateState = (index) => {
      const allSlides = slides();
      currentIndex = allSlides.length ? Math.max(0, Math.min(index, allSlides.length - 1)) : -1;
      currentSlide = allSlides[currentIndex] || null;

      if (!allSlides.length || !isLoop()) {
        if (prevBtn) prevBtn.disabled = currentIndex <= 0;
        if (nextBtn) nextBtn.disabled = currentIndex >= allSlides.length - 1;
      } else {
        // A loop that was enabled after a non-loop pass left a control
        // disabled at an end, and turning it off needs the end states back.
        if (prevBtn) prevBtn.disabled = false;
        if (nextBtn) nextBtn.disabled = false;
      }

      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, i) => {
          const active = generateDots
            ? generatedDots.get(currentSlide) === dot
            : i === currentIndex;
          if (generateDots) dot.setAttribute('aria-current', active ? 'true' : 'false');
          else setAttribute(dot, 'aria-current', active ? 'true' : 'false');
        });
      }

      if (counter) {
        counter.textContent = `Slide ${currentIndex + 1} of ${allSlides.length}`;
      }

      allSlides.forEach((slide, i) => {
        const state = slideStates.get(slide);
        if (
          !state?.label ||
          slide.getAttribute('aria-label') !== state.label ||
          slide.hasAttribute('aria-labelledby')
        )
          return;
        const label = `${i + 1} of ${allSlides.length}`;
        state.attributes.set(slide, 'aria-label', label);
        state.label = label;
      });
    };

    const visibleSlide = () => {
      const bounds = viewport.getBoundingClientRect();
      let visible = null;
      let greatest = 0;
      slides().forEach((slide) => {
        const rect = slide.getBoundingClientRect();
        const overlap = Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left);
        if (overlap > greatest) {
          visible = slide;
          greatest = overlap;
        }
      });
      return visible || currentSlide;
    };

    // ── IntersectionObserver for current slide ──
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => slideStates.has(entry.target)))
          updateState(slides().indexOf(visibleSlide()));
      },
      { root: viewport, threshold: 0.5 }
    );

    lifecycle.add(carousel, () => observer.disconnect());
    lifecycle.add(carousel, () => {
      for (const slide of slideStates.keys()) releaseSlide(slide);
    });

    const reconcile = () => {
      const allSlides = slides();
      const changed =
        allSlides.length !== knownSlides.length ||
        allSlides.some((slide, i) => slide !== knownSlides[i]);
      for (const slide of slideStates.keys()) {
        if (!allSlides.includes(slide)) releaseSlide(slide);
      }
      allSlides.forEach((slide, i) => {
        if (!slideStates.has(slide)) {
          slideOwners.get(slide)?.(slide);
          const attributes = attributeSnapshot();
          const state = { attributes, label: null };
          attributes.set(slide, 'role', 'group');
          attributes.set(slide, 'aria-roledescription', 'slide');
          if (!slide.hasAttribute('aria-label') && !slide.hasAttribute('aria-labelledby')) {
            state.label = `${i + 1} of ${allSlides.length}`;
            attributes.set(slide, 'aria-label', state.label);
          }
          slideStates.set(slide, state);
          slideOwners.set(slide, releaseSlide);
          observer.observe(slide);
        }
        if (generateDots && !generatedDots.has(slide)) {
          const dot = carousel.ownerDocument.createElement('button');
          dot.type = 'button';
          dot.className = 'carousel-dot';
          generatedDots.set(slide, dot);
        }
        if (generateDots) {
          const dot = generatedDots.get(slide);
          dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        }
      });
      if (generateDots) {
        const ordered = allSlides.map((slide) => generatedDots.get(slide));
        const present = [...dotsContainer.children].filter((dot) => ordered.includes(dot));
        if (ordered.some((dot, i) => dot !== present[i])) dotsContainer.append(...ordered);
      }
      let index = allSlides.indexOf(changed ? currentSlide : visibleSlide());
      if (index === -1) index = Math.max(0, Math.min(currentIndex, allSlides.length - 1));
      // Preserve the current slide's identity through insertion and reordering,
      // and choose the nearest remaining position if that slide was removed.
      if (changed && knownSlides.length && allSlides.length) scrollToIndex(index);
      knownSlides = allSlides;
      updateState(index);
    };
    const contentObserver = new MutationObserver(reconcile);
    contentObserver.observe(viewport, { childList: true, subtree: true });
    lifecycle.add(carousel, () => contentObserver.disconnect());

    // ── Navigation ──────────────────────────────
    const goNext = () => scrollToIndex(currentIndex + 1);
    const goPrev = () => scrollToIndex(currentIndex - 1);

    if (prevBtn) lifecycle.listen(carousel, prevBtn, 'click', goPrev);
    if (nextBtn) lifecycle.listen(carousel, nextBtn, 'click', goNext);

    // ── Dot click handlers ──────────────────────
    if (dotsContainer) {
      lifecycle.listen(carousel, dotsContainer, 'click', (e) => {
        const dot = e.target.closest('.carousel-dot');
        if (!dot || !dotsContainer.contains(dot)) return;
        const dots = Array.from(dotsContainer.querySelectorAll('.carousel-dot'));
        const idx = generateDots
          ? slides().findIndex((slide) => generatedDots.get(slide) === dot)
          : dots.indexOf(dot);
        if (idx !== -1) scrollToIndex(idx);
      });
    }

    // ── Keyboard navigation ─────────────────────
    lifecycle.listen(carousel, carousel, 'keydown', (e) => {
      if (e.defaultPrevented) return;
      if (e.target !== carousel) {
        for (let target = e.target; target && target !== carousel; target = target.parentElement) {
          if (
            target.matches(
              'button, a[href], input, select, textarea, summary, [contenteditable], [role="button"], [role="link"], [role="textbox"], [role="searchbox"], [role="combobox"], [role="listbox"], [role="slider"], [role="spinbutton"], [role="switch"], [role="checkbox"], [role="radio"], [role="tab"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="treeitem"]'
            )
          ) {
            if (
              !target.hasAttribute('contenteditable') ||
              target.getAttribute('contenteditable') !== 'false'
            )
              return;
          }
          if (target.hasAttribute('tabindex')) return;
        }
      }
      const prevKey = 'ArrowLeft';
      const nextKey = 'ArrowRight';
      if (e.key === prevKey) {
        e.preventDefault();
        goPrev();
      }
      if (e.key === nextKey) {
        e.preventDefault();
        goNext();
      }
      if (e.key === 'Home') {
        e.preventDefault();
        scrollToIndex(0);
      }
      if (e.key === 'End') {
        e.preventDefault();
        scrollToIndex(slides().length - 1);
      }
    });

    if (!carousel.hasAttribute('tabindex')) setAttribute(carousel, 'tabindex', '0');

    // A public property can change on an already-enhanced carousel, so
    // re-derive the state the current attributes imply.
    lifecycle.onUpdate(carousel, reconcile);

    // ── Initial state ───────────────────────────
    reconcile();
  });
}

export function destroy(root) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'carousel', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */

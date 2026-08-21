/* -- Resizable component ----------------------------------------- */

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;
const DEFAULT_VALUE = 35;
const DEFAULT_STEP = 1;
const DEFAULT_PAGE_STEP = 10;

function readNumber(element, attribute, fallback) {
  const value = Number.parseFloat(element.getAttribute(attribute) || '');
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundValue(value) {
  return Math.round(value * 1000) / 1000;
}

function formatValue(value) {
  return String(roundValue(value));
}

function getPanels(group) {
  return Array.from(group.children)
    .filter((child) => child.matches('.resizable-panel'))
    .slice(0, 2);
}

function getOutput(root) {
  return Array.from(root.children).find((child) => child.matches('output')) || null;
}

function createOutput(root) {
  const output = document.createElement('output');
  output.className = 'resizable-output';
  output.setAttribute('aria-live', 'polite');
  output.setAttribute('aria-atomic', 'true');
  root.append(output);
  return output;
}

function init() {
  document.querySelectorAll('.resizable:not([data-init])').forEach((root) => {
    root.dataset.init = '';

    const group = root.querySelector('.resizable-group');
    const handle = group?.querySelector('.resizable-handle');
    const panels = group ? getPanels(group) : [];
    if (!group || !handle || panels.length < 2) return;

    const requestedOrientation = handle.getAttribute('aria-orientation')
      || group.dataset.orientation
      || root.dataset.orientation
      || 'vertical';
    const orientation = requestedOrientation === 'horizontal' ? 'horizontal' : 'vertical';
    const isHorizontal = orientation === 'horizontal';
    const dimension = isHorizontal ? 'height' : 'width';
    const coordinate = isHorizontal ? 'clientY' : 'clientX';
    const decreaseKey = isHorizontal ? 'ArrowUp' : 'ArrowLeft';
    const increaseKey = isHorizontal ? 'ArrowDown' : 'ArrowRight';

    handle.setAttribute('aria-orientation', orientation);
    group.dataset.orientation = orientation;
    if (!handle.hasAttribute('tabindex') && handle.tagName !== 'BUTTON') {
      handle.setAttribute('tabindex', '0');
    }

    let minimum = clamp(readNumber(handle, 'aria-valuemin', DEFAULT_MIN), 0, 100);
    let maximum = clamp(readNumber(handle, 'aria-valuemax', DEFAULT_MAX), 0, 100);
    if (maximum < minimum) [minimum, maximum] = [maximum, minimum];
    handle.setAttribute('aria-valuemin', formatValue(minimum));
    handle.setAttribute('aria-valuemax', formatValue(maximum));

    const requestedStep = readNumber(
      handle,
      'data-step',
      readNumber(root, 'data-step', DEFAULT_STEP)
    );
    const step = requestedStep > 0 ? requestedStep : DEFAULT_STEP;
    const requestedPageStep = readNumber(
      handle,
      'data-page-step',
      readNumber(root, 'data-page-step', DEFAULT_PAGE_STEP)
    );
    const pageStep = requestedPageStep >= step ? requestedPageStep : Math.max(step, DEFAULT_PAGE_STEP);

    const containerSize = () => group.getBoundingClientRect()[dimension] || 0;
    const panelSize = () => panels[0].getBoundingClientRect()[dimension] || 0;
    const initialValue = readNumber(handle, 'aria-valuenow', NaN);
    const measuredValue = containerSize() > 0
      ? (panelSize() / containerSize()) * 100
      : DEFAULT_VALUE;
    let value = Number.isFinite(initialValue) ? initialValue : measuredValue;
    const valueLabel = handle.dataset.valueLabel
      || root.dataset.valueLabel
      || handle.getAttribute('aria-label')?.replace(/^resize\s+/i, '').trim()
      || (isHorizontal ? 'Panel height' : 'Panel width');
    let output = getOutput(root);
    if (!output) output = createOutput(root);
    output.classList.add('resizable-output');
    output.setAttribute('aria-live', output.getAttribute('aria-live') || 'polite');
    output.setAttribute('aria-atomic', output.getAttribute('aria-atomic') || 'true');

    function quantize(next) {
      const bounded = clamp(Number(next) || 0, minimum, maximum);
      const stepped = minimum + Math.round((bounded - minimum) / step) * step;
      return roundValue(clamp(stepped, minimum, maximum));
    }

    function announcement(next) {
      const text = `${valueLabel}: ${formatValue(next)} percent`;
      handle.setAttribute('aria-valuenow', formatValue(next));
      handle.setAttribute('aria-valuetext', text);
      output.value = text;
      output.textContent = text;
    }

    function setPanelBasis(next) {
      const size = containerSize();
      if (size <= 0) return;
      panels[0].style.flexBasis = `${size * next / 100}px`;
      panels[0].style.flexGrow = '0';
      panels[0].style.flexShrink = '0';
    }

    function setValue(next, source = 'programmatic', emit = true) {
      const nextValue = quantize(next);
      const changed = nextValue !== value;
      value = nextValue;
      setPanelBasis(value);
      announcement(value);
      if (changed && emit) {
        root.dispatchEvent(new CustomEvent('resizable-change', {
          bubbles: true,
          detail: {
            value,
            percentage: value,
            source,
            orientation,
            panel: panels[0]
          }
        }));
      }
      return changed;
    }

    function setPixelSize(size, source) {
      const container = containerSize();
      if (container <= 0) return false;
      const bounded = clamp(size, container * minimum / 100, container * maximum / 100);
      return setValue((bounded / container) * 100, source);
    }

    setValue(value, 'initial', false);

    handle.addEventListener('keydown', (event) => {
      if (handle.disabled || handle.getAttribute('aria-disabled') === 'true') return;

      let next;
      if (event.key === decreaseKey) next = value - step;
      if (event.key === increaseKey) next = value + step;
      if (event.key === 'PageDown') next = value - pageStep;
      if (event.key === 'PageUp') next = value + pageStep;
      if (event.key === 'Home') next = minimum;
      if (event.key === 'End') next = maximum;
      if (next === undefined) return;

      event.preventDefault();
      setValue(next, 'keyboard');
    });

    let drag = null;

    function finishPointer() {
      if (!drag) return;
      const pointerId = drag.pointerId;
      handle.removeEventListener('pointermove', movePointer);
      handle.removeEventListener('pointerup', finishPointer);
      handle.removeEventListener('pointercancel', finishPointer);
      if (handle.hasPointerCapture?.(pointerId)) {
        handle.releasePointerCapture(pointerId);
      }
      handle.removeAttribute('data-resizing');
      root.removeAttribute('data-resizing');
      drag = null;
    }

    function movePointer(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const position = Number(event[coordinate]);
      if (!Number.isFinite(position)) return;
      setPixelSize(drag.initialSize + position - drag.start, 'pointer');
    }

    function startPointer(event) {
      if (handle.disabled || handle.getAttribute('aria-disabled') === 'true') return;
      if (event.button !== undefined && event.button !== 0) return;
      if (event.isPrimary === false) return;

      event.preventDefault();
      finishPointer();
      const pointerId = Number.isFinite(event.pointerId) ? event.pointerId : 1;
      drag = {
        pointerId,
        start: Number(event[coordinate]) || 0,
        initialSize: panelSize() || (containerSize() * value / 100)
      };
      handle.setAttribute('data-resizing', '');
      root.setAttribute('data-resizing', '');
      try {
        handle.setPointerCapture?.(pointerId);
      } catch {
        // Pointer capture can fail for synthetic events or an inactive pointer.
      }
      handle.addEventListener('pointermove', movePointer);
      handle.addEventListener('pointerup', finishPointer);
      handle.addEventListener('pointercancel', finishPointer);
    }

    handle.addEventListener('pointerdown', startPointer);

    const updateLayout = () => setPanelBasis(value);
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(updateLayout);
      observer.observe(group);
    } else {
      window.addEventListener('resize', updateLayout);
    }
  });
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });

import * as toolbar from '../library/components/actions/toolbar/toolbar.js';
import * as toggleGroup from '../library/components/actions/toggle-group/toggle-group.js';
import * as carousel from '../library/components/data-display/carousel/carousel.js';
import * as avatar from '../library/components/data-display/avatar/avatar.js';
import * as accordion from '../library/components/overlays/accordion/accordion.js';
import { createController } from '../library/runtime/core.js';
import { createEnhancer } from '../library/runtime/enhancer.js';

// Source-controller regressions with source styles; no distribution rebuild is required.
export async function runDynamicMembership() {
  const results = [];
  const styles = [
    '../library/src/base.css',
    '../library/src/tokens.css',
    '../library/components/data-display/carousel/carousel.css'
  ].map((path) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL(path, import.meta.url).href;
    return link;
  });
  try {
    await Promise.all(
      styles.map(
        (link) =>
          new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = () => reject(new Error(`Could not load ${link.href}`));
            document.head.append(link);
          })
      )
    );
  } catch (error) {
    styles.forEach((link) => link.remove());
    return [{ name: 'dynamic membership source styles load', passed: false, error: error.message }];
  }
  const equal = (actual, expected, message) => {
    if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
  };
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
  const frames = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const waitFor = async (condition, message) => {
    for (let frame = 0; frame < 60; frame += 1) {
      if (condition()) return;
      await frames();
    }
    throw new Error(message);
  };
  const test = async (name, html, modules, check) => {
    const fixture = document.createElement('div');
    fixture.innerHTML = html;
    document.body.append(fixture);
    let controllers = [];
    const mount = () => {
      controllers = modules.map((module) => createController(module.behavior, fixture));
    };
    const destroy = () =>
      controllers
        .slice()
        .reverse()
        .forEach((controller) => controller.destroy());
    try {
      await check(fixture, {
        mount,
        destroy,
        update: () => controllers.forEach((controller) => controller.update())
      });
      results.push({ name, passed: true, error: null });
    } catch (error) {
      results.push({ name, passed: false, error: error.message });
    } finally {
      destroy();
      modules
        .slice()
        .reverse()
        .forEach((module) => module.destroy(fixture));
      fixture.remove();
    }
  };

  await test(
    'toolbar automatically replaces its removed entry inside a nested control group',
    `<button type="button">Before</button><div class="toolbar" role="toolbar" aria-label="Editor">
      <div class="toggle-group"><button type="button" class="toggle" aria-pressed="true">First</button>
      <button type="button" class="toggle" aria-pressed="false">Remaining</button></div></div>`,
    [toggleGroup, toolbar],
    async (fixture, lifecycle) => {
      lifecycle.mount();
      const [first, remaining] = fixture.querySelectorAll('.toggle');
      equal(first.tabIndex, 0, 'initial entry');
      first.remove();
      await settle();
      equal(remaining.tabIndex, 0, 'remaining enabled item becomes an entry without update');
      equal(first.getAttribute('tabindex'), null, 'removed control returns to native tab order');
      equal(first.getAttribute('aria-pressed'), 'true', 'removal preserves child pressed state');
      equal(remaining.getAttribute('aria-pressed'), 'false', 'entry does not select the child');
    }
  );
  await test(
    'toolbar releases departed controls and preserves later application tabindex writes',
    `<div class="toolbar" role="toolbar" aria-label="Actions"><button type="button">Entry</button>
      <button type="button" data-native aria-pressed="true">Native</button>
      <button type="button" data-authored tabindex="0">Authored</button>
      <button type="button" data-application>Application</button></div><div data-outside></div>`,
    [toolbar],
    async (fixture, lifecycle) => {
      lifecycle.mount();
      const native = fixture.querySelector('[data-native]');
      const authored = fixture.querySelector('[data-authored]');
      const application = fixture.querySelector('[data-application]');
      application.setAttribute('tabindex', '-2');
      fixture.querySelector('[data-outside]').append(native, authored, application);
      await settle();
      lifecycle.update();
      equal(native.getAttribute('tabindex'), null, 'native tab stop restored');
      equal(authored.getAttribute('tabindex'), '0', 'authored tab stop restored');
      equal(application.getAttribute('tabindex'), '-2', 'later application tab order retained');
      equal(native.getAttribute('aria-pressed'), 'true', 'pressed state retained');
      lifecycle.destroy();
      equal(application.getAttribute('tabindex'), '-2', 'cleanup no longer owns departed control');
    }
  );
  await test(
    'toolbar ownership transfers before the destination saves a moved control baseline',
    `<div class="toolbar" role="toolbar" aria-label="Destination" data-destination>
      <button type="button">Destination entry</button></div>
      <div class="toolbar" role="toolbar" aria-label="Source" data-source><button type="button">Source entry</button>
      <div><button type="button" data-moved tabindex="-2" aria-pressed="true">Moved</button></div></div>
      <div data-outside></div>`,
    [toolbar],
    async (fixture, lifecycle) => {
      lifecycle.mount();
      const source = fixture.querySelector('[data-source]');
      const destination = fixture.querySelector('[data-destination]');
      const moved = fixture.querySelector('[data-moved]');
      destination.append(moved);
      // Force the destination to refresh before the former owner or its observer.
      toolbar.enhance(destination);
      toolbar.destroy(source);
      equal(moved.tabIndex, -1, 'former cleanup cannot undo the destination roving value');
      await settle();
      equal(moved.getAttribute('aria-pressed'), 'true', 'move preserves child state');
      fixture.querySelector('[data-outside]').append(moved);
      await settle();
      equal(
        moved.getAttribute('tabindex'),
        '-2',
        'final owner restores the actual authored baseline'
      );
    }
  );
  await test(
    'toolbar final-tree reconciliation and teardown leave no membership observer active',
    `<div class="toolbar" role="toolbar" aria-label="Actions"><button type="button">Entry</button>
      <div><button type="button" aria-pressed="true">Other</button></div></div>`,
    [toolbar],
    async (fixture, lifecycle) => {
      lifecycle.mount();
      const root = fixture.querySelector('.toolbar');
      const [entry, other] = root.querySelectorAll('button');
      other.focus();
      other.remove();
      root.append(other);
      await settle();
      equal(other.tabIndex, 0, 'same-batch move retains the entry identity');
      equal(entry.tabIndex, -1, 'same-batch move retains one entry');
      lifecycle.destroy();
      entry.remove();
      await settle();
      equal(
        other.getAttribute('tabindex'),
        null,
        'destroyed observer does not rewrite remaining controls'
      );
      lifecycle.mount();
      equal(other.tabIndex, 0, 'remount acquires one entry');
      equal(other.getAttribute('aria-pressed'), 'true', 'remount does not reset child state');
    }
  );
  await test(
    'automatic enhancer retains toolbar entry after active control removal',
    `<div class="toolbar" role="toolbar" aria-label="Actions"><button type="button">First</button>
      <button type="button">Remaining</button></div>`,
    [toolbar],
    async (fixture) => {
      const enhancer = createEnhancer([toolbar.behavior]);
      enhancer.enhance(fixture);
      enhancer.observe(fixture);
      try {
        fixture.querySelector('button').remove();
        await settle();
        equal(fixture.querySelector('button').tabIndex, 0, 'automatic removal leaves an entry');
      } finally {
        enhancer.disconnect();
        enhancer.destroy(fixture);
      }
    }
  );

  const groupMarkup = `<div class="toggle-group" role="group" aria-label="View" data-type="multiple">
    <button type="button" class="toggle" aria-pressed="true" data-first>First</button>
    <button type="button" class="toggle" aria-pressed="false" data-second>Second</button>
    <button type="button" class="toggle" aria-pressed="false" disabled>Unavailable</button></div>`;
  const oneEntry = (root, message) => {
    const toggles = [...root.querySelectorAll('button')];
    equal(toggles.filter((toggle) => toggle.tabIndex === 0 && !toggle.disabled).length, 1, message);
    equal(
      toggles.filter((toggle) => toggle.tabIndex !== -1 && toggle.disabled).length,
      0,
      'disabled controls stay out of the tab order'
    );
    equal(
      toggles.filter((toggle) => toggle.tabIndex >= 0 && !toggle.disabled).length,
      1,
      'only one enabled native Tab entry'
    );
  };
  for (const behaviors of [
    [toolbar.behavior, toggleGroup.behavior],
    [toggleGroup.behavior, toolbar.behavior]
  ]) {
    await test(
      `moving a dynamically inserted Toggle Group out of Toolbar acquires one entry (${behaviors[0].name} first)`,
      '<div data-insertion></div><div data-outside></div><input aria-label="Draft" value="Unsent draft">',
      [toolbar, toggleGroup],
      async (fixture) => {
        const enhancer = createEnhancer(behaviors);
        enhancer.observe(fixture);
        try {
          fixture.querySelector('[data-insertion]').innerHTML =
            `<div class="toolbar" role="toolbar" aria-label="Editor">${groupMarkup}</div>`;
          await settle();
          const group = fixture.querySelector('.toggle-group');
          const draft = fixture.querySelector('input');
          draft.focus();
          fixture.querySelector('[data-outside]').append(group);
          await settle();
          oneEntry(group, 'standalone group regains one entry after automatic ownership transfer');
          equal(
            group.querySelector('[data-first]').tabIndex,
            0,
            'pressed enabled item supplies the standalone entry'
          );
          equal(
            group.querySelector('[data-first]').getAttribute('aria-pressed'),
            'true',
            'move preserves pressed state'
          );
          equal(
            document.activeElement,
            draft,
            'membership reconciliation does not steal draft focus'
          );
          equal(draft.value, 'Unsent draft', 'membership reconciliation preserves the draft');
          enhancer.destroy(fixture.querySelector('.toolbar'));
          oneEntry(group, 'former Toolbar cleanup cannot undo the group entry');
          group.querySelector('[data-second]').click();
          equal(
            group.querySelector('[data-second]').getAttribute('aria-pressed'),
            'true',
            'moved group retains exactly one selection handler'
          );
          equal(
            group.querySelector('[data-first]').getAttribute('aria-pressed'),
            'true',
            'multiple selection remains independent after the move'
          );
        } finally {
          enhancer.disconnect();
          enhancer.destroy(fixture);
        }
      }
    );
  }
  await test(
    'Toggle Group transfers roving ownership into, between, and back out of Toolbars',
    `<div data-outside>${groupMarkup.replace('data-second>', 'data-second tabindex="-2">')}</div>
      <div class="toolbar" role="toolbar" aria-label="First toolbar" data-toolbar-a><button type="button">A entry</button></div>
      <div class="toolbar" role="toolbar" aria-label="Second toolbar" data-toolbar-b><button type="button">B entry</button></div>
      <input aria-label="Draft" value="Keep this draft">`,
    [toggleGroup, toolbar],
    async (fixture, lifecycle) => {
      lifecycle.mount();
      const group = fixture.querySelector('.toggle-group');
      const first = group.querySelector('[data-first]');
      const second = group.querySelector('[data-second]');
      const a = fixture.querySelector('[data-toolbar-a]');
      const b = fixture.querySelector('[data-toolbar-b]');
      const draft = fixture.querySelector('input');
      draft.focus();
      a.append(group);
      toolbar.enhance(a);
      toggleGroup.enhance(group);
      oneEntry(a, 'Toolbar takes over the standalone group keyboard region');
      equal(first.tabIndex, -1, 'group does not maintain a competing entry inside Toolbar');
      first.setAttribute('tabindex', '-3');
      b.append(group);
      // Refresh the group before either toolbar's membership observer runs.
      toggleGroup.enhance(group);
      toolbar.enhance(b);
      toolbar.destroy(a);
      oneEntry(b, 'destination Toolbar keeps one entry after former owner cleanup');
      a.append(group);
      toolbar.enhance(a);
      toggleGroup.enhance(group);
      oneEntry(a, 'moving back restores Toolbar ownership');
      fixture.querySelector('[data-outside]').append(group);
      // Refresh the destination group before its former Toolbar.
      toggleGroup.enhance(group);
      toolbar.enhance(a);
      toolbar.destroy(a);
      toolbar.destroy(b);
      oneEntry(group, 'standalone group owns one entry after repeated moves');
      equal(document.activeElement, draft, 'moves never commandeer external focus');
      equal(draft.value, 'Keep this draft', 'moves preserve the draft');
      equal(first.getAttribute('aria-pressed'), 'true', 'first pressed state is unchanged');
      equal(second.getAttribute('aria-pressed'), 'false', 'second pressed state is unchanged');
      toggleGroup.destroy(group);
      equal(
        first.getAttribute('tabindex'),
        '-3',
        'application tabindex survives all ownership transfers'
      );
      equal(
        second.getAttribute('tabindex'),
        '-2',
        'authored tabindex survives all ownership transfers'
      );
    }
  );
  await test(
    'Toggle Group cleanup inside Toolbar cannot restore obsolete group-owned tabindex',
    `<div data-outside>${groupMarkup}</div><div class="toolbar" role="toolbar" aria-label="Editor">
      <button type="button">Toolbar entry</button></div>`,
    [toggleGroup, toolbar],
    async (fixture, lifecycle) => {
      lifecycle.mount();
      const group = fixture.querySelector('.toggle-group');
      const root = fixture.querySelector('.toolbar');
      root.append(group);
      toolbar.enhance(root);
      toggleGroup.destroy(group);
      oneEntry(root, 'destroying the group leaves Toolbar ownership intact');
      equal(
        group.querySelector('[data-first]').tabIndex,
        -1,
        'old standalone entry is not restored'
      );
      toggleGroup.enhance(group);
      fixture.querySelector('[data-outside]').append(group);
      toggleGroup.enhance(group);
      await settle();
      oneEntry(group, 'remounted group reacquires ownership outside Toolbar');
      lifecycle.destroy();
      equal(
        group.querySelector('[data-first]').getAttribute('tabindex'),
        null,
        'native baseline restored after cleanup'
      );
      equal(
        group.querySelector('[data-second]').getAttribute('tabindex'),
        null,
        'inactive native baseline restored after cleanup'
      );
    }
  );
  await test(
    'standalone Toggle Group membership preserves focused entry and application cleanup values',
    groupMarkup,
    [toggleGroup],
    async (fixture, lifecycle) => {
      lifecycle.mount();
      const group = fixture.querySelector('.toggle-group');
      const first = group.querySelector('[data-first]');
      const second = group.querySelector('[data-second]');
      second.focus();
      lifecycle.update();
      equal(second.tabIndex, 0, 'focused enabled item remains the group entry on update');
      first.setAttribute('tabindex', '-2');
      first.remove();
      await settle();
      equal(first.getAttribute('tabindex'), '-2', 'departed toggle preserves application tabindex');
      oneEntry(group, 'remaining group members retain one entry');
      equal(document.activeElement, second, 'membership updates preserve existing native focus');
      second.setAttribute('tabindex', '-3');
      lifecycle.update();
      lifecycle.destroy();
      equal(
        second.getAttribute('tabindex'),
        '-3',
        'refreshed managed value restores the latest application baseline'
      );
    }
  );

  const carouselMarkup = `<div class="carousel" aria-label="Projects" style="width:400px">
    <div class="carousel-viewport"><div class="carousel-slide" data-first>First</div></div>
    <button type="button" class="carousel-prev" aria-label="Previous slide">Previous</button>
    <button type="button" class="carousel-next" aria-label="Next slide">Next</button>
    <div class="carousel-dots" role="group" aria-label="Choose a slide"></div>
    <p class="carousel-counter" aria-live="polite"></p></div>`;
  const addSlide = (viewport, text, name) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.textContent = text;
    if (name) slide.setAttribute('aria-label', name);
    viewport.append(slide);
    return slide;
  };
  const visible = (viewport, slide) =>
    Math.abs(viewport.getBoundingClientRect().left - slide.getBoundingClientRect().left) < 2;
  const state = (fixture, position, total, previousDisabled, nextDisabled) => {
    equal(
      fixture.querySelector('.carousel-counter').textContent,
      `Slide ${position} of ${total}`,
      'counter'
    );
    equal(fixture.querySelector('.carousel-prev').disabled, previousDisabled, 'previous boundary');
    equal(fixture.querySelector('.carousel-next').disabled, nextDisabled, 'next boundary');
  };
  await test(
    'carousel controller update equips appended slides and tracks native Next and dot clicks',
    carouselMarkup,
    [carousel],
    async (fixture, lifecycle) => {
      lifecycle.mount();
      await frames();
      const viewport = fixture.querySelector('.carousel-viewport');
      const second = addSlide(viewport, 'Second');
      lifecycle.update();
      equal(second.getAttribute('role'), 'group', 'appended slide semantics');
      equal(second.getAttribute('aria-roledescription'), 'slide', 'appended slide description');
      equal(second.getAttribute('aria-label'), '2 of 2', 'appended slide position');
      equal(
        fixture.querySelectorAll('.carousel-dot').length,
        2,
        'one generated control per live slide'
      );
      fixture.querySelector('.carousel-next').click();
      await waitFor(
        () => fixture.querySelector('.carousel-counter').textContent === 'Slide 2 of 2',
        'newly observed slide never becomes current'
      );
      equal(visible(viewport, second), true, 'Next scrolls to the new slide');
      state(fixture, 2, 2, false, true);
      equal(
        fixture.querySelectorAll('.carousel-dot')[1].getAttribute('aria-current'),
        'true',
        'new dot is current'
      );
      fixture.querySelector('.carousel-dot').click();
      await waitFor(
        () => fixture.querySelector('.carousel-counter').textContent === 'Slide 1 of 2',
        'first dot does not navigate'
      );
      state(fixture, 1, 2, true, false);
    }
  );
  await test(
    'carousel automatically reconciles insertion, reorder, removal, and empty endpoints',
    carouselMarkup,
    [carousel],
    async (fixture, lifecycle) => {
      lifecycle.mount();
      await frames();
      const viewport = fixture.querySelector('.carousel-viewport');
      const first = viewport.firstElementChild;
      const second = addSlide(viewport, 'Second', 'Application project');
      const third = addSlide(viewport, 'Third');
      await settle();
      equal(
        fixture.querySelectorAll('.carousel-dot').length,
        3,
        'insertion reconciles without update'
      );
      const thirdDot = fixture.querySelectorAll('.carousel-dot')[2];
      thirdDot.click();
      await waitFor(
        () => fixture.querySelector('.carousel-counter').textContent === 'Slide 3 of 3',
        'third slide never becomes current'
      );
      viewport.prepend(third);
      lifecycle.update();
      await frames();
      equal(
        visible(viewport, third),
        true,
        'reorder retains the current slide identity and visibility'
      );
      state(fixture, 1, 3, true, false);
      equal(
        fixture.querySelector('.carousel-dot'),
        thirdDot,
        'reorder retains generated control identity'
      );
      equal(thirdDot.getAttribute('aria-label'), 'Go to slide 1', 'reorder refreshes dot position');
      equal(
        third.getAttribute('aria-label'),
        '1 of 3',
        'reorder refreshes generated slide position'
      );
      equal(
        second.getAttribute('aria-label'),
        'Application project',
        'authored slide name is not positionalized'
      );
      first.remove();
      await settle();
      equal(first.getAttribute('role'), null, 'departed slide releases generated semantics');
      equal(first.getAttribute('aria-label'), null, 'departed slide releases generated name');
      equal(fixture.querySelectorAll('.carousel-dot').length, 2, 'departed slide control removed');
      state(fixture, 1, 2, true, false);
      third.remove();
      lifecycle.update();
      await frames();
      equal(
        visible(viewport, second),
        true,
        'removed current slide selects a remaining visible slide'
      );
      state(fixture, 1, 1, true, true);
      second.remove();
      await settle();
      state(fixture, 0, 0, true, true);
      equal(
        fixture.querySelectorAll('.carousel-dot').length,
        0,
        'empty carousel has no stale generated controls'
      );
      lifecycle.destroy();
      addSlide(viewport, 'After destroy');
      await settle();
      equal(
        viewport.firstElementChild.getAttribute('role'),
        null,
        'destroyed content observer is inactive'
      );
      lifecycle.mount();
      state(fixture, 1, 1, true, true);
      equal(
        fixture.querySelectorAll('.carousel-dot').length,
        1,
        'remount generates exactly one live control'
      );
    }
  );
  await test(
    'carousel preserves authored names and dot nodes while removing departed slide observation',
    carouselMarkup
      .replace(
        '<div class="carousel-slide" data-first>',
        '<div class="carousel-slide" data-first aria-labelledby="dynamic-project-name">'
      )
      .replace(
        '<div class="carousel-dots" role="group" aria-label="Choose a slide"></div>',
        '<div class="carousel-dots" role="group" aria-label="Choose a slide"><button type="button" class="carousel-dot" aria-label="Choose authored project"><span>Authored control</span></button></div>'
      ) + '<span id="dynamic-project-name">Named project</span><div data-outside></div>',
    [carousel],
    async (fixture, lifecycle) => {
      lifecycle.mount();
      const viewport = fixture.querySelector('.carousel-viewport');
      const first = viewport.firstElementChild;
      const dot = fixture.querySelector('.carousel-dot');
      const content = dot.firstElementChild;
      const second = addSlide(viewport, 'Second', 'Authored second');
      lifecycle.update();
      equal(
        first.getAttribute('aria-labelledby'),
        'dynamic-project-name',
        'authored name relationship retained'
      );
      equal(first.getAttribute('aria-label'), null, 'named slide has no generated name');
      equal(second.getAttribute('aria-label'), 'Authored second', 'authored label retained');
      equal(
        fixture.querySelectorAll('.carousel-dot').length,
        1,
        'authored controls are not regenerated'
      );
      equal(dot.firstElementChild, content, 'authored control content identity retained');
      equal(
        dot.getAttribute('aria-label'),
        'Choose authored project',
        'authored control name retained'
      );
      fixture.querySelector('[data-outside]').append(second);
      await settle();
      const readout = fixture.querySelector('.carousel-counter').textContent;
      await frames();
      equal(
        fixture.querySelector('.carousel-counter').textContent,
        readout,
        'departed slide observation cannot change current state'
      );
      equal(second.getAttribute('role'), null, 'moved slide releases generated role');
      equal(
        second.getAttribute('aria-label'),
        'Authored second',
        'moved slide preserves authored name'
      );
      lifecycle.destroy();
      equal(dot.firstElementChild, content, 'cleanup retains authored control identity');
    }
  );

  const imageSource =
    'data:image/svg+xml,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
  const avatarMarkup = `<span class="avatar"><img class="avatar-image" alt="Casey" style="display:inline-block">
    <span class="avatar-fallback" aria-hidden="true">CN</span></span>`;
  await test(
    'avatar loaded-image cleanup preserves later application display',
    avatarMarkup,
    [avatar],
    async (fixture, lifecycle) => {
      const img = fixture.querySelector('img');
      img.src = imageSource;
      await img.decode();
      lifecycle.mount();
      img.style.display = 'none';
      lifecycle.destroy();
      equal(img.style.display, 'none', 'loaded-image application hiding survives cleanup');
      equal(getComputedStyle(img).display, 'none', 'application hiding remains rendered');
    }
  );
  await test(
    'avatar failed-image cleanup restores only unchanged module display and priority',
    avatarMarkup + avatarMarkup,
    [avatar],
    async (fixture, lifecycle) => {
      const [untouched, edited] = fixture.querySelectorAll('img');
      untouched.style.setProperty('display', 'inline-block', 'important');
      lifecycle.mount();
      equal(untouched.style.display, 'none', 'failed image is hidden');
      edited.style.display = 'inline';
      lifecycle.destroy();
      equal(
        untouched.style.display,
        'inline-block',
        'untouched failed-image display baseline restored'
      );
      equal(
        untouched.style.getPropertyPriority('display'),
        'important',
        'authored display priority restored'
      );
      equal(edited.style.display, 'inline', 'failed-image application display survives cleanup');
    }
  );
  await test(
    'avatar recovery preserves a later application display while restoring untouched failure hiding',
    avatarMarkup + avatarMarkup,
    [avatar],
    async (fixture, lifecycle) => {
      lifecycle.mount();
      const [untouched, edited] = fixture.querySelectorAll('img');
      edited.style.display = 'inline';
      untouched.src = imageSource;
      edited.src = imageSource;
      await Promise.all([untouched.decode(), edited.decode()]);
      await waitFor(
        () => !untouched.hasAttribute('data-error') && !edited.hasAttribute('data-error'),
        'successful image loads never restore avatar state'
      );
      equal(untouched.style.display, 'inline-block', 'successful load relinquishes module hiding');
      equal(edited.style.display, 'inline', 'successful load retains application display');
      equal(
        fixture.querySelector('.avatar-fallback').getAttribute('aria-hidden'),
        'true',
        'fallback semantics restored on load'
      );
    }
  );

  const accordionMarkup = `<div class="accordion" data-type="single"><details class="accordion-item" open>
    <summary>First</summary><p>First content</p></details><details class="accordion-item">
    <summary>Second</summary><p>Second content</p></details></div>`;
  await test(
    'accordion live single to named exclusive mode allows closing every item',
    accordionMarkup.replaceAll(
      'class="accordion-item"',
      'class="accordion-item" name="dynamic-native-exclusive"'
    ),
    [accordion],
    async (fixture, lifecycle) => {
      lifecycle.mount();
      await frames();
      const root = fixture.querySelector('.accordion');
      root.removeAttribute('data-type');
      lifecycle.update();
      root.querySelector('summary').click();
      await frames();
      equal(
        [...root.querySelectorAll('details')].some((item) => item.open),
        false,
        'native exclusive mode allows all closed'
      );
      root.setAttribute('data-type', 'single');
      lifecycle.update();
      lifecycle.update();
      root.querySelector('summary').click();
      await frames();
      root.querySelector('summary').click();
      await frames();
      equal(
        root.querySelector('details').open,
        true,
        'returning to single reopens the last closed item'
      );
      lifecycle.destroy();
      root.querySelector('summary').click();
      await frames();
      equal(root.querySelector('details').open, false, 'cleanup removes mode enforcement');
    }
  );
  await test(
    'accordion live single to unnamed multi-open mode retains both open disclosures',
    accordionMarkup,
    [accordion],
    async (fixture, lifecycle) => {
      lifecycle.mount();
      await frames();
      const root = fixture.querySelector('.accordion');
      const [first, second] = root.querySelectorAll('details');
      root.removeAttribute('data-type');
      lifecycle.update();
      second.querySelector('summary').click();
      await frames();
      equal(first.open && second.open, true, 'ordinary multi-open disclosures remain independent');
      root.setAttribute('data-type', 'single');
      lifecycle.update();
      lifecycle.update();
      second.querySelector('summary').click();
      await frames();
      second.querySelector('summary').click();
      await frames();
      equal(first.open, false, 'single mode closes another item when one opens');
      equal(second.open, true, 'single mode keeps activated item open');
      root.removeAttribute('data-type');
      second.querySelector('summary').click();
      await frames();
      equal(second.open, false, 'live mode removal works without explicit update');
    }
  );
  styles.forEach((link) => link.remove());
  return results;
}

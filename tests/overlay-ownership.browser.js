import * as tooltip from '../library/components/overlays/tooltip/tooltip.js';
import * as hoverCard from '../library/components/overlays/hover-card/hover-card.js';
import * as popover from '../library/components/overlays/popover/popover.js';
import * as navigation from '../library/components/navigation/navigation-menu/navigation-menu.js';
import * as context from '../library/components/overlays/context-menu/context-menu.js';
import * as dropdown from '../library/components/navigation/dropdown-menu/dropdown-menu.js';
import * as command from '../library/components/overlays/command-palette/command-palette.js';
import * as toast from '../library/components/feedback/toast/toast.js';
import { createEnhancer } from '../library/runtime/enhancer.js';
import { createController } from '../library/runtime/core.js';

// Serve source controllers with the build's mewa:auto section removed. These
// checks own their fixtures and enhancer, independently of automatic imports.
export async function runOverlayOwnership() {
  const results = [];
  const equal = (actual, expected, message) => {
    if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
  };
  const key = (target, value, options = {}) => {
    const event = new KeyboardEvent('keydown', {
      key: value,
      bubbles: true,
      cancelable: true,
      ...options
    });
    target.dispatchEvent(event);
    return event;
  };
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
  const until = async (check, message) => {
    const end = performance.now() + 1000;
    while (!check() && performance.now() < end) await settle();
    equal(Boolean(check()), true, message);
  };
  const test = async (name, html, module, check) => {
    const fixture = document.createElement('div');
    fixture.innerHTML = html;
    document.body.append(fixture);
    try {
      module?.enhance(fixture);
      module?.enhance(fixture);
      await check(fixture);
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, error: error.message });
    } finally {
      module?.destroy(fixture);
      fixture.remove();
    }
  };

  for (const [slug, module] of [
    ['popover', popover],
    ['tooltip', tooltip]
  ]) {
    const id = `ownership-late-${slug}`;
    const triggerAttribute =
      slug === 'popover' ? `popovertarget="${id}"` : `data-tooltip-trigger="${id}" data-delay="0"`;
    await test(
      `${slug} retries initialization when its target appears later`,
      `<button type="button" ${triggerAttribute}>Open</button>`,
      module,
      async (fixture) => {
        const trigger = fixture.querySelector('button');
        equal(
          trigger.hasAttribute(`data-mewa-${slug}-init`),
          false,
          'missing target is not initialized'
        );
        const target = document.createElement('div');
        target.id = id;
        target.className = slug;
        target.setAttribute('popover', slug === 'tooltip' ? 'manual' : 'auto');
        target.textContent = 'Later content';
        fixture.append(target);
        module.enhance(target);
        equal(
          Boolean(trigger.style.anchorName),
          true,
          'trigger receives an anchor after insertion'
        );
        equal(
          target.style.positionAnchor,
          trigger.style.anchorName,
          'inserted target is bound to its trigger'
        );
        if (slug === 'tooltip') trigger.focus();
        else trigger.click();
        await until(
          () => target.matches(':popover-open'),
          'later target opens through native activation'
        );
        target.hidePopover();
        module.destroy(fixture);
        equal(trigger.style.anchorName, '', 'retry binding is released on destroy');
        module.enhance(fixture);
        if (slug === 'tooltip') {
          trigger.blur();
          trigger.focus();
        } else trigger.click();
        await until(() => target.matches(':popover-open'), 'remounted later target opens');
      }
    );
  }

  await test(
    'Toast replaces a container detached with its route and releases obsolete resources',
    '<section><div class="toast-container" id="toast-container"></div></section>',
    toast,
    async (fixture) => {
      const api = window.toast;
      let dismissed = 0;
      let actions = 0;
      const old = api.show({
        title: 'Old route',
        duration: 40,
        onDismiss: () => dismissed++,
        action: { label: 'Old action', onClick: () => actions++ }
      });
      const oldContainer = old.parentElement;
      const oldClose = old.querySelector('[data-toast-close]');
      const oldAction = old.querySelector('[data-toast-action]');
      fixture.querySelector('section').remove();
      equal(oldContainer.isConnected, false, 'old container is disconnected');
      equal(Boolean(oldContainer.parentElement), true, 'detached ancestor still owns container');
      const replacement = document.createElement('div');
      replacement.id = 'toast-container';
      replacement.className = 'toast-container';
      fixture.append(replacement);
      toast.enhance(replacement);
      const current = api.show({ title: 'New route', duration: Infinity });
      equal(window.toast, api, 'global and retained API identity survives replacement');
      equal(current.parentElement, replacement, 'retained API uses connected replacement');
      equal(
        replacement.matches(':popover-open'),
        true,
        'replacement opens without InvalidStateError'
      );
      equal(oldContainer.querySelectorAll('.toast').length, 0, 'obsolete generated DOM is removed');
      equal(oldContainer.getAttribute('popover'), null, 'obsolete authored container is restored');
      oldClose.click();
      oldAction.click();
      await new Promise((resolve) => setTimeout(resolve, 60));
      equal(dismissed, 0, 'obsolete dismissal listener and timer are released');
      equal(actions, 0, 'obsolete action listener is released');
      current.querySelector('[data-toast-close]').click();
      equal(replacement.querySelectorAll('.toast').length, 0, 'current close remains functional');
      replacement.setAttribute('popover', 'auto');
      toast.destroy(fixture);
      equal(
        replacement.getAttribute('popover'),
        'auto',
        'application popover edit survives cleanup'
      );
      toast.enhance(fixture);
      const remounted = window.toast.show({ title: 'Remounted', duration: Infinity });
      equal(remounted.parentElement, replacement, 'remount reuses authored replacement');
      window.toast.dismiss();
      equal(replacement.querySelectorAll('.toast').length, 0, 'remounted dismiss works');
    }
  );

  await test(
    'Toast retained API recreates a connected document container without re-enhancement',
    '<section><div class="toast-container" id="toast-container"></div></section>',
    toast,
    async (fixture) => {
      const api = window.toast;
      fixture.querySelector('section').remove();
      const detached = document.createElement('div');
      detached.id = 'toast-container';
      try {
        toast.enhance(detached);
        const current = api.show({ title: 'Still available', duration: Infinity });
        equal(current.isConnected, true, 'Toast is connected');
        equal(current.ownerDocument, document, 'Toast belongs to expected document');
        equal(current.parentElement === detached, false, 'detached candidate is ignored');
        api.dismiss();
      } finally {
        toast.destroy(detached);
      }
    }
  );

  await test(
    'Toast rejects an obsolete container adopted into another connected document',
    '<div class="toast-container" id="toast-container"></div><iframe title="Other document"></iframe>',
    toast,
    async (fixture) => {
      const api = window.toast;
      const oldContainer = fixture.querySelector('#toast-container');
      const foreign = fixture.querySelector('iframe').contentDocument;
      foreign.body.append(oldContainer);
      equal(oldContainer.isConnected, true, 'adopted container is still connected');
      equal(oldContainer.ownerDocument, foreign, 'adopted container belongs to another document');
      const current = api.show({ title: 'Current document', duration: Infinity });
      equal(current.ownerDocument, document, 'retained API creates in its original document');
      equal(current.isConnected, true, 'replacement is connected to original document');
      equal(oldContainer.querySelectorAll('.toast').length, 0, 'foreign container is not used');
      api.dismiss();
    }
  );

  // These cases register the region, not the fixture/document. A document-wide
  // automatic owner would correctly keep its API alive and mask a region leak.
  const adoptedToastMarkup = `<section class="toast-owner"><div class="toast-container" id="toast-container"></div></section>
    <iframe title="Toast destination"></iframe>`;
  for (const baseline of ['absent', 'null', 'object']) {
    await test(
      `Toast adoption into a Window-less document preserves an ${baseline} ambient API`,
      '<section class="toast-owner"><div class="toast-container" id="toast-container"></div></section>',
      null,
      async (fixture) => {
        const prior = window.toast;
        const expected = baseline === 'absent' ? undefined : baseline === 'null' ? null : {};
        const owner = fixture.querySelector('.toast-owner');
        const foreign = document.implementation.createHTMLDocument('Window-less destination');
        let controller;
        try {
          if (expected === undefined) delete window.toast;
          else window.toast = expected;
          controller = createController(toast.behavior, owner);
          equal(window.toast === expected, false, 'original document installs its owned API');
          foreign.body.append(owner);
          equal(foreign.defaultView, null, 'destination actually has no Window');
          equal(owner.isConnected, true, 'adopted owner stays connected');
          controller.update();
          equal(
            window.toast,
            expected,
            'migration releases the original API without reacquiring it'
          );
          controller.destroy();
          controller.destroy();
          equal(window.toast, expected, 'destination cleanup never changes the ambient API');
          const api = toast.enhance(owner);
          equal(typeof api.show, 'function', 'Window-less enhancement still returns a scoped API');
          equal(window.toast, expected, 'direct remount does not install an ambient adapter');
          toast.destroy(owner);
          equal(window.toast, expected, 'direct teardown preserves the ambient baseline');
        } finally {
          controller?.destroy();
          toast.destroy(owner);
          toast.destroy(foreign);
          if (prior === undefined) delete window.toast;
          else window.toast = prior;
          owner.remove();
        }
      }
    );
  }
  for (const disposal of ['region', 'controller', 'ancestor']) {
    await test(
      `Toast ${disposal} teardown releases the acquired document after whole-region adoption`,
      adoptedToastMarkup,
      null,
      async (fixture) => {
        const owner = fixture.querySelector('.toast-owner');
        const frameDocument = fixture.querySelector('iframe').contentDocument;
        const frameView = frameDocument.defaultView;
        const prior = window.toast;
        const priorFrame = frameView.toast;
        let controller;
        let remounted;
        try {
          if (disposal === 'controller') controller = createController(toast.behavior, owner);
          else toast.enhance(owner);
          const api = window.toast;
          let obsoleteDismissals = 0;
          let obsoleteActions = 0;
          const notification = api.show({
            title: 'Original document',
            duration: 40,
            onDismiss: () => obsoleteDismissals++,
            action: { label: 'Old action', onClick: () => obsoleteActions++ }
          });
          const close = notification.querySelector('[data-toast-close]');
          const action = notification.querySelector('[data-toast-action]');
          const ancestor = frameDocument.createElement('main');
          frameDocument.body.append(ancestor);
          ancestor.append(owner);
          equal(owner.ownerDocument, frameDocument, 'whole owner is adopted');
          const dispose = () => {
            if (controller) controller.destroy();
            else toast.destroy(disposal === 'ancestor' ? ancestor : owner);
          };
          dispose();
          equal(window.toast, prior, 'original window API is restored');
          equal(frameView.toast, priorFrame, 'adoption alone installs no destination API');
          equal(
            owner.querySelectorAll('.toast').length,
            0,
            'adopted obsolete notification is removed'
          );
          equal(owner.querySelector('[popover]'), null, 'authored container popover is restored');
          dispose();
          equal(window.toast, prior, 'repeat teardown keeps original restoration');
          close.click();
          action.click();
          await new Promise((resolve) => setTimeout(resolve, 60));
          equal(obsoleteDismissals, 0, 'acquired-document timer and close listener are released');
          equal(obsoleteActions, 0, 'acquired-document action listener is released');

          // A retained standalone API keeps its original document, but does not
          // reinstall the controller-owned window binding after destruction.
          const standalone = api.show({ title: 'Standalone retained API', duration: Infinity });
          equal(
            standalone.ownerDocument,
            document,
            'retained standalone API stays in original document'
          );
          equal(standalone.isConnected, true, 'standalone API remains functional');
          equal(window.toast, prior, 'standalone API does not reinstall old window binding');
          api.dismiss();

          remounted = createController(toast.behavior, owner);
          const frameApi = frameView.toast;
          equal(frameApi === api, false, 'remount owns a distinct destination-document API');
          let currentDismissals = 0;
          const current = frameApi.show({
            title: 'Destination timer',
            duration: 20,
            onDismiss: () => currentDismissals++
          });
          equal(
            current.ownerDocument,
            frameDocument,
            'destination API creates in destination document'
          );
          await until(() => currentDismissals === 1, 'destination timer remains functional');
          const next = frameApi.show({
            title: 'Destination close',
            duration: Infinity,
            onDismiss: () => currentDismissals++
          });
          next.querySelector('[data-toast-close]').click();
          equal(currentDismissals, 2, 'destination close remains functional');
          remounted.destroy();
          remounted.destroy();
          equal(frameView.toast, priorFrame, 'destination API is restored after remount teardown');
          equal(window.toast, prior, 'destination teardown leaves original window alone');
        } finally {
          controller?.destroy();
          remounted?.destroy();
          toast.destroy(owner);
          toast.destroy(frameDocument);
          toast.destroy(document);
        }
      }
    );
  }

  await test(
    'Toast controller update migrates the sole adopted owner and restores both document APIs',
    adoptedToastMarkup,
    null,
    async (fixture) => {
      const owner = fixture.querySelector('.toast-owner');
      const frameDocument = fixture.querySelector('iframe').contentDocument;
      const frameView = frameDocument.defaultView;
      const prior = window.toast;
      const priorFrame = frameView.toast;
      const controller = createController(toast.behavior, owner);
      try {
        const originalApi = window.toast;
        frameDocument.body.append(owner);
        controller.update();
        equal(window.toast, prior, 'migration releases sole original document binding');
        const destinationApi = frameView.toast;
        equal(destinationApi === originalApi, false, 'migration installs destination API');
        const current = destinationApi.show({ title: 'Updated owner', duration: Infinity });
        equal(current.ownerDocument, frameDocument, 'updated controller uses destination document');
        controller.destroy();
        controller.destroy();
        equal(frameView.toast, priorFrame, 'updated controller destroys destination binding');
        equal(
          owner.querySelectorAll('.toast').length,
          0,
          'updated controller releases destination notifications'
        );
      } finally {
        controller.destroy();
        toast.destroy(owner);
        toast.destroy(frameDocument);
        toast.destroy(document);
      }
    }
  );

  await test(
    'Toast adopted-region cleanup leaves unrelated destination standalone API resources intact',
    '<section class="toast-owner"></section><iframe title="Standalone Toast destination"></iframe>',
    null,
    async (fixture) => {
      const owner = fixture.querySelector('.toast-owner');
      const frameDocument = fixture.querySelector('iframe').contentDocument;
      const frameView = frameDocument.defaultView;
      const frameOwner = frameDocument.createElement('section');
      frameDocument.body.append(frameOwner);
      const prior = window.toast;
      const priorFrame = frameView.toast;
      const frameController = createController(toast.behavior, frameOwner);
      const retainedFrameApi = frameView.toast;
      frameController.destroy();
      const standalone = retainedFrameApi.show({
        title: 'Independent destination notification',
        duration: Infinity
      });
      const controller = createController(toast.behavior, owner);
      try {
        frameDocument.body.append(owner);
        controller.destroy();
        equal(
          standalone.isConnected,
          true,
          'adopted-region teardown does not own unrelated standalone resources'
        );
        equal(
          frameView.toast,
          priorFrame,
          'standalone API remains independent of a window adapter'
        );
        equal(
          window.toast,
          prior,
          'adopted-region teardown releases its own original window adapter'
        );
        toast.destroy(frameDocument);
        equal(
          standalone.isConnected,
          false,
          'explicit document cleanup releases standalone resources'
        );
      } finally {
        controller.destroy();
        frameController.destroy();
        toast.destroy(owner);
        toast.destroy(frameDocument);
        toast.destroy(document);
      }
    }
  );

  await test(
    'Toast standalone retained API cleanup preserves an application-owned null window API',
    '<section class="toast-owner"></section>',
    null,
    async (fixture) => {
      const owner = fixture.querySelector('.toast-owner');
      const prior = window.toast;
      const controller = createController(toast.behavior, owner);
      const retained = window.toast;
      try {
        controller.destroy();
        window.toast = null;
        const standalone = retained.show({
          title: 'Standalone without adapter',
          duration: Infinity
        });
        equal(window.toast, null, 'standalone show preserves application window API');
        toast.destroy(document);
        equal(
          standalone.isConnected,
          false,
          'document-wide cleanup releases standalone notification'
        );
        equal(window.toast, null, 'cleanup does not restore an adapter that was never installed');
        equal(
          Object.hasOwn(window, 'toast'),
          true,
          'application-owned null property is not deleted'
        );
      } finally {
        controller.destroy();
        toast.destroy(owner);
        toast.destroy(document);
        if (prior === undefined) delete window.toast;
        else window.toast = prior;
      }
    }
  );

  await test(
    'Toast adoption migration preserves other owners and separates document resources',
    `${adoptedToastMarkup}<section class="other-toast-owner"></section>`,
    null,
    async (fixture) => {
      const owner = fixture.querySelector('.toast-owner');
      const other = fixture.querySelector('.other-toast-owner');
      const frameDocument = fixture.querySelector('iframe').contentDocument;
      const frameView = frameDocument.defaultView;
      const prior = window.toast;
      const priorFrame = frameView.toast;
      const controller = createController(toast.behavior, owner);
      const otherController = createController(toast.behavior, other);
      try {
        const originalApi = window.toast;
        let expired = 0;
        originalApi.show({ title: 'Before migration', duration: 40, onDismiss: () => expired++ });
        frameDocument.body.append(owner);
        controller.update();
        equal(window.toast, originalApi, 'unmigrated owner keeps original API installed');
        equal(
          owner.querySelectorAll('.toast').length,
          0,
          'migration releases obsolete original resources'
        );
        const destinationApi = frameView.toast;
        const destination = destinationApi.show({
          title: 'Destination owner',
          duration: 40,
          onDismiss: () => expired++
        });
        const original = originalApi.show({
          title: 'Other original owner',
          duration: 40,
          onDismiss: () => expired++
        });
        equal(original.ownerDocument, document, 'remaining original owner uses original document');
        equal(destination.ownerDocument, frameDocument, 'migrated owner uses destination document');
        equal(
          original.parentElement === destination.parentElement,
          false,
          'document states own separate containers'
        );
        equal(
          destination.isConnected,
          true,
          'original API resolution leaves destination resources intact'
        );
        controller.destroy();
        equal(frameView.toast, priorFrame, 'migrated owner releases destination API');
        equal(window.toast, originalApi, 'migrated teardown preserves remaining original owner');
        equal(original.isConnected, true, 'migrated teardown preserves original notification');
        otherController.destroy();
        equal(window.toast, prior, 'last original owner restores original API');
        await new Promise((resolve) => setTimeout(resolve, 60));
        equal(expired, 0, 'both destroyed bindings cancel their timers without callbacks');
      } finally {
        controller.destroy();
        otherController.destroy();
        toast.destroy(owner);
        toast.destroy(other);
        toast.destroy(frameDocument);
        toast.destroy(document);
      }
    }
  );

  await test(
    'Toast migration and teardown preserve application replacements of both window APIs',
    adoptedToastMarkup,
    null,
    async (fixture) => {
      const owner = fixture.querySelector('.toast-owner');
      const frameDocument = fixture.querySelector('iframe').contentDocument;
      const frameView = frameDocument.defaultView;
      const prior = window.toast;
      const originalReplacement = { application: 'original document' };
      const destinationPrior = { application: 'destination baseline' };
      const destinationReplacement = { application: 'destination replacement' };
      frameView.toast = destinationPrior;
      const controller = createController(toast.behavior, owner);
      let remounted;
      try {
        const originalApi = window.toast;
        originalApi.show({ title: 'Original binding resources', duration: Infinity });
        window.toast = originalReplacement;
        frameDocument.body.append(owner);
        controller.update();
        equal(
          window.toast,
          originalReplacement,
          'migration preserves application original-window replacement'
        );
        equal(
          owner.querySelectorAll('.toast').length,
          0,
          'application API replacement does not retain original binding resources'
        );
        equal(frameView.toast === destinationPrior, false, 'destination binding installs its API');
        frameView.toast = destinationReplacement;
        controller.destroy();
        equal(
          frameView.toast,
          destinationReplacement,
          'teardown preserves application destination-window replacement'
        );
        equal(
          owner.querySelector('[popover]'),
          null,
          'application API replacement does not prevent resource cleanup'
        );
        remounted = createController(toast.behavior, owner);
        const current = frameView.toast.show({
          title: 'Remounted replacement',
          duration: Infinity
        });
        equal(current.ownerDocument, frameDocument, 'remount still creates in destination');
        remounted.destroy();
        equal(
          frameView.toast,
          destinationReplacement,
          'remount adopts replacement as restoration baseline'
        );
        equal(
          window.toast,
          originalReplacement,
          'destination remount never writes original window'
        );
      } finally {
        controller.destroy();
        remounted?.destroy();
        toast.destroy(owner);
        toast.destroy(frameDocument);
        toast.destroy(document);
        if (prior === undefined) delete window.toast;
        else window.toast = prior;
      }
    }
  );

  await test(
    'Toast adoption keeps independent owners in both documents from sharing a container',
    `${adoptedToastMarkup}<section class="other-toast-owner"></section>`,
    null,
    async (fixture) => {
      const owner = fixture.querySelector('.toast-owner');
      const other = fixture.querySelector('.other-toast-owner');
      const frameDocument = fixture.querySelector('iframe').contentDocument;
      const frameView = frameDocument.defaultView;
      const frameOwner = frameDocument.createElement('section');
      frameDocument.body.append(frameOwner);
      const prior = window.toast;
      const priorFrame = frameView.toast;
      const controller = createController(toast.behavior, owner);
      const otherController = createController(toast.behavior, other);
      let frameController;
      try {
        const originalApi = window.toast;
        let expired = 0;
        const obsolete = originalApi.show({
          title: 'Before container transfer',
          duration: 40,
          onDismiss: () => expired++
        });
        frameDocument.body.append(owner);
        frameController = createController(toast.behavior, frameOwner);
        equal(
          obsolete.isConnected,
          false,
          'destination acquisition releases obsolete original notification'
        );
        const frameApi = frameView.toast;
        const destination = frameApi.show({
          title: 'Independent destination owner',
          duration: 40,
          onDismiss: () => expired++
        });
        controller.destroy();
        equal(window.toast, originalApi, 'remaining original owner keeps original API');
        equal(frameView.toast, frameApi, 'independent destination owner keeps destination API');
        equal(
          destination.isConnected,
          true,
          'original owner cleanup does not erase destination resources'
        );
        const original = originalApi.show({
          title: 'Remaining original owner',
          duration: 40,
          onDismiss: () => expired++
        });
        equal(original.ownerDocument, document, 'remaining original API uses original document');
        equal(
          original.parentElement === destination.parentElement,
          false,
          'independent owners use separate containers'
        );
        equal(destination.isConnected, true, 'original API does not release destination resources');
        otherController.destroy();
        equal(window.toast, prior, 'last original owner restores original API');
        equal(
          destination.isConnected,
          true,
          'last original teardown preserves destination resources'
        );
        frameController.destroy();
        equal(frameView.toast, priorFrame, 'last destination owner restores destination API');
        await new Promise((resolve) => setTimeout(resolve, 60));
        equal(expired, 0, 'all released document resources cancel their timers');
      } finally {
        controller.destroy();
        otherController.destroy();
        frameController?.destroy();
        toast.destroy(owner);
        toast.destroy(other);
        toast.destroy(frameDocument);
        toast.destroy(document);
      }
    }
  );

  for (const [slug, module] of [
    ['tooltip', tooltip],
    ['hover-card', hoverCard],
    ['popover', popover],
    ['navigation-menu', navigation]
  ]) {
    const described = slug === 'tooltip' || slug === 'hover-card';
    const trigger = described
      ? `data-${slug}-trigger="ownership-target"`
      : 'popovertarget="ownership-target"';
    const nav = slug === 'navigation-menu';
    const html = `${nav ? '<nav class="nav-menu">' : ''}
      <button type="button" class="nav-menu-trigger" ${trigger} data-delay="0"
        aria-describedby="authored-help" style="anchor-name: --authored-trigger">Help</button>
      ${nav ? '</nav>' : ''}<div id="ownership-target" class="${nav ? 'nav-menu-content' : slug}"
        popover="${described ? 'manual' : 'auto'}" style="position-anchor: --authored-target">Help</div>`;
    await test(
      `${slug} cleanup preserves application anchors and descriptions`,
      html,
      module,
      async (fixture) => {
        const button = fixture.querySelector('button');
        const target = fixture.querySelector('[popover]');
        button.style.anchorName = '--application-trigger';
        target.style.positionAnchor = '--application-target';
        button.setAttribute('aria-describedby', 'application-help');
        module.destroy(fixture);
        equal(
          button.style.anchorName,
          '--application-trigger',
          'application trigger anchor survives'
        );
        equal(
          target.style.positionAnchor,
          '--application-target',
          'application target anchor survives'
        );
        equal(
          button.getAttribute('aria-describedby'),
          'application-help',
          'application description survives'
        );
        module.enhance(fixture);
        button.focus();
        if (described) {
          await until(() => target.matches(':popover-open'), 'remounted focus opens target');
          key(button, 'Escape');
          equal(target.matches(':popover-open'), false, 'remounted Escape closes target');
        } else {
          button.click();
          equal(target.matches(':popover-open'), true, 'native activation works after remount');
          button.click();
          equal(target.matches(':popover-open'), false, 'native toggle closes after remount');
        }
        module.destroy(fixture);
        equal(
          button.style.anchorName,
          '--application-trigger',
          'remount restores adopted trigger baseline'
        );
        equal(
          target.style.positionAnchor,
          '--application-target',
          'remount restores adopted target baseline'
        );
        equal(
          button.getAttribute('aria-describedby'),
          'application-help',
          'remount restores adopted description'
        );
      }
    );
    await test(
      `${slug} target replacement restores only owned values`,
      html,
      module,
      async (fixture) => {
        const button = fixture.querySelector('button');
        const original = fixture.querySelector('[popover]');
        original.style.positionAnchor = '--application-old-target';
        button.setAttribute('aria-describedby', 'application-help');
        const replacement = original.cloneNode(true);
        replacement.style.positionAnchor = '--replacement-baseline';
        original.replaceWith(replacement);
        module.enhance(replacement);
        equal(
          original.style.positionAnchor,
          '--application-old-target',
          'rebind preserves old application anchor'
        );
        equal(
          replacement.style.positionAnchor.startsWith('--replacement-'),
          false,
          'replacement gets a live anchor'
        );
        if (described)
          equal(
            button.getAttribute('aria-describedby'),
            'application-help ownership-target',
            'rebind adopts current description'
          );
        replacement.style.positionAnchor = '--application-new-target';
        button.style.anchorName = '--application-new-trigger';
        module.destroy(fixture);
        equal(
          button.style.anchorName,
          '--application-new-trigger',
          'new application trigger anchor survives'
        );
        equal(
          replacement.style.positionAnchor,
          '--application-new-target',
          'new application target anchor survives'
        );
        equal(
          button.getAttribute('aria-describedby'),
          'application-help',
          'application description survives replacement cleanup'
        );
      }
    );
  }

  await test(
    'Navigation Menu enhancer rebinds external portal A to B to A with actual anchor placement',
    `<nav class="nav-menu" aria-label="Routes"><button class="nav-menu-trigger" type="button"
      popovertarget="portal-target" style="position: fixed; top: 140px; left: 220px">Routes</button></nav>
      <div class="nav-menu-content" id="portal-target" popover><a href="#route">Route</a></div>`,
    navigation,
    async (fixture) => {
      const links = [];
      const enhancer = createEnhancer([navigation.behavior]);
      try {
        for (const path of [
          'src/base.css',
          'src/tokens.css',
          'components/navigation/navigation-menu/navigation-menu.css'
        ]) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = new URL(`../library/${path}`, import.meta.url).href;
          const loaded = new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = () => reject(new Error(`Stylesheet failed: ${path}`));
          });
          document.head.append(link);
          links.push(link);
          await loaded;
        }
        enhancer.observe(fixture);
        const button = fixture.querySelector('button');
        const a = fixture.querySelector('[popover]');
        const b = a.cloneNode(true);
        b.style.positionAnchor = '';
        for (const [old, current] of [
          [a, b],
          [b, a]
        ]) {
          old.replaceWith(current);
          await until(
            () => current.style.positionAnchor === button.style.anchorName,
            'enhancer binds replacement portal'
          );
          equal(old.style.positionAnchor, '', 'detached portal releases owned anchor');
          button.click();
          equal(current.matches(':popover-open'), true, 'native activation opens replacement');
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          );
          const triggerRect = button.getBoundingClientRect();
          const panelRect = current.getBoundingClientRect();
          equal(
            Math.abs(panelRect.left - triggerRect.left) < 2,
            true,
            'panel aligns with actual trigger left'
          );
          equal(
            panelRect.top >= triggerRect.bottom && panelRect.top <= triggerRect.bottom + 12,
            true,
            'panel sits below actual trigger'
          );
          button.click();
        }
      } finally {
        enhancer.disconnect();
        links.forEach((link) => link.remove());
      }
    }
  );

  await test(
    'Context Menu enhanced clone keeps shared handlers after original removal',
    `<button type="button" data-context-menu-trigger="clone-menu" aria-describedby="authored">Original</button>
      <div class="context-menu-content" id="clone-menu" popover="manual" role="menu">
        <button type="button" role="menuitem" tabindex="-1">Action</button></div>`,
    context,
    async (fixture) => {
      const original = fixture.querySelector('[data-context-menu-trigger]');
      const clone = original.cloneNode(true);
      fixture.append(clone);
      context.enhance(clone);
      context.enhance(clone);
      context.destroy(original);
      original.remove();
      clone.focus();
      key(clone, 'F10', { shiftKey: true });
      const menu = fixture.querySelector('[popover]');
      equal(menu.matches(':popover-open'), true, 'clone is independently registered');
      equal(
        document.activeElement,
        menu.querySelector('button'),
        'clone menu receives managed focus'
      );
      key(document.activeElement, 'Escape');
      equal(menu.matches(':popover-open'), false, 'clone Escape closes');
      equal(document.activeElement, clone, 'clone receives restored focus');
      clone.setAttribute('aria-controls', 'application-controls');
      key(clone, 'ContextMenu');
      equal(menu.matches(':popover-open'), true, 'clone can reopen before active teardown');
      clone.setAttribute('aria-expanded', 'application-state');
      context.destroy(clone);
      equal(
        Boolean(document.__mewaContextMenuInit),
        false,
        'last owner releases document handlers'
      );
      equal(
        clone.getAttribute('aria-controls'),
        'application-controls',
        'application relationship survives cleanup'
      );
      equal(
        clone.getAttribute('aria-expanded'),
        'application-state',
        'application state survives cleanup'
      );
      context.enhance(clone);
      key(clone, 'ContextMenu');
      equal(menu.matches(':popover-open'), true, 'last owner can remount');
      key(document.activeElement, 'Escape');
    }
  );

  for (const [slug, module] of [
    ['context-menu', context],
    ['dropdown-menu', dropdown]
  ]) {
    await test(
      `${slug} skips inherited disabled fieldset items during focus and activation`,
      `<button type="button" data-${slug}-trigger="disabled-menu">Open</button>
        <div class="${slug}-content" id="disabled-menu" popover="${slug === 'context-menu' ? 'manual' : 'auto'}" role="menu">
          <fieldset disabled><button type="button" id="blocked" role="menuitemcheckbox" aria-checked="false" tabindex="-1">Blocked</button></fieldset>
          <button type="button" id="available" role="menuitem" tabindex="-1">Available</button>
          <fieldset disabled><legend><button type="button" id="legend-item" role="menuitem" tabindex="-1">Legend exception</button></legend></fieldset>
        </div>`,
      module,
      async (fixture) => {
        const trigger = fixture.querySelector('button');
        const menu = fixture.querySelector('[popover]');
        const blocked = fixture.querySelector('#blocked');
        const available = fixture.querySelector('#available');
        const legend = fixture.querySelector('#legend-item');
        equal(blocked.disabled, false, 'fixture exercises inherited rather than own disabled');
        equal(
          blocked.matches(':disabled'),
          true,
          'fieldset supplies effective native disabled state'
        );
        trigger.focus();
        if (slug === 'context-menu') key(trigger, 'ContextMenu');
        else trigger.click();
        await until(
          () => document.activeElement === available,
          'opening focuses first effectively enabled item'
        );
        equal(
          blocked.hasAttribute('data-highlighted'),
          false,
          'inherited disabled item is not highlighted'
        );
        key(available, 'End');
        equal(document.activeElement, legend, 'native first-legend exception remains available');
        key(legend, 'Home');
        equal(document.activeElement, available, 'Home skips inherited disabled item');
        key(blocked, 'Enter');
        blocked.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        equal(
          blocked.getAttribute('aria-checked'),
          'false',
          'managed synthetic activation cannot change disabled checkable'
        );
        key(available, 'Escape');
        await until(() => !menu.matches(':popover-open'), 'Escape closes menu');
        equal(document.activeElement, trigger, 'keyboard close restores trigger focus');
      }
    );
  }

  const commandMarkup = `<button type="button" data-command-palette-trigger="ownership-commands">Commands</button>
    <dialog class="command-palette" id="ownership-commands" aria-label="Commands">
      <input class="command-palette-input" aria-label="Find command">
      <div class="command-palette-list"><fieldset disabled>
        <button type="button" class="command-palette-item" id="blocked-command">Blocked</button></fieldset>
        <button type="button" class="command-palette-item" id="available-command">Available</button>
        <button type="button" class="command-palette-item" id="last-command">Last</button></div>
    </dialog>`;
  await test(
    'Context Menu canceled native opening leaves focus and ARIA closed',
    `<button type="button" data-context-menu-trigger="canceled-menu">Open</button>
      <div class="context-menu-content" id="canceled-menu" popover="manual" role="menu">
        <button type="button" role="menuitem" tabindex="-1">Action</button></div>`,
    context,
    async (fixture) => {
      const trigger = fixture.querySelector('button');
      const menu = fixture.querySelector('[popover]');
      menu.addEventListener('beforetoggle', (event) => event.preventDefault(), { once: true });
      trigger.focus();
      key(trigger, 'ContextMenu');
      equal(menu.matches(':popover-open'), false, 'native opening remains canceled');
      equal(
        trigger.getAttribute('aria-expanded'),
        'false',
        'canceled opening exposes closed state'
      );
      equal(document.activeElement, trigger, 'canceled opening does not move focus');
      equal(
        menu.querySelector('[data-highlighted]'),
        null,
        'canceled opening does not highlight an item'
      );
      key(trigger, 'ContextMenu');
      equal(menu.matches(':popover-open'), true, 'later uncanceled opening works');
      key(document.activeElement, 'Escape');
    }
  );
  await test(
    'Command Palette ignores composing global shortcuts',
    commandMarkup,
    command,
    async (fixture) => {
      const trigger = fixture.querySelector('button');
      const dialog = fixture.querySelector('dialog');
      trigger.focus();
      for (const modifier of ['ctrlKey', 'metaKey']) {
        const composing = key(trigger, 'k', { [modifier]: true, isComposing: true });
        equal(dialog.open, false, 'composing shortcut does not open modal');
        equal(composing.defaultPrevented, false, 'composing shortcut keeps native default');
        equal(document.activeElement, trigger, 'composing shortcut keeps editing focus');
      }
    }
  );
  await test(
    'Command Palette effective disabled state governs active descendants and activation',
    commandMarkup,
    command,
    async (fixture) => {
      const trigger = fixture.querySelector('button');
      const dialog = fixture.querySelector('dialog');
      const input = fixture.querySelector('input');
      const available = fixture.querySelector('#available-command');
      let activations = 0;
      fixture.querySelector('#last-command').addEventListener('click', () => activations++);
      trigger.click();
      equal(
        input.getAttribute('aria-activedescendant'),
        available.id,
        'opening skips inherited disabled command'
      );
      key(input, 'ArrowDown');
      equal(
        input.getAttribute('aria-activedescendant'),
        'last-command',
        'movement uses enabled commands'
      );
      key(input, 'Home');
      equal(
        input.getAttribute('aria-activedescendant'),
        available.id,
        'Home skips inherited disabled command'
      );
      available.disabled = true;
      key(input, 'Enter');
      equal(activations, 0, 'unavailable highlighted command never activates its replacement');
      equal(dialog.open, true, 'no substitute command closes the dialog');
      key(input, 'End');
      key(input, 'Enter');
      equal(activations, 1, 'eligible command activates exactly once');
      await until(
        () => !dialog.open && document.activeElement === trigger,
        'activation closes and restores focus'
      );
    }
  );
  await test(
    'Command Palette ignores handled global shortcuts and remounts',
    commandMarkup,
    command,
    async (fixture) => {
      const trigger = fixture.querySelector('button');
      const dialog = fixture.querySelector('dialog');
      trigger.focus();
      trigger.addEventListener('keydown', (event) => event.preventDefault(), { once: true });
      key(trigger, 'k', { ctrlKey: true });
      equal(dialog.open, false, 'already-handled Ctrl+K does not open modal');
      key(trigger, 'k', { ctrlKey: true });
      equal(dialog.open, true, 'ordinary Ctrl+K still opens');
      equal(document.activeElement, fixture.querySelector('input'), 'shortcut focuses search');
      key(document.activeElement, 'k', { ctrlKey: true });
      await until(
        () => !dialog.open && document.activeElement === trigger,
        'shortcut closes and restores prior focus'
      );
      command.destroy(fixture);
      command.enhance(fixture);
      key(trigger, 'k', { metaKey: true });
      equal(dialog.open, true, 'Cmd+K works after remount');
      dialog.requestClose();
      await until(
        () => !dialog.open && document.activeElement === trigger,
        'native close restores focus after remount'
      );
    }
  );
  return results;
}

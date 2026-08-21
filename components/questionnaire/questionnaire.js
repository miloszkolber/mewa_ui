// -- Questionnaire ----------------------------------------------

const QUESTIONNAIRE_SELECTOR = 'form.questionnaire:not([data-init]), form[data-questionnaire]:not([data-init])';
const STEP_SELECTOR = 'fieldset.questionnaire-step, fieldset[data-questionnaire-step]';
const NEXT_SELECTOR = '[data-questionnaire-next], [data-questionnaire-continue], .questionnaire-next, .questionnaire-continue';
const PREVIOUS_SELECTOR = '[data-questionnaire-back], [data-questionnaire-previous], [data-questionnaire-prev], .questionnaire-back, .questionnaire-previous';
const SUBMIT_SELECTOR = '[data-questionnaire-submit], .questionnaire-submit, button[type="submit"]';
const PROGRESS_SELECTOR = '[data-questionnaire-progress], .questionnaire-progress';
const PROGRESS_BAR_SELECTOR = '[data-questionnaire-progress-bar], .questionnaire-progress-bar';

const getSteps = (questionnaire) => Array.from(questionnaire.querySelectorAll(STEP_SELECTOR));

const getIndicators = (questionnaire) => Array.from(
  questionnaire.querySelectorAll('[data-questionnaire-step-indicator], [data-questionnaire-steps] > .step')
);

const getInvalidControl = (step) => Array.from(
  step.querySelectorAll('input, select, textarea')
).find((control) => !control.closest('[hidden]')
  && !control.disabled
  && control.willValidate !== false
  && !control.checkValidity());

const focusStep = (step) => {
  if (!step.hasAttribute('tabindex')) step.setAttribute('tabindex', '-1');
  step.focus();
};

function init() {
  document.querySelectorAll(QUESTIONNAIRE_SELECTOR).forEach((questionnaire) => {
    questionnaire.dataset.init = '';

    const steps = getSteps(questionnaire);
    if (steps.length === 0) {
      questionnaire.removeAttribute('data-init');
      return;
    }

    const progress = questionnaire.querySelector(PROGRESS_SELECTOR);
    const progressBar = questionnaire.querySelector(PROGRESS_BAR_SELECTOR);
    const indicators = getIndicators(questionnaire);
    let index = steps.findIndex((step) => !step.hidden);
    if (index < 0) index = 0;

    const updateProgress = () => {
      const text = `Step ${index + 1} of ${steps.length}`;
      questionnaire.dataset.currentStep = String(index);

      if (progress) {
        progress.setAttribute('role', 'status');
        progress.setAttribute('aria-live', 'polite');
        progress.textContent = text;
        if (progress.matches('progress')) {
          progress.max = steps.length;
          progress.value = index + 1;
        }
      }

      if (progressBar) {
        if (progressBar.matches('progress')) {
          progressBar.max = steps.length;
          progressBar.value = index + 1;
        } else {
          progressBar.setAttribute('aria-valuemin', '1');
          progressBar.setAttribute('aria-valuemax', String(steps.length));
          progressBar.setAttribute('aria-valuenow', String(index + 1));
          progressBar.setAttribute('aria-valuetext', text);
        }
      }
    };

    const updateIndicators = () => {
      indicators.forEach((indicator, item) => {
        const status = item < index ? 'complete' : item === index ? 'current' : '';
        if (status) indicator.dataset.status = status;
        else indicator.removeAttribute('data-status');

        if (item === index) indicator.setAttribute('aria-current', 'step');
        else indicator.removeAttribute('aria-current');
      });
    };

    const updateControls = () => {
      const first = index === 0;
      const last = index === steps.length - 1;

      questionnaire.querySelectorAll(NEXT_SELECTOR).forEach((button) => {
        button.hidden = last;
      });

      questionnaire.querySelectorAll(PREVIOUS_SELECTOR).forEach((button) => {
        button.hidden = first;
        button.disabled = first;
      });

      questionnaire.querySelectorAll(SUBMIT_SELECTOR).forEach((button) => {
        button.hidden = !last;
      });
    };

    const emitChange = (direction) => {
      questionnaire.dispatchEvent(new CustomEvent('questionnaire:change', {
        bubbles: true,
        detail: {
          step: index,
          stepNumber: index + 1,
          total: steps.length,
          question: steps[index],
          direction
        }
      }));
    };

    const update = (nextIndex, shouldFocus = false, direction = 'initial') => {
      index = Math.max(0, Math.min(nextIndex, steps.length - 1));

      steps.forEach((step, item) => {
        step.hidden = item !== index;
        step.dataset.state = item < index ? 'complete' : item === index ? 'current' : 'upcoming';
      });

      updateProgress();
      updateIndicators();
      updateControls();
      if (shouldFocus) focusStep(steps[index]);
      emitChange(direction);
    };

    const advance = () => {
      if (index >= steps.length - 1) return;

      const invalid = getInvalidControl(steps[index]);
      if (invalid) {
        if (typeof invalid.reportValidity === 'function') invalid.reportValidity();
        else invalid.focus();
        return;
      }

      update(index + 1, true, 'next');
    };

    questionnaire.addEventListener('click', (event) => {
      const button = event.target?.closest?.('button, input[type="button"], input[type="submit"]');
      if (!button || !questionnaire.contains(button) || button.disabled || button.hidden) return;

      if (button.matches(NEXT_SELECTOR)) {
        event.preventDefault();
        advance();
        return;
      }

      if (button.matches(PREVIOUS_SELECTOR)) {
        event.preventDefault();
        if (index > 0) update(index - 1, true, 'previous');
      }
    });

    questionnaire.addEventListener('submit', (event) => {
      if (index >= steps.length - 1) return;
      event.preventDefault();
      advance();
    });

    update(index);
  });
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });

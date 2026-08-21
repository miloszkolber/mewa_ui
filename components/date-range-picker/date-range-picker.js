// -- Date Range Picker ------------------------------------------

const DATE_VALUE = /^\d{4}-\d{2}-\d{2}$/;
const ORDER_MESSAGE = 'End date must be on or after the start date.';
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'long',
  timeZone: 'UTC'
});

const isDateValue = (value) => DATE_VALUE.test(value);

const maxDateValue = (...values) => values
  .filter(Boolean)
  .reduce((current, value) => (!current || value > current ? value : current), '');

const minDateValue = (...values) => values
  .filter(Boolean)
  .reduce((current, value) => (!current || value < current ? value : current), '');

const formatDate = (value) => {
  if (!isDateValue(value)) return '';
  const [year, month, day] = value.split('-').map(Number);
  return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
};

const setConstraint = (input, name, value) => {
  input[name] = value || '';
};

const rangeDetail = (start, end, orderInvalid) => ({
  start: start.value || null,
  end: end.value || null,
  complete: Boolean(start.value && end.value),
  valid: !orderInvalid && start.validity.valid && end.validity.valid
});

const updateStatus = (status, startValue, endValue, orderInvalid) => {
  if (!status) return;

  if (!startValue && !endValue) {
    status.textContent = 'No dates selected';
    return;
  }

  if (orderInvalid) {
    status.textContent = ORDER_MESSAGE;
    return;
  }

  if (startValue && endValue) {
    status.textContent = `Selected ${formatDate(startValue)} to ${formatDate(endValue)}`;
    return;
  }

  status.textContent = startValue
    ? `Start date ${formatDate(startValue)} selected. Choose an end date.`
    : `End date ${formatDate(endValue)} selected. Choose a start date.`;
};

function init() {
  document.querySelectorAll('.date-range-picker:not([data-init])').forEach((picker) => {
    picker.dataset.init = '';

    const start = picker.querySelector('[data-range-start]');
    const end = picker.querySelector('[data-range-end]');
    if (!start || !end) return;

    const status = picker.querySelector('[data-range-status]');
    const error = picker.querySelector('[data-range-error]');
    const base = {
      startMin: start.min,
      startMax: start.max,
      endMin: end.min,
      endMax: end.max
    };
    const initial = {
      pickerInvalid: picker.hasAttribute('data-invalid'),
      endInvalid: end.getAttribute('aria-invalid') === 'true',
      errorHidden: error ? error.hidden : true
    };
    let managedEndInvalid = false;
    let managedOrderInvalid = picker.hasAttribute('data-range-order-invalid');

    const sync = () => {
      const startValue = isDateValue(start.value) ? start.value : '';
      const endValue = isDateValue(end.value) ? end.value : '';
      const orderInvalid = Boolean(startValue && endValue && startValue > endValue);

      setConstraint(start, 'min', base.startMin);
      setConstraint(start, 'max', minDateValue(base.startMax, endValue));
      setConstraint(end, 'min', maxDateValue(base.endMin, startValue));
      setConstraint(end, 'max', base.endMax);

      if (orderInvalid) {
        end.setCustomValidity(ORDER_MESSAGE);
      } else if (end.validationMessage === ORDER_MESSAGE) {
        end.setCustomValidity('');
      }

      if (orderInvalid) {
        end.setAttribute('aria-invalid', 'true');
        managedEndInvalid = !initial.endInvalid;
        picker.dataset.invalid = '';
        picker.dataset.rangeOrderInvalid = '';
        if (error) {
          error.hidden = false;
          if (!error.textContent.trim()) {
            error.textContent = ORDER_MESSAGE;
          }
        }
      } else {
        if (managedEndInvalid) {
          end.removeAttribute('aria-invalid');
          managedEndInvalid = false;
        }
        if (!initial.pickerInvalid) picker.removeAttribute('data-invalid');
        picker.removeAttribute('data-range-order-invalid');
        if (error && initial.errorHidden) error.hidden = true;
      }

      updateStatus(status, startValue, endValue, orderInvalid);
      return { orderInvalid, detail: rangeDetail(start, end, orderInvalid) };
    };

    const emitInvalid = (result) => {
      if (result.orderInvalid === managedOrderInvalid) return;
      managedOrderInvalid = result.orderInvalid;
      picker.dispatchEvent(new CustomEvent('date-range:invalid', {
        bubbles: true,
        detail: { ...result.detail, reason: 'order' }
      }));
    };

    const emitChange = () => {
      const result = sync();
      emitInvalid(result);
      picker.dispatchEvent(new CustomEvent('date-range:change', {
        bubbles: true,
        detail: result.detail
      }));
    };

    const handleInput = () => emitInvalid(sync());
    start.addEventListener('input', handleInput);
    end.addEventListener('input', handleInput);
    start.addEventListener('change', emitChange);
    end.addEventListener('change', emitChange);

    const form = picker.closest('form');
    if (form) form.addEventListener('reset', () => queueMicrotask(sync));

    const initialState = sync();
    managedOrderInvalid = initialState.orderInvalid;
  });
}

init();
new MutationObserver(init).observe(document, { childList: true, subtree: true });

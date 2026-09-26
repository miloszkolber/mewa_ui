// -- Date Picker ------------------------------------------------

import { queryAll, createLifecycle, attributeSnapshot } from '../../../runtime/core.js';
/* mewa:auto:start */
import { registerBehavior } from '../../../runtime/enhancer.js';
/* mewa:auto:end */

const lifecycle = createLifecycle('date-picker');

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const longWeekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long' });
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' });

const DAYS = Array.from({ length: 7 }, (_, i) => weekdayFormatter.format(new Date(2024, 0, i)));
const LONG_DAYS = Array.from({ length: 7 }, (_, i) =>
  longWeekdayFormatter.format(new Date(2024, 0, i))
);

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const isToday = (date) => {
  const now = new Date();
  return (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  );
};

const dateKey = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');

const dateFromKey = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const moveMonth = (state, offset) => {
  const next = new Date(state.year, state.month + offset, 1);
  state.year = next.getFullYear();
  state.month = next.getMonth();
};

// The gridcell is the focus target, so aria-selected and the roving tab stop
// live on the same element and a focusable cell carries no nested control.
const setTabStop = (datePicker, activeCell) => {
  datePicker.querySelectorAll('.date-picker-day').forEach((cell) => {
    cell.tabIndex = cell === activeCell ? 0 : -1;
  });
};

const focusDate = (datePicker, value) => {
  const cell = Array.from(datePicker.querySelectorAll('.date-picker-day')).find(
    (candidate) => candidate.dataset.date === value
  );
  if (!cell) return;
  setTabStop(datePicker, cell);
  cell.focus();
};

const renderDatePicker = (el, year, month, selectedDay, setAttribute) => {
  const documentRoot = el.ownerDocument;
  const heading = el.querySelector('.date-picker-heading');
  const grid = el.querySelector('.date-picker-grid');
  if (!grid) return;

  const headingText = `${monthFormatter.format(new Date(year, month, 1))} ${year}`;
  if (heading) {
    heading.textContent = headingText;
    setAttribute(heading, 'aria-live', 'polite');
  }

  setAttribute(grid, 'role', 'grid');
  setAttribute(grid, 'aria-label', headingText);

  const thead = documentRoot.createElement('thead');
  const headerRow = documentRoot.createElement('tr');
  headerRow.setAttribute('role', 'row');
  DAYS.forEach((day, index) => {
    const label = documentRoot.createElement('th');
    label.className = 'date-picker-day-label';
    label.setAttribute('role', 'columnheader');
    label.scope = 'col';
    label.abbr = LONG_DAYS[index];
    label.textContent = day;
    headerRow.append(label);
  });
  thead.append(headerRow);

  const tbody = documentRoot.createElement('tbody');
  const total = daysInMonth(year, month);
  const startDay = new Date(year, month, 1).getDay();
  const rows = Math.ceil((startDay + total) / 7);
  let hasTabStop = false;

  for (let row = 0; row < rows; row++) {
    const tableRow = documentRoot.createElement('tr');
    tableRow.setAttribute('role', 'row');
    for (let column = 0; column < 7; column++) {
      const cellIndex = row * 7 + column;
      const date = new Date(year, month, cellIndex - startDay + 1);
      const outside = date.getMonth() !== month;
      const selected = !outside && date.getDate() === selectedDay;
      const cell = documentRoot.createElement('td');

      cell.className = 'date-picker-day';
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-selected', String(selected));
      cell.dataset.day = String(date.getDate());
      cell.dataset.date = dateKey(date);
      cell.setAttribute('aria-label', dateFormatter.format(date));
      cell.textContent = String(date.getDate());

      if (outside) {
        cell.dataset.outside = date < new Date(year, month, 1) ? 'prev' : 'next';
        cell.tabIndex = -1;
      } else {
        cell.tabIndex = selected || (!hasTabStop && selectedDay === null) ? 0 : -1;
        hasTabStop ||= cell.tabIndex === 0;

        if (isToday(date)) {
          cell.dataset.today = '';
          cell.setAttribute('aria-current', 'date');
        }
        if (selected) cell.dataset.selected = '';
      }

      tableRow.append(cell);
    }
    tbody.append(tableRow);
  }

  grid.replaceChildren(thead, tbody);
};

export function enhance(root) {
  queryAll(root, '.date-picker').forEach((datePicker) => {
    datePicker.dataset.init = '';
    if (lifecycle.has(datePicker)) return;
    const grid = datePicker.querySelector('.date-picker-grid');
    // A date picker without a grid cannot work, so do not report it ready.
    if (!grid) return;
    datePicker.dataset.mewaDatePickerInit = '';

    // The month grid and its ARIA are generated, so destroy has to restore the
    // authored children and attributes, and leave application edits alone.
    const heading = datePicker.querySelector('.date-picker-heading');
    const authoredHeadingText = heading?.textContent ?? null;
    const authoredChildren = Array.from(grid.childNodes);
    const { set: setAttribute, restore } = attributeSnapshot();
    lifecycle.add(datePicker, () => {
      restore();
      if (heading && heading.textContent !== authoredHeadingText)
        heading.textContent = authoredHeadingText;
      if (grid.childNodes.length !== authoredChildren.length)
        grid.replaceChildren(...authoredChildren);
    });

    const now = new Date();
    const state = {
      year: now.getFullYear(),
      month: now.getMonth(),
      selected: null
    };

    renderDatePicker(datePicker, state.year, state.month, state.selected, setAttribute);

    // One selection path for pointer and keyboard, so both re-render, move
    // focus, and publish the same event.
    const selectDate = (day) => {
      const selectedDate = dateFromKey(day.dataset.date);
      state.year = selectedDate.getFullYear();
      state.month = selectedDate.getMonth();
      state.selected = selectedDate.getDate();
      renderDatePicker(datePicker, state.year, state.month, state.selected, setAttribute);
      focusDate(datePicker, dateKey(selectedDate));

      datePicker.dispatchEvent(
        new CustomEvent('date-picker:select', {
          detail: { date: selectedDate },
          bubbles: true
        })
      );
    };

    lifecycle.listen(datePicker, datePicker, 'click', (event) => {
      const nav = event.target.closest('.date-picker-nav');
      if (nav) {
        const action = nav.dataset.action;
        if (action === 'prev-month') moveMonth(state, -1);
        if (action === 'next-month') moveMonth(state, 1);
        if (action === 'prev-month' || action === 'next-month') {
          state.selected = null;
          renderDatePicker(datePicker, state.year, state.month, state.selected, setAttribute);
        }
        return;
      }

      const day = event.target.closest('.date-picker-day');
      if (!day || day.matches('[data-disabled]')) return;
      selectDate(day);
    });

    lifecycle.listen(datePicker, datePicker, 'keydown', (event) => {
      const day = event.target.closest('.date-picker-day');
      if (!day) return;

      // A focusable gridcell is not natively activatable, so Enter and Space
      // select the day here instead of relying on button activation.
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        if (day.matches('[data-disabled]')) return;
        event.preventDefault();
        selectDate(day);
        return;
      }

      const allCells = Array.from(datePicker.querySelectorAll('.date-picker-day'));
      const index = allCells.indexOf(day);
      let next = null;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          next = allCells[index + 1];
          break;
        case 'ArrowLeft':
          event.preventDefault();
          next = allCells[index - 1];
          break;
        case 'ArrowDown':
          event.preventDefault();
          next = allCells[index + 7];
          break;
        case 'ArrowUp':
          event.preventDefault();
          next = allCells[index - 7];
          break;
      }

      if (next) {
        setTabStop(datePicker, next);
        next.focus();
      }
    });
  });
}

export function destroy(root) {
  lifecycle.destroy(root);
}

export const behavior = { name: 'date-picker', enhance, destroy };

/* mewa:auto:start */
registerBehavior(behavior);
/* mewa:auto:end */

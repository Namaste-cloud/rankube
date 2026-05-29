/* =============================================
   Rankube — Filter Renderer (ES Module)
   ============================================= */

import { COUNTRIES, CATEGORIES, LIMITS } from './constants.js';

/**
 * Create a single filter pill element.
 * @param {object} opts
 * @param {string} opts.label
 * @param {string} [opts.prefix] — emoji/icon prefix
 * @param {boolean} opts.isActive
 * @param {string} opts.ariaLabel
 * @param {() => void} opts.onClick
 * @returns {HTMLButtonElement}
 */
function createPill({ label, prefix, isActive, ariaLabel, onClick }) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `filter-pill${isActive ? ' active' : ''}`;
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-selected', String(isActive));
  btn.setAttribute('aria-label', ariaLabel);
  btn.tabIndex = 0;

  if (prefix) {
    const prefixSpan = document.createElement('span');
    prefixSpan.className = 'flag';
    prefixSpan.textContent = prefix;
    prefixSpan.setAttribute('aria-hidden', 'true');
    btn.appendChild(prefixSpan);
  }

  const labelSpan = document.createElement('span');
  labelSpan.textContent = label;
  btn.appendChild(labelSpan);

  btn.addEventListener('click', onClick);
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  });

  return btn;
}

/**
 * Render a filter group with label and pills.
 * @param {string} label
 * @param {HTMLElement[]} pills
 * @returns {HTMLDivElement}
 */
function createFilterGroup(label, pills) {
  const group = document.createElement('div');
  group.className = 'filter-group';

  const labelEl = document.createElement('span');
  labelEl.className = 'filter-group-label';
  labelEl.textContent = label;
  group.appendChild(labelEl);

  const pillsContainer = document.createElement('div');
  pillsContainer.className = 'filter-pills';
  pillsContainer.setAttribute('role', 'tablist');

  pills.forEach((pill) => pillsContainer.appendChild(pill));
  group.appendChild(pillsContainer);

  return group;
}

/**
 * Render all filter groups into the given container.
 * @param {HTMLElement} container
 * @param {{ region: string, type: string, limit: number }} currentState
 * @param {(partialState: object) => void} onChange
 */
export function renderFilters(container, currentState, onChange) {
  container.innerHTML = '';

  // ── Country pills ──
  const countryPills = COUNTRIES.map((country) =>
    createPill({
      label: country.name,
      prefix: country.flag,
      isActive: currentState.region === country.code,
      ariaLabel: `Filter by ${country.name}`,
      onClick: () => onChange({ region: country.code }),
    })
  );

  // ── Category pills ──
  const categoryPills = CATEGORIES.map((cat) =>
    createPill({
      label: cat.label,
      prefix: cat.icon,
      isActive: currentState.type === cat.id,
      ariaLabel: `Filter by ${cat.label} category`,
      onClick: () => onChange({ type: cat.id }),
    })
  );

  // ── Limit pills ──
  const limitPills = LIMITS.map((num) =>
    createPill({
      label: String(num),
      isActive: currentState.limit === num,
      ariaLabel: `Show ${num} videos`,
      onClick: () => onChange({ limit: num }),
    })
  );

  const countryGroup = createFilterGroup('Region', countryPills);
  const categoryGroup = createFilterGroup('Category', categoryPills);
  const limitGroup = createFilterGroup('Limit', limitPills);

  // Add dividers between groups
  container.appendChild(countryGroup);

  const divider1 = document.createElement('div');
  divider1.className = 'filter-divider';
  divider1.setAttribute('aria-hidden', 'true');
  // dividers are visual only, kept inside the filter bar

  container.appendChild(categoryGroup);
  container.appendChild(limitGroup);
}

/**
 * Update the active state of filter pills without full re-render.
 * @param {HTMLElement} container
 * @param {{ region: string, type: string, limit: number }} currentState
 * @param {(partialState: object) => void} onChange
 */
export function updateFilterSelection(container, currentState, onChange) {
  // Full re-render is simple and fast enough for this number of pills
  renderFilters(container, currentState, onChange);
}

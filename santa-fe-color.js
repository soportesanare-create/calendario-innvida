/* Identificación visual de citas de Santa Fe. */
(function () {
  'use strict';

  function applySantaFeColor() {
    document.querySelectorAll('.appointment').forEach((appointment) => {
      const label = appointment.querySelector('span:first-child')?.textContent || '';
      appointment.classList.toggle('branch-santa-fe', /\[\s*santafe\s*\]|\[\s*santa fe\s*\]/i.test(label));
    });
  }

  const style = document.createElement('style');
  style.textContent = [
    ':root { --color-santa-fe: #14B8A6; }',
    '.appointment.branch-santa-fe { background-color: var(--color-santa-fe) !important; }',
    '.appointment.branch-santa-fe:hover { filter: brightness(1.08); }'
  ].join('\n');
  document.head.appendChild(style);

  new MutationObserver(applySantaFeColor).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  document.addEventListener('DOMContentLoaded', applySantaFeColor);
})();

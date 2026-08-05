/* En una vista de sede, el nombre de la sede sería información repetida.
   Se conserva cuando el administrador consulta todas las sedes. */
(function () {
  'use strict';

  function updateBranchLabels() {
    const selector = document.querySelector('header select');
    const headerText = document.querySelector('header')?.textContent || '';
    const isSingleBranchView = selector
      ? selector.value !== 'todas'
      : /Vista:\s*\S+/i.test(headerText);

    document.documentElement.toggleAttribute('data-single-branch-view', isSingleBranchView);
  }

  const style = document.createElement('style');
  style.textContent = [
    'html[data-single-branch-view] .appointment > span:first-child { display: none !important; }'
  ].join('\n');
  document.head.appendChild(style);

  new MutationObserver(updateBranchLabels).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  document.addEventListener('DOMContentLoaded', updateBranchLabels);
})();

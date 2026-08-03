/* Perfil de consulta: la sede Narvarte puede ver su agenda sin modificarla. */
(function () {
  'use strict';

  const SESSION_KEY = 'sanare-session';

  function isNarvarteReadOnly() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      return session && session.username === 'narvarte_consulta' && session.readOnly === true;
    } catch (_) {
      return false;
    }
  }

  function denyChange(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.alert('La sede Narvarte tiene acceso de solo lectura y no puede modificar la agenda.');
  }

  function applyReadOnlyView() {
    const active = isNarvarteReadOnly();
    document.documentElement.toggleAttribute('data-narvarte-readonly', active);
    if (!active) return;

    document.querySelectorAll('button').forEach((button) => {
      if (button.textContent.trim().includes('Nueva Cita')) {
        button.hidden = true;
        button.setAttribute('aria-hidden', 'true');
      }
    });

    document.querySelectorAll('.calendar-cell, .appointment').forEach((element) => {
      element.style.cursor = 'default';
      element.setAttribute('aria-disabled', 'true');
    });

    if (!document.getElementById('narvarte-readonly-notice')) {
      const notice = document.createElement('p');
      notice.id = 'narvarte-readonly-notice';
      notice.textContent = 'Sede Narvarte · Consulta de agenda (solo lectura)';
      notice.style.cssText = 'margin:8px 0 0;text-align:center;color:var(--text-muted);font-size:.82rem;font-weight:600';
      document.querySelector('header .logo-img')?.parentElement?.appendChild(notice);
    }
  }

  document.addEventListener('click', (event) => {
    if (!isNarvarteReadOnly()) return;

    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('.calendar-cell, .appointment')) denyChange(event);

    const button = target.closest('button');
    if (button && /Nueva Cita|Guardar Registro/i.test(button.textContent)) denyChange(event);
  }, true);

  document.addEventListener('submit', (event) => {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    const username = form?.querySelector('input[type="text"]')?.value.trim().toLowerCase();
    const password = form?.querySelector('input[type="password"]')?.value;

    if (username === 'narvarte_consulta' && password === 'narvarteC2026') {
      event.preventDefault();
      event.stopImmediatePropagation();
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        username: 'narvarte_consulta',
        role: 'branch',
        branch: 'narvarte',
        readOnly: true
      }));
      window.location.reload();
      return;
    }

    if (isNarvarteReadOnly()) denyChange(event);
  }, true);

  new MutationObserver(applyReadOnlyView).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  document.addEventListener('DOMContentLoaded', applyReadOnlyView);
})();

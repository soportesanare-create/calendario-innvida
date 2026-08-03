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

    if (!document.getElementById('narvarte-readonly-style')) {
      const style = document.createElement('style');
      style.id = 'narvarte-readonly-style';
      style.textContent = [
        'html[data-narvarte-readonly] button[data-narvarte-create-appointment],',
        'html[data-narvarte-readonly] button[data-narvarte-save-appointment] { display: none !important; }',
        'html[data-narvarte-readonly] .modal-content .color-option { pointer-events: none; opacity: .7; }'
      ].join('\n');
      document.head.appendChild(style);
    }

    document.querySelectorAll('button').forEach((button) => {
      const label = button.textContent.replace(/\s+/g, ' ').trim();
      if (label.includes('Nueva Cita')) {
        button.setAttribute('data-narvarte-create-appointment', 'true');
        button.setAttribute('aria-hidden', 'true');
      }
      if (label.includes('Guardar Registro')) {
        button.setAttribute('data-narvarte-save-appointment', 'true');
        button.setAttribute('aria-hidden', 'true');
      }
    });

    document.querySelectorAll('.calendar-cell, .appointment').forEach((element) => {
      element.style.cursor = 'default';
      element.setAttribute('aria-disabled', 'true');
    });

    document.querySelectorAll('.modal-content input, .modal-content textarea').forEach((field) => {
      field.readOnly = true;
      field.setAttribute('aria-readonly', 'true');
    });

    document.querySelectorAll('.modal-content select').forEach((field) => {
      field.disabled = true;
      field.setAttribute('aria-disabled', 'true');
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
    // Una cita sí puede abrirse para consulta. React detiene su propagación
    // antes de que el clic llegue a la celda del calendario.
    if (!target.closest('.appointment') && target.closest('.calendar-cell')) denyChange(event);

    const button = target.closest('button');
    if (button && /Nueva Cita|Guardar Registro/i.test(button.textContent)) denyChange(event);
  }, true);

  document.addEventListener('submit', (event) => {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    const username = form?.querySelector('input[type="text"]')?.value.trim().toLowerCase();
    const password = form?.querySelector('input[type="password"]')?.value;

    // Este perfil se integra sin alterar el resto de usuarios existentes.
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

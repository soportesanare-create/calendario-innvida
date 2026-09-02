/* Perfiles de consulta: cada sede puede ver su agenda sin modificarla. */
(function () {
  'use strict';

  const SESSION_KEY = 'sanare-session';
  const READ_ONLY_USERS = {
    narvarte_consulta: { password: 'narvarteC2026', branch: 'narvarte', label: 'Narvarte' },
    tijuana_consulta: { password: 'tijuanaC2026', branch: 'tijuana', label: 'Tijuana' },
    toluca_consulta: { password: 'tolucaC2026', branch: 'toluca', label: 'Toluca' },
    morelia_consulta: { password: 'moreliaC2026', branch: 'morelia', label: 'Morelia' }
  };

  function getReadOnlySession() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      return session && READ_ONLY_USERS[session.username] && session.readOnly === true
        ? session
        : null;
    } catch (_) {
      return null;
    }
  }

  function denyChange(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const session = getReadOnlySession();
    const label = READ_ONLY_USERS[session?.username]?.label || 'Esta sede';
    window.alert(`La sede ${label} tiene acceso de solo lectura y no puede modificar la agenda.`);
  }

  function applyReadOnlyView() {
    const session = getReadOnlySession();
    const active = Boolean(session);
    document.documentElement.toggleAttribute('data-branch-readonly', active);
    if (!active) return;

    if (!document.getElementById('branch-readonly-style')) {
      const style = document.createElement('style');
      style.id = 'branch-readonly-style';
      style.textContent = [
        'html[data-branch-readonly] button[data-readonly-create-appointment],',
        'html[data-branch-readonly] button[data-readonly-save-appointment] { display: none !important; }',
        'html[data-branch-readonly] .modal-content .color-option { pointer-events: none; opacity: .7; }'
      ].join('\n');
      document.head.appendChild(style);
    }

    document.querySelectorAll('button').forEach((button) => {
      const label = button.textContent.replace(/\s+/g, ' ').trim();
      if (label.includes('Nueva Cita')) {
        button.setAttribute('data-readonly-create-appointment', 'true');
        button.setAttribute('aria-hidden', 'true');
      }
      if (label.includes('Guardar Registro')) {
        button.setAttribute('data-readonly-save-appointment', 'true');
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

    if (!document.getElementById('branch-readonly-notice')) {
      const notice = document.createElement('p');
      notice.id = 'branch-readonly-notice';
      notice.textContent = `Sede ${READ_ONLY_USERS[session.username].label} · Consulta de agenda (solo lectura)`;
      notice.style.cssText = 'margin:8px 0 0;text-align:center;color:var(--text-muted);font-size:.82rem;font-weight:600';
      document.querySelector('header .logo-img')?.parentElement?.appendChild(notice);
    }
  }

  document.addEventListener('click', (event) => {
    if (!getReadOnlySession()) return;

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

    const profile = READ_ONLY_USERS[username];
    // Estos perfiles se integran sin alterar el resto de usuarios existentes.
    if (profile && password === profile.password) {
      event.preventDefault();
      event.stopImmediatePropagation();
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        username,
        role: 'branch',
        branch: profile.branch,
        readOnly: true
      }));
      window.location.reload();
      return;
    }

    if (getReadOnlySession()) denyChange(event);
  }, true);

  new MutationObserver(applyReadOnlyView).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  document.addEventListener('DOMContentLoaded', applyReadOnlyView);
})();

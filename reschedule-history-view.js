/* Muestra los motivos de reprogramación a administradores y usuarios de consulta. */
(function () {
  'use strict';

  const PROJECT_ID = 'calendario-innvida';
  const API_KEY = 'AIzaSyAZ6_tjZZo0PSagzhEemYaOMgP6GxY1OQ0';
  const MONTHS = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };
  let selectedAppointment = null;

  function canViewHistory() {
    try {
      const session = JSON.parse(localStorage.getItem('sanare-session') || 'null');
      return session?.role === 'admin' || session?.readOnly === true;
    } catch (_) { return false; }
  }

  function getCellDate(cell) {
    const heading = cell?.closest('.glass-panel')?.querySelector('h2')?.textContent.trim().toLowerCase() || '';
    const [, name, rawYear] = heading.match(/(\w+)\s+(\d{4})/) || [];
    let month = MONTHS[name]; let year = Number(rawYear);
    const day = Number(cell?.querySelector('.day-number')?.textContent);
    if (month === undefined || !year || !Number.isInteger(day)) return null;
    if (cell.classList.contains('other-month')) {
      month += day > 20 ? -1 : 1;
      if (month < 0) { month = 11; year -= 1; }
      if (month > 11) { month = 0; year += 1; }
    }
    return new Date(year, month, day, 12, 0, 0);
  }

  function getDetails(appointment) {
    const title = appointment.getAttribute('title') || '';
    const match = title.match(/^\[([^\]]+)\]\s+([^\s]+)\s+-\s+([^\n]+)(?:\n([\s\S]*))?$/);
    return { branch: match?.[1]?.toLowerCase() || '', time: match?.[2] || '', patientName: match?.[3] || '', notes: match?.[4] || '', date: getCellDate(appointment.closest('.calendar-cell')) };
  }

  function isSameDay(iso, date) {
    const source = new Date(iso);
    return source.getFullYear() === date.getFullYear() && source.getMonth() === date.getMonth() && source.getDate() === date.getDate();
  }

  async function loadHistory(details) {
    if (!details?.branch || !details.date) return [];
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/sedes/${encodeURIComponent(details.branch)}/appointments?key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudo consultar el historial.');
    const data = await response.json();
    const document = (data.documents || []).find((item) => {
      const fields = item.fields || {};
      return fields.patientName?.stringValue === details.patientName && fields.time?.stringValue === details.time && fields.notes?.stringValue === details.notes && isSameDay(fields.date?.stringValue, details.date);
    });
    return (document?.fields?.rescheduleHistory?.arrayValue?.values || []).map((item) => item.mapValue?.fields || {}).sort((a, b) => (b.changedAt?.stringValue || '').localeCompare(a.changedAt?.stringValue || ''));
  }

  function formatDate(value) { return value ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
  function renderHistory(modal, history) {
    modal.querySelector('#reschedule-history-view')?.remove();
    const section = document.createElement('section');
    section.id = 'reschedule-history-view'; section.className = 'form-group';
    section.innerHTML = `<label>Historial de reprogramación</label>${history.length ? history.map((entry) => `<div class="reschedule-history-entry"><strong>${formatDate(entry.previousDate?.stringValue)} → ${formatDate(entry.newDate?.stringValue)}</strong><span>${entry.reason?.stringValue || 'Sin motivo registrado'}</span></div>`).join('') : '<p class="reschedule-history-empty">Esta cita no tiene cambios de fecha registrados.</p>'}`;
    modal.querySelector('.modal-actions')?.before(section);
  }

  async function refreshHistory() {
    const modal = document.querySelector('.modal-content');
    if (!modal || !canViewHistory() || !selectedAppointment || modal.querySelector('#reschedule-history-view')) return;
    renderHistory(modal, []);
    try { renderHistory(modal, await loadHistory(selectedAppointment)); }
    catch (error) { console.error(error); }
  }

  document.addEventListener('click', (event) => { const appointment = event.target.closest?.('.appointment'); if (appointment) selectedAppointment = getDetails(appointment); }, true);
  const style = document.createElement('style');
  style.textContent = '#reschedule-history-view { border-top: 1px solid var(--panel-border); padding-top: 14px; }\n.reschedule-history-entry { background: var(--cell-bg); border-left: 3px solid var(--accent-color); border-radius: 6px; display: grid; gap: 4px; margin-top: 8px; padding: 9px 10px; }\n.reschedule-history-entry strong { font-size: .8rem; }\n.reschedule-history-entry span, .reschedule-history-empty { color: var(--text-muted); font-size: .82rem; margin: 0; }';
  document.head.appendChild(style);
  new MutationObserver(refreshHistory).observe(document.documentElement, { childList: true, subtree: true });
})();

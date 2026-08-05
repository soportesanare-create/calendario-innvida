/* Reprogramación por arrastrar y soltar.
   Guarda el nuevo día y conserva el motivo de cada movimiento en Firestore. */
(function () {
  'use strict';

  const PROJECT_ID = 'calendario-innvida';
  const API_KEY = 'AIzaSyAZ6_tjZZo0PSagzhEemYaOMgP6GxY1OQ0';
  const MONTHS = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };
  let draggedAppointment = null;

  function isReadOnly() {
    try { return JSON.parse(localStorage.getItem('sanare-session') || 'null')?.readOnly === true; }
    catch (_) { return false; }
  }

  function getCurrentBranch() {
    const selected = document.querySelector('header select');
    if (selected && selected.value !== 'todas') return selected.value;
    const view = document.querySelector('header')?.textContent.match(/Vista:\s*(\w+)/i);
    return view?.[1]?.toLowerCase() || '';
  }

  function getMonthInfo() {
    const title = document.querySelector('.calendar-cell')?.closest('.glass-panel')?.querySelector('h2')?.textContent.trim().toLowerCase() || '';
    const [, monthName, year] = title.match(/(\w+)\s+(\d{4})/) || [];
    return { month: MONTHS[monthName], year: Number(year) };
  }

  function getCellDate(cell) {
    const day = Number(cell.querySelector('.day-number')?.textContent);
    const { month, year } = getMonthInfo();
    if (!Number.isInteger(day) || month === undefined || !year) return null;
    let targetMonth = month;
    let targetYear = year;
    if (cell.classList.contains('other-month')) {
      if (day > 20) targetMonth -= 1;
      else targetMonth += 1;
      if (targetMonth < 0) { targetMonth = 11; targetYear -= 1; }
      if (targetMonth > 11) { targetMonth = 0; targetYear += 1; }
    }
    return new Date(targetYear, targetMonth, day, 12, 0, 0);
  }

  function sameDay(isoDate, date) {
    const source = new Date(isoDate);
    return source.getFullYear() === date.getFullYear() && source.getMonth() === date.getMonth() && source.getDate() === date.getDate();
  }

  function appointmentDetails(element) {
    const title = element.getAttribute('title') || '';
    const match = title.match(/^\[([^\]]+)\]\s+([^\s]+)\s+-\s+([^\n]+)(?:\n([\s\S]*))?$/);
    return {
      branch: match?.[1]?.toLowerCase() || getCurrentBranch(),
      time: match?.[2] || '', patientName: match?.[3] || '', notes: match?.[4] || '',
      sourceDate: getCellDate(element.closest('.calendar-cell'))
    };
  }

  async function findAppointment(details) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/sedes/${encodeURIComponent(details.branch)}/appointments?key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudo consultar la cita.');
    const payload = await response.json();
    const document = (payload.documents || []).find((item) => {
      const fields = item.fields || {};
      return fields.patientName?.stringValue === details.patientName && fields.time?.stringValue === details.time && sameDay(fields.date?.stringValue, details.sourceDate) && (fields.notes?.stringValue || '') === details.notes;
    });
    if (!document) throw new Error('No se encontró una coincidencia única para la cita.');
    return document;
  }

  async function moveAppointment(details, targetDate, reason) {
    const document = await findAppointment(details);
    const previousDate = document.fields.date.stringValue;
    const newDate = targetDate.toISOString();
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit?key=${API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ writes: [{
        update: { name: document.name, fields: { date: { stringValue: newDate } } },
        updateMask: { fieldPaths: ['date'] },
        updateTransforms: [{ fieldPath: 'rescheduleHistory', appendMissingElements: { values: [{ mapValue: { fields: {
          previousDate: { stringValue: previousDate }, newDate: { stringValue: newDate },
          reason: { stringValue: reason }, changedAt: { stringValue: new Date().toISOString() }
        } } }] } }]
      }] })
    });
    if (!response.ok) throw new Error('No se pudo guardar la reprogramación.');
  }

  function clearDropTargets() { document.querySelectorAll('.calendar-cell.drag-target').forEach((cell) => cell.classList.remove('drag-target')); }
  function setupAppointments() { document.querySelectorAll('.appointment').forEach((item) => { item.draggable = !isReadOnly(); item.style.cursor = isReadOnly() ? 'default' : 'grab'; }); }

  document.addEventListener('dragstart', (event) => {
    const appointment = event.target.closest?.('.appointment');
    if (!appointment || isReadOnly()) return;
    draggedAppointment = appointmentDetails(appointment);
    event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', 'appointment'); appointment.classList.add('dragging');
  });
  document.addEventListener('dragover', (event) => {
    const cell = event.target.closest?.('.calendar-cell');
    if (!draggedAppointment || !cell) return;
    event.preventDefault(); clearDropTargets(); cell.classList.add('drag-target'); event.dataTransfer.dropEffect = 'move';
  });
  document.addEventListener('drop', async (event) => {
    const cell = event.target.closest?.('.calendar-cell'); const details = draggedAppointment;
    clearDropTargets(); if (!details || !cell) return;
    event.preventDefault(); draggedAppointment = null;
    const targetDate = getCellDate(cell);
    if (!targetDate || sameDay(details.sourceDate.toISOString(), targetDate)) return;
    const reason = window.prompt(`Justifica el cambio al ${targetDate.toLocaleDateString('es-MX')}:`);
    if (!reason || !reason.trim()) { window.alert('La cita no se movió: la justificación es obligatoria.'); return; }
    try { await moveAppointment(details, targetDate, reason.trim()); }
    catch (error) { console.error(error); window.alert(error.message || 'No se pudo reprogramar la cita.'); }
  });
  document.addEventListener('dragend', () => { draggedAppointment = null; clearDropTargets(); document.querySelectorAll('.appointment.dragging').forEach((item) => item.classList.remove('dragging')); });

  const style = document.createElement('style');
  style.textContent = '.appointment[draggable="true"]:active { cursor: grabbing; }\n.calendar-cell.drag-target { border-color: var(--accent-color) !important; background: var(--cell-hover-bg) !important; }\n.appointment.dragging { opacity: .45; }';
  document.head.appendChild(style);
  new MutationObserver(setupAppointments).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', setupAppointments);
})();

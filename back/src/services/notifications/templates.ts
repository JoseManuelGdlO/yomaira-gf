import type { AppointmentContext, AppointmentNotificationEvent } from './types';

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

function fmtDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

function bodyBlock(ctx: AppointmentContext): string {
  const source =
    ctx.scheduledBy === 'patient' ? '<p><em>Solicitud en línea del paciente.</em></p>' : '';
  return `
    ${source}
    <p><strong>Paciente:</strong> ${ctx.patientName}</p>
    <p><strong>Tutor:</strong> ${ctx.guardian}</p>
    <p><strong>Fecha:</strong> ${fmtDate(ctx.date)} a las ${ctx.time}</p>
    <p><strong>Motivo:</strong> ${ctx.reason || '—'}</p>
    <p><strong>Estado:</strong> ${STATUS_LABELS[ctx.status] ?? ctx.status}</p>
  `;
}

export function emailContent(
  event: AppointmentNotificationEvent,
  ctx: AppointmentContext,
  audience: 'doctor' | 'patient',
): { subject: string; html: string; text: string } {
  const clinic = ctx.clinicName;
  const when = `${fmtDate(ctx.date)} ${ctx.time}`;

  const subjects: Record<AppointmentNotificationEvent, { doctor: string; patient: string }> = {
    created: {
      doctor: `Nueva cita — ${ctx.patientName} (${when})`,
      patient: `Cita registrada — ${clinic}`,
    },
    confirmed: {
      doctor: `Cita confirmada — ${ctx.patientName}`,
      patient: `Su cita fue confirmada — ${clinic}`,
    },
    cancelled: {
      doctor: `Cita cancelada — ${ctx.patientName}`,
      patient: `Su cita fue cancelada — ${clinic}`,
    },
    completed: {
      doctor: `Cita completada — ${ctx.patientName}`,
      patient: `Consulta completada — ${clinic}`,
    },
  };

  const intros: Record<AppointmentNotificationEvent, { doctor: string; patient: string }> = {
    created: {
      doctor: 'Se registró una nueva cita en la agenda.',
      patient: 'Su cita fue registrada en el consultorio. Pendiente de confirmación.',
    },
    confirmed: {
      doctor: 'La cita pasó a estado confirmada.',
      patient: 'Le confirmamos su cita. Por favor asista puntualmente.',
    },
    cancelled: {
      doctor: 'La cita fue cancelada.',
      patient: 'Su cita fue cancelada. Si necesita reagendar, contacte al consultorio.',
    },
    completed: {
      doctor: 'La cita fue marcada como completada.',
      patient: 'Gracias por su visita al consultorio.',
    },
  };

  const subject = subjects[event][audience];
  const intro = intros[event][audience];
  const html = `
    <div style="font-family:sans-serif;max-width:560px">
      <h2 style="color:#333">${clinic}</h2>
      <p>${intro}</p>
      ${bodyBlock(ctx)}
      <p style="color:#666;font-size:12px;margin-top:24px">Mensaje automático de MedFlow.</p>
    </div>
  `;
  const text = `${intro}\nPaciente: ${ctx.patientName}\nFecha: ${when}\nEstado: ${ctx.status}`;

  return { subject, html, text };
}

export function pushContent(
  event: AppointmentNotificationEvent,
  ctx: AppointmentContext,
): { title: string; body: string } {
  const when = `${fmtDate(ctx.date)} ${ctx.time}`;
  const map: Record<AppointmentNotificationEvent, { title: string; body: string }> = {
    created: {
      title: 'Nueva cita',
      body: `${ctx.patientName} — ${when}`,
    },
    confirmed: {
      title: 'Cita confirmada',
      body: `${ctx.patientName} — ${when}`,
    },
    cancelled: {
      title: 'Cita cancelada',
      body: `${ctx.patientName} — ${when}`,
    },
    completed: {
      title: 'Cita completada',
      body: `${ctx.patientName} — ${when}`,
    },
  };
  return map[event];
}

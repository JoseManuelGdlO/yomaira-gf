export type AppointmentNotificationEvent = 'created' | 'confirmed' | 'cancelled' | 'completed';

export type AppointmentContext = {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail: string | null;
  guardian: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  scheduledBy: 'staff' | 'patient';
  clinicName: string;
};

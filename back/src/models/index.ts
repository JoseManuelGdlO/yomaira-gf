import { sequelize } from '../config/database';
import { User } from './User';
import { Role } from './Role';
import { Permission } from './Permission';
import { UserRole } from './UserRole';
import { RolePermission } from './RolePermission';
import { Branding } from './Branding';
import { Patient } from './Patient';
import { Appointment } from './Appointment';
import { Consultation } from './Consultation';
import { Medication } from './Medication';
import { Prescription } from './Prescription';
import { PrescriptionItem } from './PrescriptionItem';
import { ClinicalQuestion } from './ClinicalQuestion';
import { ClinicalAnswer } from './ClinicalAnswer';
import { PatientDentalChart } from './PatientDentalChart';
import { TreatmentBudget } from './TreatmentBudget';
import { PatientFranklReading } from './PatientFranklReading';
import { InventoryItem } from './InventoryItem';
import { ConsultationInventoryUsage } from './ConsultationInventoryUsage';

export type { FranklScale, DentitionType } from './PatientDentalChart';
export type { FranklReadingScale } from './PatientFranklReading';
export type { BudgetItem } from './TreatmentBudget';
import { NotificationPreference } from './NotificationPreference';
import { PushSubscription } from './PushSubscription';
import { GoogleCalendarConnection } from './GoogleCalendarConnection';
import { AppointmentCalendarEvent } from './AppointmentCalendarEvent';
import { NotificationLog } from './NotificationLog';

User.hasOne(NotificationPreference, { foreignKey: 'userId', as: 'notificationPreference' });
NotificationPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(PushSubscription, { foreignKey: 'userId', as: 'pushSubscriptions' });
PushSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(GoogleCalendarConnection, { foreignKey: 'userId', as: 'googleCalendarConnection' });
GoogleCalendarConnection.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Appointment.hasMany(AppointmentCalendarEvent, { foreignKey: 'appointmentId', as: 'calendarEvents' });
AppointmentCalendarEvent.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
AppointmentCalendarEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

UserRole.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
UserRole.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'userId',
  otherKey: 'roleId',
});
Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'roleId',
  otherKey: 'userId',
});

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', otherKey: 'permissionId' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', otherKey: 'roleId' });

Patient.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments', onDelete: 'CASCADE' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Patient.hasMany(Consultation, { foreignKey: 'patientId', as: 'consultations', onDelete: 'CASCADE' });
Consultation.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Patient.hasMany(Prescription, { foreignKey: 'patientId', as: 'prescriptions', onDelete: 'CASCADE' });
Prescription.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescriptionId', as: 'items', onDelete: 'CASCADE' });
PrescriptionItem.belongsTo(Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });

Patient.hasMany(ClinicalAnswer, { foreignKey: 'patientId', as: 'clinicalAnswers', onDelete: 'CASCADE' });
ClinicalAnswer.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Patient.hasOne(PatientDentalChart, { foreignKey: 'patientId', as: 'dentalChart', onDelete: 'CASCADE' });
PatientDentalChart.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
PatientDentalChart.belongsTo(Branding, { foreignKey: 'brandingId', as: 'branding' });

Patient.hasMany(TreatmentBudget, { foreignKey: 'patientId', as: 'treatmentBudgets', onDelete: 'CASCADE' });
TreatmentBudget.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
TreatmentBudget.belongsTo(Branding, { foreignKey: 'brandingId', as: 'branding' });

Patient.hasMany(PatientFranklReading, { foreignKey: 'patientId', as: 'franklReadings', onDelete: 'CASCADE' });
PatientFranklReading.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
PatientFranklReading.belongsTo(Branding, { foreignKey: 'brandingId', as: 'branding' });
PatientFranklReading.belongsTo(Consultation, { foreignKey: 'consultationId', as: 'consultation' });
PatientFranklReading.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

Branding.hasMany(User, { foreignKey: 'brandingId', as: 'users', onDelete: 'RESTRICT' });
User.belongsTo(Branding, { foreignKey: 'brandingId', as: 'branding' });

Branding.hasMany(Role, { foreignKey: 'brandingId', as: 'roles', onDelete: 'CASCADE' });
Role.belongsTo(Branding, { foreignKey: 'brandingId', as: 'branding' });

Branding.hasMany(Patient, { foreignKey: 'brandingId', as: 'patients', onDelete: 'CASCADE' });
Patient.belongsTo(Branding, { foreignKey: 'brandingId', as: 'branding' });

Branding.hasMany(Appointment, { foreignKey: 'brandingId', as: 'appointments', onDelete: 'CASCADE' });
Appointment.belongsTo(Branding, { foreignKey: 'brandingId', as: 'branding' });

Branding.hasMany(Medication, { foreignKey: 'brandingId', as: 'medications', onDelete: 'CASCADE' });
Medication.belongsTo(Branding, { foreignKey: 'brandingId', as: 'branding' });

Branding.hasMany(InventoryItem, { foreignKey: 'brandingId', as: 'inventoryItems', onDelete: 'CASCADE' });
InventoryItem.belongsTo(Branding, { foreignKey: 'brandingId', as: 'branding' });

Consultation.hasMany(ConsultationInventoryUsage, {
  foreignKey: 'consultationId',
  as: 'inventoryUsages',
  onDelete: 'CASCADE',
});
ConsultationInventoryUsage.belongsTo(Consultation, { foreignKey: 'consultationId', as: 'consultation' });
ConsultationInventoryUsage.belongsTo(InventoryItem, { foreignKey: 'inventoryItemId', as: 'inventoryItem' });
InventoryItem.hasMany(ConsultationInventoryUsage, {
  foreignKey: 'inventoryItemId',
  as: 'consultationUsages',
  onDelete: 'RESTRICT',
});

Branding.hasMany(ClinicalQuestion, { foreignKey: 'brandingId', as: 'clinicalQuestions', onDelete: 'CASCADE' });
ClinicalQuestion.belongsTo(Branding, { foreignKey: 'brandingId', as: 'branding' });

Branding.hasMany(NotificationLog, { foreignKey: 'brandingId', as: 'notificationLogs', onDelete: 'CASCADE' });
NotificationLog.belongsTo(Branding, { foreignKey: 'brandingId', as: 'branding' });

export {
  sequelize,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  Branding,
  Patient,
  Appointment,
  Consultation,
  Medication,
  Prescription,
  PrescriptionItem,
  ClinicalQuestion,
  ClinicalAnswer,
  PatientDentalChart,
  TreatmentBudget,
  PatientFranklReading,
  InventoryItem,
  ConsultationInventoryUsage,
  NotificationPreference,
  PushSubscription,
  GoogleCalendarConnection,
  AppointmentCalendarEvent,
  NotificationLog,
};

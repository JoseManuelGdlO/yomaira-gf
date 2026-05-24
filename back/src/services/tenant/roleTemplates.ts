export const PERMISSION_CODES = [
  'users.read',
  'users.write',
  'users.delete',
  'roles.read',
  'roles.write',
  'patients.read',
  'patients.write',
  'patients.delete',
  'appointments.read',
  'appointments.write',
  'appointments.delete',
  'consultations.read',
  'consultations.write',
  'consultations.delete',
  'prescriptions.read',
  'prescriptions.write',
  'prescriptions.delete',
  'medications.read',
  'medications.write',
  'branding.read',
  'branding.write',
  'clinical_questions.read',
  'clinical_questions.write',
] as const;

export const ROLE_TEMPLATES: Record<
  string,
  { description: string; permissions: readonly string[] }
> = {
  admin: {
    description: 'Full system access',
    permissions: PERMISSION_CODES,
  },
  doctor: {
    description: 'Medical staff with full clinical access',
    permissions: [
      'patients.read',
      'patients.write',
      'patients.delete',
      'appointments.read',
      'appointments.write',
      'appointments.delete',
      'consultations.read',
      'consultations.write',
      'consultations.delete',
      'prescriptions.read',
      'prescriptions.write',
      'prescriptions.delete',
      'medications.read',
      'medications.write',
      'branding.read',
      'branding.write',
      'clinical_questions.read',
      'clinical_questions.write',
    ],
  },
  assistant: {
    description: 'Front-desk assistant',
    permissions: [
      'patients.read',
      'patients.write',
      'appointments.read',
      'appointments.write',
      'consultations.read',
      'prescriptions.read',
      'medications.read',
      'branding.read',
      'clinical_questions.read',
    ],
  },
};

export const SYSTEM_ROLE_NAMES = ['admin', 'doctor', 'assistant'] as const;

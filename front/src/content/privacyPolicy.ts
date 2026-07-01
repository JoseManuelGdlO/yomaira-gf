export const PRIVACY_CONTACT_EMAIL = "direccion@intelekia.com";

export const PRIVACY_LAST_UPDATED = "1 de julio de 2026";

export type PrivacySection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "responsable",
    title: "Responsable del tratamiento",
    paragraphs: [
      "MediFlow es la plataforma tecnológica que permite a consultorios médicos gestionar pacientes, agenda, expediente clínico, recetas y demás operaciones relacionadas con la atención.",
      "MediFlow actúa como operador de la plataforma. Cada consultorio registrado es responsable del tratamiento de los datos personales y datos de salud de sus pacientes, en los términos de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y demás normativa aplicable.",
      "Para cuestiones relacionadas con el funcionamiento de la plataforma, puedes contactarnos en el correo indicado al final de este documento.",
    ],
  },
  {
    id: "datos",
    title: "Datos personales que recabamos",
    paragraphs: [
      "Dependiendo de tu relación con la plataforma, podemos tratar las siguientes categorías de datos:",
      "Cuentas de personal del consultorio: nombre, correo electrónico, roles, permisos y credenciales de acceso.",
      "Datos de pacientes: nombre, edad, fecha de nacimiento, sexo, datos de contacto del paciente o tutor, alergias, condiciones médicas, tipo de sangre, peso, historial de visitas, respuestas clínicas, notas de evolución, recetas, consentimientos informados y, en su caso, fotografías asociadas al consentimiento.",
      "Datos de citas: fecha, hora, motivo, estado de la cita y registro de quién la agendó.",
      "Agendamiento público: cuando un paciente o tutor utiliza el enlace de agendamiento de un consultorio, recabamos nombre, tutor responsable, teléfono y la información necesaria para reservar la cita.",
      "Datos técnicos: tokens de sesión almacenados en el navegador, registros de acceso y datos necesarios para la seguridad y el correcto funcionamiento del servicio.",
    ],
  },
  {
    id: "finalidades",
    title: "Finalidades del tratamiento",
    paragraphs: [
      "Los datos personales se utilizan para las siguientes finalidades:",
      "Prestar el servicio de gestión clínica y administrativa del consultorio.",
      "Administrar cuentas de usuarios, roles y permisos de acceso.",
      "Gestionar la agenda, citas, expediente clínico, recetas, inventario, finanzas y demás módulos habilitados.",
      "Enviar notificaciones relacionadas con citas (creación, confirmación, cancelación), cuando el consultorio las tenga activadas.",
      "Permitir el agendamiento en línea a través de enlaces públicos del consultorio.",
      "Garantizar la seguridad de la plataforma, prevenir accesos no autorizados y dar soporte técnico.",
      "Cumplir obligaciones legales aplicables.",
    ],
  },
  {
    id: "base-legal",
    title: "Base legal y datos sensibles",
    paragraphs: [
      "El tratamiento de datos personales se realiza con fundamento en la LFPDPPP y demás disposiciones aplicables en México.",
      "Los datos de salud se consideran datos sensibles. Su tratamiento requiere medidas de seguridad reforzadas y, cuando corresponda, el consentimiento expreso del titular o de su tutor o representante legal.",
      "El consultorio es quien determina las bases legales aplicables frente a sus pacientes. MediFlow procesa dicha información únicamente para prestar el servicio contratado y conforme a las instrucciones del consultorio.",
    ],
  },
  {
    id: "comparticion",
    title: "Transferencia y compartición de datos",
    paragraphs: [
      "MediFlow no vende datos personales.",
      "Podemos compartir información con proveedores tecnológicos que nos apoyan en hosting, infraestructura, correo electrónico u otros servicios necesarios para operar la plataforma, siempre bajo obligaciones contractuales de confidencialidad y protección de datos.",
      "Cada consultorio opera en un entorno aislado (multi-tenant): la información de un consultorio no es accesible por otros consultorios, salvo usuarios con rol de administrador de plataforma para fines de soporte y operación del servicio.",
      "Podremos divulgar información cuando la ley lo exija o para proteger derechos, seguridad e integridad de usuarios y pacientes.",
    ],
  },
  {
    id: "conservacion",
    title: "Conservación de los datos",
    paragraphs: [
      "Conservamos los datos mientras exista una relación activa con el consultorio o el usuario y durante el tiempo necesario para cumplir las finalidades descritas.",
      "También podremos conservar información por los plazos exigidos por la legislación aplicable, resolución de controversias o cumplimiento de obligaciones legales.",
      "Cuando los datos ya no sean necesarios, se procederá a su eliminación o anonimización conforme a nuestras políticas internas y a las instrucciones del consultorio responsable.",
    ],
  },
  {
    id: "derechos",
    title: "Derechos ARCO",
    paragraphs: [
      "Como titular de datos personales, tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos (derechos ARCO), así como a revocar el consentimiento cuando sea procedente.",
      "Para ejercer estos derechos respecto a datos gestionados por un consultorio, deberás contactar directamente al consultorio responsable.",
      `Para solicitudes relacionadas con el uso de la plataforma MediFlow, envía un correo a ${PRIVACY_CONTACT_EMAIL} indicando tu nombre, medio de contacto, descripción de la solicitud y copia de identificación oficial. Responderemos en los plazos establecidos por la LFPDPPP.`,
    ],
  },
  {
    id: "seguridad",
    title: "Medidas de seguridad",
    paragraphs: [
      "Implementamos medidas técnicas y organizativas para proteger los datos personales, incluyendo autenticación de usuarios, control de acceso basado en roles y permisos, aislamiento de información por consultorio y comunicación cifrada cuando corresponda.",
      `Ningún sistema es completamente infalible. Si detectas un incidente de seguridad relacionado con la plataforma, repórtalo de inmediato a ${PRIVACY_CONTACT_EMAIL}.`,
    ],
  },
  {
    id: "cookies",
    title: "Cookies y almacenamiento local",
    paragraphs: [
      "MediFlow utiliza almacenamiento local del navegador para mantener tu sesión activa (tokens de acceso y actualización). Estos datos son necesarios para el funcionamiento del servicio y no se utilizan con fines publicitarios.",
      "Puedes eliminar estos datos cerrando sesión o borrando el almacenamiento local de tu navegador; ten en cuenta que deberás volver a iniciar sesión.",
    ],
  },
  {
    id: "cambios",
    title: "Cambios a esta política",
    paragraphs: [
      "Podemos actualizar esta Política de Privacidad para reflejar cambios en la plataforma, en la legislación o en nuestras prácticas de tratamiento.",
      "Publicaremos la versión vigente en esta página e indicaremos la fecha de última actualización. Te recomendamos revisarla periódicamente.",
    ],
  },
  {
    id: "contacto",
    title: "Contacto",
    paragraphs: [
      `Si tienes dudas sobre esta Política de Privacidad o sobre el tratamiento de tus datos en MediFlow, escríbenos a ${PRIVACY_CONTACT_EMAIL}.`,
    ],
  },
];

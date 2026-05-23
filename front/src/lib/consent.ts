export type ConsentPoint = {
  id: string;
  text: string;
  subPoints?: string[];
  note?: string;
  italic?: boolean;
};

export const DEFAULT_CONSENT_TITLE =
  "Aviso sobre el manejo de conducta durante la consulta dental";

export const DEFAULT_CONSENT_POINTS: ConsentPoint[] = [
  {
    id: "1",
    text: "Toda consulta (de primera vez o de valoración subsecuente) y todo tratamiento generan honorarios.",
  },
  {
    id: "2",
    text: "En la consulta de primera vez la presencia de los padres es indispensable. Durante el tratamiento, los padres permanecen en la recepción (excepto pacientes con alguna necesidad especial), ya que su presencia puede modificar el comportamiento del niño e interferir con el procedimiento. Se hace excepción con menores de 1 año.",
  },
  {
    id: "3",
    text: "Papá, mamá: tu hijo estará bien, será tratado con todo el respeto y amor que merece.",
    italic: true,
  },
  {
    id: "4",
    text: "Durante el tratamiento, el niño puede llorar por:",
    subPoints: [
      "Su edad — con niños muy pequeños es complicado controlar su conducta.",
      "El dolor del problema con el que llegan a consulta.",
      "Su temperamento.",
      "Experiencias dentales anteriores negativas.",
      "Ideas erróneas sobre el dentista.",
      "Los ruidos de los instrumentos.",
    ],
    note: "Los tratamientos que se realizan no generan dolor; el niño puede llorar por los motivos mencionados, pero nunca porque se le esté lastimando.",
  },
  {
    id: "5",
    text: "Durante el tratamiento, por ningún motivo el padre, madre o tutor deberá abandonar el consultorio.",
  },
  {
    id: "6",
    text: "En caso de no obtener la cooperación del niño, se recurre a restricción física para limitar sus movimientos y proteger su integridad. Si es necesaria, se les informará antes del procedimiento.",
  },
  {
    id: "7",
    text: "Asistir con un odontopediatra no garantiza que el niño no llore; garantiza que se realice el tratamiento adecuado y se lleve a término.",
  },
  {
    id: "8",
    text: "Para proteger la integridad física del niño y de acuerdo con su comportamiento y edad, se le ofrecerá la mejor opción para llevar a cabo el tratamiento.",
  },
  {
    id: "9",
    text: "El éxito del tratamiento depende del equipo entre papás, paciente y odontopediatra. Los hábitos higiénicos y alimenticios en casa son la base para que los tratamientos tengan más duración.",
  },
];

export function newConsentPointId() {
  return `cp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getConsentContent(branding: {
  consentTitle?: string | null;
  consentPoints?: ConsentPoint[] | null;
}) {
  const points = branding.consentPoints;
  return {
    title: branding.consentTitle?.trim() || DEFAULT_CONSENT_TITLE,
    points:
      Array.isArray(points) && points.length > 0 && points.every((p) => p.text?.trim())
        ? points
        : DEFAULT_CONSENT_POINTS,
  };
}

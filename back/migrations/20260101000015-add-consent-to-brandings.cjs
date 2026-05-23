'use strict';

const DEFAULT_TITLE = 'Aviso sobre el manejo de conducta durante la consulta dental';

const DEFAULT_POINTS = [
  {
    id: '1',
    text: 'Toda consulta (de primera vez o de valoración subsecuente) y todo tratamiento generan honorarios.',
  },
  {
    id: '2',
    text: 'En la consulta de primera vez la presencia de los padres es indispensable. Durante el tratamiento, los padres permanecen en la recepción (excepto pacientes con alguna necesidad especial), ya que su presencia puede modificar el comportamiento del niño e interferir con el procedimiento. Se hace excepción con menores de 1 año.',
  },
  {
    id: '3',
    text: 'Papá, mamá: tu hijo estará bien, será tratado con todo el respeto y amor que merece.',
    italic: true,
  },
  {
    id: '4',
    text: 'Durante el tratamiento, el niño puede llorar por:',
    subPoints: [
      'Su edad — con niños muy pequeños es complicado controlar su conducta.',
      'El dolor del problema con el que llegan a consulta.',
      'Su temperamento.',
      'Experiencias dentales anteriores negativas.',
      'Ideas erróneas sobre el dentista.',
      'Los ruidos de los instrumentos.',
    ],
    note: 'Los tratamientos que se realizan no generan dolor; el niño puede llorar por los motivos mencionados, pero nunca porque se le esté lastimando.',
  },
  {
    id: '5',
    text: 'Durante el tratamiento, por ningún motivo el padre, madre o tutor deberá abandonar el consultorio.',
  },
  {
    id: '6',
    text: 'En caso de no obtener la cooperación del niño, se recurre a restricción física para limitar sus movimientos y proteger su integridad. Si es necesaria, se les informará antes del procedimiento.',
  },
  {
    id: '7',
    text: 'Asistir con un odontopediatra no garantiza que el niño no llore; garantiza que se realice el tratamiento adecuado y se lleve a término.',
  },
  {
    id: '8',
    text: 'Para proteger la integridad física del niño y de acuerdo con su comportamiento y edad, se le ofrecerá la mejor opción para llevar a cabo el tratamiento.',
  },
  {
    id: '9',
    text: 'El éxito del tratamiento depende del equipo entre papás, paciente y odontopediatra. Los hábitos higiénicos y alimenticios en casa son la base para que los tratamientos tengan más duración.',
  },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('brandings', 'consent_title', {
      type: Sequelize.STRING(500),
      allowNull: false,
      defaultValue: DEFAULT_TITLE,
    });
    await queryInterface.addColumn('brandings', 'consent_points', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    const json = JSON.stringify(DEFAULT_POINTS);
    await queryInterface.sequelize.query(
      `UPDATE brandings SET consent_title = :title, consent_points = CAST(:points AS JSON) WHERE consent_points IS NULL`,
      { replacements: { title: DEFAULT_TITLE, points: json } },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('brandings', 'consent_points');
    await queryInterface.removeColumn('brandings', 'consent_title');
  },
};

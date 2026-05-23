'use strict';

const { v4: uuid } = require('uuid');

const QUESTIONS = [
  // Identificación
  ['nickname', 'Identificación', '¿Cómo le gusta que le digan?', 'text', null],
  ['favorite_character', 'Identificación', 'Personaje o caricatura favorita', 'text', null],
  ['referred_by', 'Identificación', '¿Quién los recomendó con nosotros?', 'text', null],
  ['reason', 'Identificación', 'Motivo de la consulta', 'textarea', null],

  // Antecedentes sistémicos
  [
    'antecedents',
    'Antecedentes sistémicos',
    'Marque los antecedentes positivos',
    'checkbox_group',
    [
      'Cardiacos',
      'Renales',
      'Sanguíneos',
      'Pulmonares',
      'Psicológicos / neurológicos',
      'Alérgicos',
      'Otros',
    ],
  ],
  ['antecedents_other', 'Antecedentes sistémicos', 'Especifique otros antecedentes', 'text', null],

  // Antecedentes médicos
  ['hospitalized', 'Antecedentes médicos', '¿Ha estado hospitalizado?', 'yes_no', null],
  ['surgery', 'Antecedentes médicos', '¿Ha sido intervenido quirúrgicamente?', 'yes_no', null],
  [
    'current_treatment',
    'Antecedentes médicos',
    '¿Actualmente está enfermo y/o bajo tratamiento médico?',
    'textarea',
    null,
  ],
  [
    'first_visit',
    'Antecedentes médicos',
    '¿Es la primera vez que acude a consulta odontológica?',
    'yes_no',
    null,
  ],
  [
    'previous_reasons',
    'Antecedentes médicos',
    '¿Por qué motivos fue atendido anteriormente?',
    'textarea',
    null,
  ],
  [
    'previous_behavior',
    'Antecedentes médicos',
    '¿Cómo fue su comportamiento en tratamientos anteriores?',
    'textarea',
    null,
  ],

  // Higiene y dieta
  ['brush_freq', 'Higiene y dieta', '¿Cuántas veces al día cepilla sus dientes?', 'text', null],
  ['brush_help', 'Higiene y dieta', '¿Se cepilla solo/a o recibe ayuda?', 'text', null],
  ['toothpaste', 'Higiene y dieta', '¿Qué pasta dental usa?', 'text', null],
  ['floss', 'Higiene y dieta', '¿Usa hilo dental?', 'yes_no', null],
  [
    'sugar',
    'Higiene y dieta',
    'Consumo de azúcares (dulces, chocolates, yogurt, jugos de caja, leche saborizada, cereal, galletas)',
    'textarea',
    null,
  ],
  ['water', 'Higiene y dieta', '¿Qué tipo de agua consumen? (purificada, llave, garrafón)', 'text', null],

  // Antecedentes perinatales
  [
    'mom_meds',
    'Antecedentes perinatales',
    '¿La madre consumió medicamentos (antibióticos) durante el embarazo?',
    'textarea',
    null,
  ],
  [
    'baby_meds',
    'Antecedentes perinatales',
    '¿El/la paciente consumió medicamentos (antibióticos) los primeros meses de vida?',
    'textarea',
    null,
  ],
  [
    'pregnancy_complications',
    'Antecedentes perinatales',
    '¿Complicaciones durante el embarazo, bajo peso al nacer, prematuro?',
    'textarea',
    null,
  ],
  ['full_term', 'Antecedentes perinatales', '¿Embarazo a término? (9 meses / 40 semanas)', 'yes_no', null],
  ['birth_type', 'Antecedentes perinatales', '¿Nació por parto o cesárea?', 'text', null],

  // Hábitos orales
  ['bottle', 'Hábitos orales', '¿Usa o usó biberón?', 'yes_no', null],
  ['formula', 'Hábitos orales', '¿Consume o consumió leche de fórmula?', 'yes_no', null],
  ['breast_milk', 'Hábitos orales', '¿Consume o consumió leche materna?', 'yes_no', null],
  ['pacifier', 'Hábitos orales', '¿Usa o usó chupón / se chupa el dedo?', 'yes_no', null],
  ['lip_biting', 'Hábitos orales', '¿Se chupa o muerde el labio superior o inferior?', 'yes_no', null],
  [
    'speech',
    'Hábitos orales',
    '¿Ha notado alguna alteración en el habla (pronunciación de algunas letras)?',
    'textarea',
    null,
  ],
  [
    'complementary_feeding',
    'Hábitos orales',
    'Si tiene 6 meses cumplidos: ¿ya lleva alimentación complementaria?',
    'yes_no',
    null,
  ],

  // Notas
  ['notes', 'Anotaciones del odontopediatra', 'Anotaciones clínicas', 'textarea', null],
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert(
      'clinical_questions',
      QUESTIONS.map(([code, section, label, type, options], index) => ({
        id: uuid(),
        code,
        section,
        label,
        type,
        options: options ? JSON.stringify(options) : null,
        builtin: true,
        position: index,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('clinical_questions', null, {});
  },
};

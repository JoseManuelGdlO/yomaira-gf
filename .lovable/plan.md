
# Plataforma Médica — Prototipo Frontend (Multi-branding)

Prototipo 100% frontend con datos mock. Primer branding: **C.D.E.O. Yomaira García Flores — Odontopediatría** (morado #B100D4 / lila #DDB7E8 / azul #2D4D8F).

## 1. Arquitectura visual y theming

- **Theme Provider** en `src/lib/theme/` con `ThemeContext` que expone branding (colores, logo, nombre, especialidad, firma, tipografía, formato de receta).
- Tokens en `src/styles.css` usando `oklch` y variables CSS (`--primary`, `--secondary`, `--accent`, `--surface`, `--brand-logo`, etc.). El `ThemeProvider` reescribe estas variables en `:root` según el doctor activo.
- Mock de **múltiples doctores/clínicas** en `src/mocks/brandings.ts` + selector "Cambiar branding" en topbar para demostrar multi-tenant visualmente.
- Tipografía: Plus Jakarta Sans (UI) + Fraunces (display, toques cálidos para odontopediatría infantil). Cargadas vía Google Fonts en `__root.tsx`.

## 2. Estructura de navegación (TanStack Router)

Layout con sidebar + topbar bajo `src/routes/_app.tsx` (Outlet). Rutas:

```
src/routes/
  __root.tsx           shell + theme provider + fonts
  index.tsx            redirige a /dashboard
  _app.tsx             layout (sidebar + topbar)
  _app.dashboard.tsx
  _app.pacientes.tsx              lista + buscador
  _app.pacientes.$id.tsx          expediente clínico (tabs)
  _app.agenda.tsx
  _app.expedientes.tsx
  _app.recetas.tsx                lista + generador
  _app.recetas.nueva.tsx          flujo paciente→medicamentos→preview→imprimir
  _app.historial.tsx
  _app.branding.tsx               personalización (logo, colores, receta)
  _app.configuracion.tsx
```

Sidebar colapsable (shadcn `Sidebar`), topbar con buscador global (cmd+k), avatar doctor, switch de branding demo.

## 3. Mock data (`src/mocks/`)

- `patients.ts` — 20 pacientes pediátricos realistas (nombre, edad, tutor, alergias, antecedentes, foto avatar).
- `consultations.ts` — historial por paciente con diagnóstico, tratamiento, notas, fecha.
- `appointments.ts` — citas con estados: `pendiente | confirmada | completada | cancelada`.
- `prescriptions.ts` — recetas ejemplo.
- `medications.ts` — catálogo para autocompletar en generador.
- `brandings.ts` — Yomaira (default) + 1-2 doctores ficticios extra para demo multi-branding.
- `currentDoctor.ts` — doctor activo simulado.

Toda escritura usa `useState`/`useReducer` en memoria (sin persistencia).

## 4. Pantallas

**Dashboard** — KPIs (pacientes hoy, próximas citas, recetas mes), próximas consultas, pacientes recientes, actividad, accesos rápidos a "Nueva receta" / "Nuevo paciente".

**Pacientes** — tabla con buscador instantáneo, filtros (edad, último visit), avatar + chips de alergias, click → expediente.

**Expediente clínico** (`/pacientes/$id`) — header con foto, datos generales y tutor; tabs:
- Resumen (datos, alergias, antecedentes editables)
- Historial (timeline visual de consultas)
- Diagnósticos & tratamientos
- Medicamentos actuales
- Estudios médicos (upload mock)
- Notas del doctor (editor inline)
- Recetas emitidas

**Agenda** — calendario mensual + vista día/semana, badges de estado, modal nueva cita.

**Generador de recetas** — wizard 3 pasos: 1) seleccionar paciente, 2) agregar medicamentos (autocomplete + dosis/frecuencia/duración) e indicaciones, 3) **vista previa imprimible** con branding del doctor (logo, colores, encabezado, firma, pie) + botón "Imprimir" (`window.print()` con `@media print` styles).

**Branding / Personalización** — formulario con: subir logo (preview local), color pickers (primary/secondary/accent), selector tipografía, encabezado/pie de receta, firma (upload imagen), foto perfil. Panel derecho con **preview en vivo** de sidebar + receta aplicando los cambios.

**Configuración** — datos del consultorio, cédula profesional, especialidad.

## 5. Componentes reutilizables (`src/components/`)

`AppSidebar`, `Topbar`, `GlobalSearch` (cmd+k), `PatientCard`, `PatientTable`, `ClinicalTimeline`, `ConsultationCard`, `StatusBadge`, `StatCard`, `AppointmentCalendar`, `PrescriptionPreview` (imprimible), `PrescriptionWizard`, `MedicationCombobox`, `FileUploadMock`, `BrandingForm`, `LivePreviewPanel`, `EmptyState`, `SectionHeader`. Todos consumen tokens semánticos — cero colores hardcodeados.

## 6. Estilo visual

- Bordes suaves (radius 0.875rem), sombras ligeras (`shadow-sm` con tinte morado), surfaces lila muy suaves (`#F8F4FA`).
- Iconografía Lucide con acentos pediátricos amigables (sin imaginería hospitalaria fría).
- Microinteracciones con `framer-motion` (fade-in cards, transición tabs expediente).
- Print stylesheet dedicado para receta (formato carta, márgenes, oculta UI).

## 7. Detalles técnicos

- Stack: React 19 + TS + Tailwind v4 + TanStack Start (ya configurado), shadcn/ui, lucide-react, framer-motion, date-fns, react-day-picker (ya en shadcn calendar).
- Sin backend: NO se habilita Lovable Cloud. Todo en memoria.
- Theming: `ThemeProvider` aplica `document.documentElement.style.setProperty('--primary', oklchValue)` al cambiar branding; persistencia opcional en `localStorage` solo para que el demo recuerde la selección entre reloads (es UI-state, no datos médicos).
- Responsive: sidebar colapsa a drawer en mobile; tablas → cards.
- SEO básico por ruta vía `head()`.

## 8. Orden de implementación

1. Theme system + tokens + fuentes + branding Yomaira por defecto.
2. Layout (sidebar + topbar + routing) y mock data base.
3. Dashboard + Pacientes + Expediente clínico (núcleo del producto).
4. Generador de recetas + vista previa imprimible.
5. Agenda + Historial.
6. Branding/Personalización con preview en vivo + switch multi-doctor demo.
7. Pulido: animaciones, empty states, responsive, print styles.

import { createPortal } from "react-dom";
import type { Patient, Prescription } from "@/mocks/data";
import { PrescriptionPreview } from "./PrescriptionPreview";

/** Renders prescription at document root so print is not clipped by dialogs/transforms. */
export function PrintPrescriptionPortal({
  rx,
  patient,
}: {
  rx: Prescription;
  patient: Patient;
}) {
  return createPortal(
    <div id="rx-print-root">
      <PrescriptionPreview rx={rx} patient={patient} />
    </div>,
    document.body,
  );
}

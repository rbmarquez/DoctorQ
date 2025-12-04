export const BOOKING_STORAGE_KEY = "agendamentoDraft";

export interface BookingDraft {
  professionalId: string;
  professionalName: string;
  specialty?: string;
  location?: string;
  clinicId?: string;
  clinicName?: string;
  date: string;
  time: string;
  slotId?: string;
  visitPrice?: number;
  visitType?: string;
  isFirstConsultation?: boolean;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  patientDocument?: string;
  patientNotes?: string;
  patientPassword?: string;
  authMode?: "login" | "register";
  accessToken?: string;
  tokenType?: string;
  userId?: string;
}

export type ScheduleConfirmationPayload = Pick<
  BookingDraft,
  | "professionalId"
  | "professionalName"
  | "specialty"
  | "clinicId"
  | "clinicName"
  | "location"
  | "date"
  | "time"
  | "slotId"
  | "visitPrice"
>;

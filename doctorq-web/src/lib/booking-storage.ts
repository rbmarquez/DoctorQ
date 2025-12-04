"use client";

import { BOOKING_STORAGE_KEY, BookingDraft } from "@/types/agendamento";

export function saveBookingDraft(draft: BookingDraft) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error("Não foi possível salvar o agendamento em progresso:", error);
  }
}

export function loadBookingDraft(): BookingDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(BOOKING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookingDraft;
  } catch (error) {
    console.error("Não foi possível carregar o agendamento em progresso:", error);
    return null;
  }
}

export function clearBookingDraft() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(BOOKING_STORAGE_KEY);
}

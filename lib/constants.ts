import type { LeadStatus, Platform } from "@/lib/types";

export const platforms: Platform[] = ["LinkedIn", "Facebook", "Instagram"];

export const leadStatuses: LeadStatus[] = [
  "Nuevo",
  "Guardado",
  "Revisado",
  "Seguido manualmente",
  "Contactado",
  "Descartado"
];

export const statusTone: Record<LeadStatus, string> = {
  Nuevo: "bg-brand-50 text-brand-700 border-brand-100",
  Guardado: "bg-mint-50 text-mint-700 border-mint-50",
  Revisado: "bg-amber-50 text-amber-500 border-amber-50",
  "Seguido manualmente": "bg-violet-50 text-violet-700 border-violet-100",
  Contactado: "bg-cyan-50 text-cyan-700 border-cyan-100",
  Descartado: "bg-rose-50 text-rose-500 border-rose-50"
};

export const platformTone: Record<Platform, string> = {
  LinkedIn: "bg-[#eaf4ff] text-[#0a66c2]",
  Facebook: "bg-[#eef5ff] text-[#1877f2]",
  Instagram: "bg-[#fff0f5] text-[#c13584]"
};

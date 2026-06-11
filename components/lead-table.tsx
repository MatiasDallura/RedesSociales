"use client";

import Link from "next/link";
import { ExternalLink, MessageSquare, Save, UserCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui";
import { leadStatuses, platformTone, statusTone } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadStatus } from "@/lib/types";
import { cn, scoreTone } from "@/lib/utils";

export function LeadTable({
  leads,
  onLeadChange
}: {
  leads: Lead[];
  onLeadChange?: (lead: Lead) => void;
}) {
  const supabase = createClient();

  async function updateLead(lead: Lead, status: LeadStatus) {
    const updated = { ...lead, status, updated_at: new Date().toISOString() };
    onLeadChange?.(updated);

    if (!supabase || lead.user_id === "demo-user") return;

    await supabase.from("leads").update({ status }).eq("id", lead.id);

    if (status === "Revisado" || status === "Seguido manualmente") {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("daily_activity")
        .select("*")
        .eq("activity_date", today)
        .single();

      const payload = {
        user_id: lead.user_id,
        activity_date: today,
        reviewed_count: (data?.reviewed_count ?? 0) + (status === "Revisado" ? 1 : 0),
        followed_manual_count: (data?.followed_manual_count ?? 0) + (status === "Seguido manualmente" ? 1 : 0),
        opened_count: data?.opened_count ?? 0
      };

      await supabase.from("daily_activity").upsert(payload, { onConflict: "user_id,activity_date" });
    }
  }

  async function openProfile(lead: Lead) {
    window.open(lead.url, "_blank", "noopener,noreferrer");
    if (!supabase || lead.user_id === "demo-user") return;

    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("daily_activity")
      .select("*")
      .eq("activity_date", today)
      .single();
    await supabase.from("daily_activity").upsert(
      {
        user_id: lead.user_id,
        activity_date: today,
        opened_count: (data?.opened_count ?? 0) + 1,
        reviewed_count: data?.reviewed_count ?? 0,
        followed_manual_count: data?.followed_manual_count ?? 0
      },
      { onConflict: "user_id,activity_date" }
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center text-sm text-slate-500">
        No hay leads con estos filtros.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Plataforma</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Encaje</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {leads.map((lead) => (
              <tr key={lead.id} className="align-top hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="font-medium text-ink hover:text-brand-700">
                    {lead.name}
                  </Link>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">{lead.location || "Sin ubicación"}</p>
                  <p className="mt-1 max-w-sm line-clamp-2 text-xs text-slate-500">{lead.bio || "Sin bio"}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge className={cn("border-transparent", platformTone[lead.platform])}>{lead.platform}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex min-w-12 justify-center rounded-md px-2 py-1 font-semibold", scoreTone(lead.relevance_score))}>
                    {lead.relevance_score}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge className={statusTone[lead.status]}>{lead.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <p className="max-w-sm text-slate-700">{lead.fit_reason || "Pendiente de análisis."}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {[...lead.keywords_detected, ...lead.hashtags_related].slice(0, 4).map((item) => (
                      <span key={item} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                        {item}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-56 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openProfile(lead)}
                      className="focus-ring inline-flex h-8 items-center gap-1 rounded-md border border-line bg-white px-2 text-xs font-medium hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLead(lead, "Guardado")}
                      className="focus-ring inline-flex h-8 items-center gap-1 rounded-md border border-line bg-white px-2 text-xs font-medium hover:bg-slate-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLead(lead, "Seguido manualmente")}
                      className="focus-ring inline-flex h-8 items-center gap-1 rounded-md border border-line bg-white px-2 text-xs font-medium hover:bg-slate-50"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Seguido
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLead(lead, "Contactado")}
                      className="focus-ring inline-flex h-8 items-center gap-1 rounded-md border border-line bg-white px-2 text-xs font-medium hover:bg-slate-50"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Contactado
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLead(lead, "Descartado")}
                      className="focus-ring inline-flex h-8 items-center gap-1 rounded-md border border-line bg-white px-2 text-xs font-medium hover:bg-slate-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Descartar
                    </button>
                    <select
                      value={lead.status}
                      onChange={(event) => updateLead(lead, event.target.value as LeadStatus)}
                      className="focus-ring h-8 rounded-md border border-line bg-white px-2 text-xs"
                    >
                      {leadStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

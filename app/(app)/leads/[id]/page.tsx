"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge, Card, DemoNotice, Field, inputClass, PageHeader } from "@/components/ui";
import { leadStatuses, platformTone, statusTone } from "@/lib/constants";
import { mockLeads } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadNote, LeadStatus } from "@/lib/types";
import { cn, formatDate, scoreTone } from "@/lib/utils";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const [lead, setLead] = useState<Lead | null>(mockLeads.find((item) => item.id === params.id) ?? mockLeads[0]);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const demo = !supabase;

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const [leadRes, noteRes] = await Promise.all([
        supabase.from("leads").select("*").eq("id", params.id).single(),
        supabase.from("lead_notes").select("*").eq("lead_id", params.id).order("created_at", { ascending: false })
      ]);
      if (leadRes.data) setLead(leadRes.data as Lead);
      if (noteRes.data) setNotes(noteRes.data as LeadNote[]);
    }
    load();
  }, [params.id, supabase]);

  async function updateStatus(status: LeadStatus) {
    if (!lead) return;
    setLead({ ...lead, status });
    if (!supabase || lead.user_id === "demo-user") return;
    await supabase.from("leads").update({ status }).eq("id", lead.id);
  }

  async function saveNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead || !noteBody.trim()) return;
    const note: LeadNote = {
      id: crypto.randomUUID(),
      user_id: lead.user_id,
      lead_id: lead.id,
      body: noteBody.trim(),
      created_at: new Date().toISOString()
    };
    setNotes((items) => [note, ...items]);
    setLead({ ...lead, notes: noteBody.trim() });
    setNoteBody("");

    if (!supabase || lead.user_id === "demo-user") return;
    await supabase.from("lead_notes").insert({ user_id: lead.user_id, lead_id: lead.id, body: note.body });
    await supabase.from("leads").update({ notes: note.body }).eq("id", lead.id);
  }

  return (
    <>
      <PageHeader title={lead?.name ?? "Detalle de lead"} description="Ficha completa para revisar, anotar y decidir acciones manuales." />
      <div className="space-y-5 p-5 md:p-7">
        {demo ? <DemoNotice /> : null}
        {lead ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="space-y-5">
              <Card className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-ink">{lead.name}</h2>
                    <a href={lead.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 break-all text-sm text-brand-700 hover:text-brand-600">
                      <ExternalLink className="h-4 w-4" />
                      {lead.url}
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn("border-transparent", platformTone[lead.platform])}>{lead.platform}</Badge>
                    <Badge className={statusTone[lead.status]}>{lead.status}</Badge>
                    <span className={cn("rounded-md px-2 py-1 text-sm font-semibold", scoreTone(lead.relevance_score))}>{lead.relevance_score}/100</span>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Nicho</p>
                    <p className="mt-1 text-sm text-slate-600">{lead.niche || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Ubicación</p>
                    <p className="mt-1 text-sm text-slate-600">{lead.location || "-"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-700">Bio</p>
                    <p className="mt-1 text-sm text-slate-600">{lead.bio || "-"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-700">Motivo de encaje</p>
                    <p className="mt-1 text-sm text-slate-600">{lead.fit_reason || "Pendiente de análisis."}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-700">Sugerencia de acercamiento</p>
                    <p className="mt-1 text-sm text-slate-600">{lead.approach_suggestion || "-"}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-lg font-semibold text-ink">Notas</h2>
                <form onSubmit={saveNote} className="mt-4 space-y-3">
                  <Field label="Agregar nota">
                    <textarea className={inputClass} rows={4} value={noteBody} onChange={(event) => setNoteBody(event.target.value)} />
                  </Field>
                  <button className="focus-ring min-h-10 rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">Guardar nota</button>
                </form>
                <div className="mt-5 space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-md border border-line bg-slate-50 p-3">
                      <p className="text-sm text-slate-700">{note.body}</p>
                      <p className="mt-2 text-xs text-slate-400">{formatDate(note.created_at)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <aside className="space-y-5">
              <Card className="p-5">
                <h2 className="text-lg font-semibold text-ink">Acciones manuales</h2>
                <div className="mt-4 space-y-3">
                  <a
                    href={lead.url}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir perfil oficial
                  </a>
                  <select className={inputClass} value={lead.status} onChange={(event) => updateStatus(event.target.value as LeadStatus)}>
                    {leadStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-lg font-semibold text-ink">Señales detectadas</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[...lead.keywords_detected, ...lead.hashtags_related].map((item) => (
                    <span key={item} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {item}
                    </span>
                  ))}
                </div>
              </Card>
            </aside>
          </div>
        ) : null}
      </div>
    </>
  );
}

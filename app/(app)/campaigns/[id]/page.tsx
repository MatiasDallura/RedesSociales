"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { LeadTable } from "@/components/lead-table";
import { Badge, Card, DemoNotice, Field, inputClass, PageHeader } from "@/components/ui";
import { mockCampaigns, mockLeads } from "@/lib/mock-data";
import { analyzeLeadLocally, inferPlatform } from "@/lib/local-analysis";
import { createClient } from "@/lib/supabase/client";
import type { Campaign, Lead } from "@/lib/types";

export default function CampaignResultsPage() {
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const [campaign, setCampaign] = useState<Campaign | null>(mockCampaigns.find((item) => item.id === params.id) ?? mockCampaigns[0]);
  const [leads, setLeads] = useState<Lead[]>(mockLeads.filter((lead) => lead.campaign_id === params.id));
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", bio: "", location: "" });
  const demo = !supabase;

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const [campaignRes, leadRes] = await Promise.all([
        supabase.from("campaigns").select("*").eq("id", params.id).single(),
        supabase.from("leads").select("*").eq("campaign_id", params.id).order("relevance_score", { ascending: false })
      ]);
      if (campaignRes.data) setCampaign(campaignRes.data as Campaign);
      if (leadRes.data) setLeads(leadRes.data as Lead[]);
    }
    load();
  }, [params.id, supabase]);

  const averageScore = useMemo(() => {
    if (leads.length === 0) return 0;
    return Math.round(leads.reduce((sum, lead) => sum + lead.relevance_score, 0) / leads.length);
  }, [leads]);

  async function analyzeProfile() {
    if (!campaign) return analyzeLeadLocally({ bio: form.bio, name: form.name });
    const response = await fetch("/api/analyze-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        bio: form.bio,
        location: form.location,
        campaign
      })
    });
    const result = await response.json();
    return result.analysis ?? analyzeLeadLocally({ bio: form.bio, name: form.name, location: form.location, campaign });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!campaign) return;
    setSaving(true);

    const analysis = await analyzeProfile();
    const payload = {
      campaign_id: campaign.id,
      name: form.name,
      platform: inferPlatform(form.url, campaign.platform),
      url: form.url,
      niche: campaign.niche,
      location: form.location || null,
      bio: form.bio || null,
      keywords_detected: analysis.keywords_detected ?? [],
      hashtags_related: analysis.hashtags_related ?? [],
      relevance_score: Math.max(0, Math.min(100, Number(analysis.relevance_score ?? 0))),
      fit_reason: analysis.fit_reason ?? null,
      approach_suggestion: analysis.approach_suggestion ?? null,
      category: analysis.category ?? null,
      status: "Nuevo" as const,
      notes: null
    };

    if (supabase) {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("leads")
          .upsert({ ...payload, user_id: user.id }, { onConflict: "user_id,url" })
          .select()
          .single();
        if (data) setLeads((items) => [data as Lead, ...items.filter((lead) => lead.id !== data.id)]);
      }
    } else {
      setLeads((items) => [
        {
          ...payload,
          id: crypto.randomUUID(),
          user_id: "demo-user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        ...items
      ]);
    }

    setForm({ name: "", url: "", bio: "", location: "" });
    setSaving(false);
  }

  return (
    <>
      <PageHeader
        title={campaign?.name ?? "Resultados de campaña"}
        description="Resultados seguros: carga manual, datos mock, CSV y estructura preparada para APIs oficiales."
      />
      <div className="space-y-6 p-5 md:p-7">
        {demo ? <DemoNotice /> : null}

        {campaign ? (
          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500">Plataforma</p>
                <p className="font-semibold text-ink">{campaign.platform}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Nicho</p>
                <p className="font-semibold text-ink">{campaign.niche}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Leads</p>
                <p className="font-semibold text-ink">{leads.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Score medio</p>
                <p className="font-semibold text-ink">{averageScore}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[...campaign.keywords, ...campaign.hashtags].map((item) => (
                <Badge key={item} className="border-slate-200 bg-slate-50 text-slate-600">
                  {item}
                </Badge>
              ))}
            </div>
          </Card>
        ) : null}

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-ink">Cargar perfil manualmente</h2>
          </div>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre">
              <input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </Field>
            <Field label="URL oficial del perfil">
              <input className={inputClass} type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} required />
            </Field>
            <Field label="Ubicación">
              <input className={inputClass} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Bio o descripción">
                <textarea className={inputClass} rows={4} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <button disabled={saving} className="focus-ring min-h-10 rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
                {saving ? "Analizando..." : "Analizar y agregar lead"}
              </button>
            </div>
          </form>
        </Card>

        <LeadTable leads={leads} onLeadChange={(lead) => setLeads((items) => items.map((item) => (item.id === lead.id ? lead : item)))} />
      </div>
    </>
  );
}

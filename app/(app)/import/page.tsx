"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { Card, DemoNotice, Field, inputClass, PageHeader } from "@/components/ui";
import { LeadTable } from "@/components/lead-table";
import { mockBusinessProfile, mockCampaigns } from "@/lib/mock-data";
import { analyzeLeadLocally, inferPlatform } from "@/lib/local-analysis";
import { createClient } from "@/lib/supabase/client";
import type { BusinessProfile, Campaign, Lead } from "@/lib/types";

type CsvRow = {
  name?: string;
  platform?: string;
  url?: string;
  bio?: string;
  location?: string;
  niche?: string;
};

export default function ImportPage() {
  const supabase = createClient();
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(mockBusinessProfile);
  const [campaignId, setCampaignId] = useState(mockCampaigns[0]?.id ?? "");
  const [preview, setPreview] = useState<Lead[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const demo = !supabase;

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const {
        data: { user }
      } = await supabase.auth.getUser();
      const [campaignRes, profileRes] = await Promise.all([
        supabase.from("campaigns").select("*").order("name"),
        user
          ? supabase.from("business_profiles").select("*").eq("user_id", user.id).single()
          : Promise.resolve({ data: null })
      ]);
      const data = campaignRes.data;
      if (data) {
        setCampaigns(data as Campaign[]);
        setCampaignId(data[0]?.id ?? "");
      }
      if (profileRes.data) setBusinessProfile(profileRes.data as BusinessProfile);
    }
    load();
  }, [supabase]);

  async function analyzeRow(row: CsvRow, campaign: Campaign) {
    const response = await fetch("/api/analyze-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: row.name,
        bio: row.bio,
        location: row.location,
        campaign,
        businessProfile
      })
    });
    const result = await response.json();
    return result.analysis ?? analyzeLeadLocally({ name: row.name, bio: row.bio, location: row.location, campaign, businessProfile });
  }

  async function handleFile(file: File) {
    const campaign = campaigns.find((item) => item.id === campaignId) ?? campaigns[0];
    if (!campaign) {
      setMessage("Crea una campaña antes de importar.");
      return;
    }

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data.filter((row) => row.name && row.url).slice(0, 100);
        const analyzed = await Promise.all(
          rows.map(async (row) => {
            const analysis = await analyzeRow(row, campaign);
            return {
              id: crypto.randomUUID(),
              user_id: "demo-user",
              campaign_id: campaign.id,
              name: row.name || "Sin nombre",
              platform: inferPlatform(row.url || "", campaign.platform),
              url: row.url || "",
              niche: row.niche || campaign.niche,
              location: row.location || null,
              bio: row.bio || null,
              keywords_detected: analysis.keywords_detected ?? [],
              hashtags_related: analysis.hashtags_related ?? [],
              relevance_score: Math.max(0, Math.min(100, Number(analysis.relevance_score ?? 0))),
              fit_reason: analysis.fit_reason ?? null,
              approach_suggestion: analysis.approach_suggestion ?? null,
              category: analysis.category ?? null,
              status: "Nuevo" as const,
              notes: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          })
        );
        setPreview(analyzed);
        setMessage(`${analyzed.length} perfiles listos para importar.`);
      }
    });
  }

  async function savePreview() {
    if (!supabase) {
      setMessage("Modo demo: la vista previa no se guarda hasta configurar Supabase.");
      return;
    }
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;
    const payload = preview.map(({ id, created_at, updated_at, ...lead }) => ({ ...lead, user_id: user.id }));
    const { error } = await supabase.from("leads").upsert(payload, { onConflict: "user_id,url" });
    setMessage(error ? error.message : `${payload.length} perfiles importados en el CRM.`);
  }

  return (
    <>
      <PageHeader title="Importar CSV" description="Carga perfiles potenciales desde una fuente manual. No se hace scraping ni acciones automáticas." />
      <div className="space-y-5 p-5 md:p-7">
        {demo ? <DemoNotice /> : null}
        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
            <Field label="Campaña asociada">
              <select className={inputClass} value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Archivo CSV" hint="Columnas esperadas: name, url, bio, location, platform, niche. Máximo 100 filas por carga.">
              <input
                className={inputClass}
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </Field>
          </div>
          {message ? <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{message}</p> : null}
          <button
            type="button"
            onClick={savePreview}
            disabled={preview.length === 0}
            className="focus-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            Guardar en CRM
          </button>
        </Card>

        <LeadTable leads={preview} onLeadChange={(lead) => setPreview((items) => items.map((item) => (item.id === lead.id ? lead : item)))} />
      </div>
    </>
  );
}

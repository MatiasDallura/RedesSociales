"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Search, Save } from "lucide-react";
import { LeadTable } from "@/components/lead-table";
import { Card, DemoNotice, Field, inputClass, PageHeader } from "@/components/ui";
import { mockCampaigns } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { Campaign, Lead } from "@/lib/types";

type DiscoveryCandidate = Omit<Lead, "id" | "user_id" | "campaign_id" | "status" | "notes" | "created_at" | "updated_at">;

export default function DiscoverPage() {
  const supabase = createClient();
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [campaignId, setCampaignId] = useState(mockCampaigns[0]?.id ?? "");
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const demo = !supabase;

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (data) {
        setCampaigns(data as Campaign[]);
        setCampaignId(data[0]?.id ?? "");
      }
    }
    load();
  }, [supabase]);

  const campaign = campaigns.find((item) => item.id === campaignId) ?? campaigns[0];

  async function discover() {
    if (!campaign) {
      setMessage("Crea una campaña antes de buscar perfiles.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setLeads([]);

    const response = await fetch("/api/discover-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign, limit })
    });
    const result = await response.json();
    setQuery(result.query ?? "");
    setSource(result.source ?? "");

    const mapped: Lead[] = (result.results ?? []).map((item: DiscoveryCandidate) => ({
      ...item,
      id: crypto.randomUUID(),
      user_id: "demo-user",
      campaign_id: campaign.id,
      status: "Nuevo",
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    setLeads(mapped);
    setMessage(
      mapped.length > 0
        ? `${mapped.length} candidatos encontrados desde resultados públicos indexados.`
        : "No hay resultados automáticos. Usa los enlaces de búsqueda manual o configura una API de búsqueda web."
    );
    setLoading(false);
  }

  async function saveLeads() {
    if (!campaign || leads.length === 0) return;

    if (!supabase) {
      setMessage("Modo demo: configura Supabase para guardar candidatos reales en el CRM.");
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = leads.map(({ id, user_id, created_at, updated_at, ...lead }) => ({
      ...lead,
      user_id: user.id,
      campaign_id: campaign.id
    }));

    const { error } = await supabase.from("leads").upsert(payload, { onConflict: "user_id,url" });
    setMessage(error ? error.message : `${payload.length} candidatos guardados en el CRM.`);
  }

  const encodedQuery = encodeURIComponent(query);

  return (
    <>
      <PageHeader
        title="Discovery"
        description="Encuentra candidatos reales con APIs de búsqueda web y URLs públicas indexadas. No scrapea LinkedIn, Facebook ni Instagram."
      />
      <div className="space-y-5 p-5 md:p-7">
        {demo ? <DemoNotice /> : null}

        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_160px_auto] md:items-end">
            <Field label="Campaña">
              <select className={inputClass} value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>
                {campaigns.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Resultados">
              <input className={inputClass} type="number" min={1} max={25} value={limit} onChange={(event) => setLimit(Number(event.target.value))} />
            </Field>
            <button
              type="button"
              onClick={discover}
              disabled={loading}
              className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              {loading ? "Buscando..." : "Buscar perfiles"}
            </button>
          </div>

          {message ? <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{message}</p> : null}

          {query ? (
            <div className="mt-4 rounded-lg border border-line bg-slate-50 p-4">
              <p className="text-sm font-medium text-ink">Query generada</p>
              <code className="mt-2 block break-words text-xs text-slate-600">{query}</code>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`https://www.google.com/search?q=${encodedQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir en Google
                </a>
                <a
                  href={`https://www.bing.com/search?q=${encodedQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir en Bing
                </a>
                <span className="inline-flex min-h-9 items-center rounded-md bg-slate-100 px-3 text-xs font-medium text-slate-600">
                  Fuente: {source || "manual"}
                </span>
              </div>
            </div>
          ) : null}
        </Card>

        {leads.length > 0 ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveLeads}
              className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md bg-mint-700 px-4 text-sm font-medium text-white hover:bg-mint-700"
            >
              <Save className="h-4 w-4" />
              Guardar candidatos en CRM
            </button>
          </div>
        ) : null}

        <LeadTable leads={leads} onLeadChange={(lead) => setLeads((items) => items.map((item) => (item.id === lead.id ? lead : item)))} />
      </div>
    </>
  );
}

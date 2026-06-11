"use client";

import { useEffect, useMemo, useState } from "react";
import { LeadTable } from "@/components/lead-table";
import { DemoNotice, Field, inputClass, PageHeader } from "@/components/ui";
import { leadStatuses, platforms } from "@/lib/constants";
import { mockCampaigns, mockLeads } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { Campaign, Lead } from "@/lib/types";

export default function LeadsPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [filters, setFilters] = useState({
    platform: "",
    status: "",
    niche: "",
    campaign: "",
    score: "",
    location: ""
  });
  const demo = !supabase;

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const [leadRes, campaignRes] = await Promise.all([
        supabase.from("leads").select("*").order("updated_at", { ascending: false }),
        supabase.from("campaigns").select("*").order("name")
      ]);
      if (leadRes.data) setLeads(leadRes.data as Lead[]);
      if (campaignRes.data) setCampaigns(campaignRes.data as Campaign[]);
    }
    load();
  }, [supabase]);

  const niches = Array.from(new Set(leads.map((lead) => lead.niche).filter(Boolean))) as string[];

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      if (filters.platform && lead.platform !== filters.platform) return false;
      if (filters.status && lead.status !== filters.status) return false;
      if (filters.niche && lead.niche !== filters.niche) return false;
      if (filters.campaign && lead.campaign_id !== filters.campaign) return false;
      if (filters.score && lead.relevance_score < Number(filters.score)) return false;
      if (filters.location && !lead.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
      return true;
    });
  }, [filters, leads]);

  return (
    <>
      <PageHeader title="CRM de leads" description="Organiza perfiles por estado, plataforma, campaña, ubicación y score. Todas las acciones son manuales." />
      <div className="space-y-5 p-5 md:p-7">
        {demo ? <DemoNotice /> : null}

        <div className="grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
          <Field label="Plataforma">
            <select className={inputClass} value={filters.platform} onChange={(event) => setFilters({ ...filters, platform: event.target.value })}>
              <option value="">Todas</option>
              {platforms.map((platform) => (
                <option key={platform}>{platform}</option>
              ))}
            </select>
          </Field>
          <Field label="Estado">
            <select className={inputClass} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">Todos</option>
              {leadStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
          <Field label="Nicho">
            <select className={inputClass} value={filters.niche} onChange={(event) => setFilters({ ...filters, niche: event.target.value })}>
              <option value="">Todos</option>
              {niches.map((niche) => (
                <option key={niche}>{niche}</option>
              ))}
            </select>
          </Field>
          <Field label="Campaña">
            <select className={inputClass} value={filters.campaign} onChange={(event) => setFilters({ ...filters, campaign: event.target.value })}>
              <option value="">Todas</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Score mínimo">
            <input className={inputClass} type="number" min={0} max={100} value={filters.score} onChange={(event) => setFilters({ ...filters, score: event.target.value })} />
          </Field>
          <Field label="Ubicación">
            <input className={inputClass} value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} />
          </Field>
        </div>

        <LeadTable leads={filtered} onLeadChange={(lead) => setLeads((items) => items.map((item) => (item.id === lead.id ? lead : item)))} />
      </div>
    </>
  );
}

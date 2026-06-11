"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ButtonLink, Card, DemoNotice, PageHeader } from "@/components/ui";
import { mockCampaigns, mockLeads } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { Campaign, Lead } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function CampaignsPage() {
  const supabase = createClient();
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const demo = !supabase;

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const [campaignRes, leadRes] = await Promise.all([
        supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
        supabase.from("leads").select("*")
      ]);
      if (campaignRes.data) setCampaigns(campaignRes.data as Campaign[]);
      if (leadRes.data) setLeads(leadRes.data as Lead[]);
    }
    load();
  }, [supabase]);

  const counts = useMemo(() => {
    return campaigns.reduce<Record<string, number>>((acc, campaign) => {
      acc[campaign.id] = leads.filter((lead) => lead.campaign_id === campaign.id).length;
      return acc;
    }, {});
  }, [campaigns, leads]);

  return (
    <>
      <PageHeader
        title="Campañas"
        description="Segmentos de prospección por plataforma, nicho, ubicación, keywords y hashtags."
        action={<ButtonLink href="/campaigns/new">Crear campaña</ButtonLink>}
      />
      <div className="space-y-4 p-5 md:p-7">
        {demo ? <DemoNotice /> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <Card className="h-full p-5 hover:border-brand-100 hover:shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-ink">{campaign.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{campaign.niche}</p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{campaign.platform}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Leads</p>
                    <p className="font-semibold text-ink">{counts[campaign.id] || 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Límite diario</p>
                    <p className="font-semibold text-ink">{campaign.daily_review_limit}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1">
                  {[...campaign.keywords, ...campaign.hashtags].slice(0, 6).map((item) => (
                    <span key={item} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-400">Creada {formatDate(campaign.created_at)}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

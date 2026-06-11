"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, PlusCircle } from "lucide-react";
import { ButtonLink, Card, DemoNotice, PageHeader, StatCard } from "@/components/ui";
import { LeadTable } from "@/components/lead-table";
import { mockCampaigns, mockDailyActivity, mockLeads, mockSettings } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { Campaign, DailyActivity, Lead, UserSettings } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [settings, setSettings] = useState<UserSettings>(mockSettings);
  const [activity, setActivity] = useState<DailyActivity>(mockDailyActivity);
  const demo = !supabase;

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().slice(0, 10);
      const [leadRes, campaignRes, settingsRes, activityRes] = await Promise.all([
        supabase.from("leads").select("*").order("updated_at", { ascending: false }),
        supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
        supabase.from("user_settings").select("*").eq("user_id", user.id).single(),
        supabase.from("daily_activity").select("*").eq("activity_date", today).single()
      ]);

      if (leadRes.data) setLeads(leadRes.data as Lead[]);
      if (campaignRes.data) setCampaigns(campaignRes.data as Campaign[]);
      if (settingsRes.data) setSettings(settingsRes.data as UserSettings);
      if (activityRes.data) setActivity(activityRes.data as DailyActivity);
    }

    load();
  }, [supabase]);

  const stats = useMemo(
    () => ({
      found: leads.length,
      saved: leads.filter((lead) => lead.status === "Guardado").length,
      reviewed: leads.filter((lead) => lead.status === "Revisado").length,
      followed: leads.filter((lead) => lead.status === "Seguido manualmente").length
    }),
    [leads]
  );

  const dailyLimit = settings.default_daily_review_limit;
  const usage = Math.round((activity.reviewed_count / dailyLimit) * 100);
  const warning = usage >= 80;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumen privado de campañas, leads y actividad manual de revisión."
        action={<ButtonLink href="/campaigns/new">Nueva campaña</ButtonLink>}
      />
      <div className="space-y-6 p-5 md:p-7">
        {demo ? <DemoNotice /> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Campañas" value={campaigns.length} detail="Activas en el workspace" />
          <StatCard label="Perfiles encontrados" value={stats.found} detail="Incluye importados y mock" />
          <StatCard label="Guardados" value={stats.saved} detail="Leads priorizados" />
          <StatCard label="Seguidos manualmente" value={stats.followed} detail="Sin automatización" />
        </div>

        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Límite diario recomendado</h2>
              <p className="mt-1 text-sm text-slate-500">
                {activity.reviewed_count} revisados hoy de {dailyLimit} recomendados.
              </p>
            </div>
            {warning ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Estás cerca del límite recomendado. Reduce la revisión manual por hoy.
              </div>
            ) : null}
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(usage, 100)}%` }} />
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Leads recientes</h2>
              <Link href="/leads" className="text-sm font-medium text-brand-700 hover:text-brand-600">
                Ver CRM
              </Link>
            </div>
            <LeadTable leads={leads.slice(0, 5)} onLeadChange={(lead) => setLeads((items) => items.map((item) => (item.id === lead.id ? lead : item)))} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Campañas</h2>
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="block">
                  <Card className="p-4 hover:border-brand-100 hover:shadow-soft">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink">{campaign.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{campaign.niche}</p>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{campaign.platform}</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Creada {formatDate(campaign.created_at)}</p>
                  </Card>
                </Link>
              ))}
              <Link
                href="/campaigns/new"
                className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-white text-sm font-medium text-slate-600 hover:border-brand-100 hover:text-brand-700"
              >
                <PlusCircle className="h-4 w-4" />
                Crear campaña
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, DemoNotice, Field, inputClass, PageHeader } from "@/components/ui";
import { mockBusinessProfile } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { BusinessProfile } from "@/lib/types";
import { splitList } from "@/lib/utils";

function joinList(values: string[]) {
  return values.join(", ");
}

export default function BusinessProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<BusinessProfile>(mockBusinessProfile);
  const [message, setMessage] = useState<string | null>(null);
  const demo = !supabase;

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("business_profiles").select("*").eq("user_id", user.id).single();
      if (data) setProfile(data as BusinessProfile);
      else setProfile({ ...mockBusinessProfile, user_id: user.id });
    }

    load();
  }, [supabase]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!supabase) {
      setMessage("Modo demo: configura Supabase para guardar tu ICP real.");
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      business_name: profile.business_name,
      offer: profile.offer,
      target_audience: profile.target_audience,
      ideal_customer: profile.ideal_customer,
      target_locations: profile.target_locations,
      target_industries: profile.target_industries,
      good_lead_signals: profile.good_lead_signals,
      bad_lead_signals: profile.bad_lead_signals,
      approximate_ticket: profile.approximate_ticket,
      outreach_goal: profile.outreach_goal,
      tone: profile.tone,
      notes: profile.notes
    };

    const { data, error } = await supabase
      .from("business_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (data) setProfile(data as BusinessProfile);
    setMessage(error ? error.message : "Business Profile / ICP guardado.");
  }

  return (
    <>
      <PageHeader
        title="Business Profile / ICP"
        description="Define qué vendes, a quién ayudas y qué señales separan un buen lead de uno malo."
      />
      <div className="mx-auto max-w-5xl space-y-4 p-5 md:p-7">
        {demo ? <DemoNotice /> : null}
        <Card className="p-5">
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre del negocio">
              <input
                className={inputClass}
                value={profile.business_name || ""}
                onChange={(event) => setProfile({ ...profile, business_name: event.target.value })}
              />
            </Field>
            <Field label="Ticket aproximado">
              <input
                className={inputClass}
                value={profile.approximate_ticket || ""}
                onChange={(event) => setProfile({ ...profile, approximate_ticket: event.target.value })}
                placeholder="Ej: 500-3000 USD"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Qué vendes / oferta principal">
                <textarea
                  className={inputClass}
                  rows={3}
                  value={profile.offer || ""}
                  onChange={(event) => setProfile({ ...profile, offer: event.target.value })}
                />
              </Field>
            </div>
            <Field label="A quién ayudas">
              <textarea
                className={inputClass}
                rows={4}
                value={profile.target_audience || ""}
                onChange={(event) => setProfile({ ...profile, target_audience: event.target.value })}
              />
            </Field>
            <Field label="Cliente ideal">
              <textarea
                className={inputClass}
                rows={4}
                value={profile.ideal_customer || ""}
                onChange={(event) => setProfile({ ...profile, ideal_customer: event.target.value })}
              />
            </Field>
            <Field label="Países o ciudades objetivo" hint="Separados por coma, punto y coma o salto de línea.">
              <textarea
                className={inputClass}
                rows={3}
                value={joinList(profile.target_locations)}
                onChange={(event) => setProfile({ ...profile, target_locations: splitList(event.target.value) })}
              />
            </Field>
            <Field label="Industrias objetivo" hint="Separadas por coma, punto y coma o salto de línea.">
              <textarea
                className={inputClass}
                rows={3}
                value={joinList(profile.target_industries)}
                onChange={(event) => setProfile({ ...profile, target_industries: splitList(event.target.value) })}
              />
            </Field>
            <Field label="Señales de buen lead">
              <textarea
                className={inputClass}
                rows={4}
                value={joinList(profile.good_lead_signals)}
                onChange={(event) => setProfile({ ...profile, good_lead_signals: splitList(event.target.value) })}
              />
            </Field>
            <Field label="Señales de mal lead">
              <textarea
                className={inputClass}
                rows={4}
                value={joinList(profile.bad_lead_signals)}
                onChange={(event) => setProfile({ ...profile, bad_lead_signals: splitList(event.target.value) })}
              />
            </Field>
            <Field label="Objetivo de contacto">
              <textarea
                className={inputClass}
                rows={3}
                value={profile.outreach_goal || ""}
                onChange={(event) => setProfile({ ...profile, outreach_goal: event.target.value })}
              />
            </Field>
            <Field label="Tono de acercamiento">
              <textarea
                className={inputClass}
                rows={3}
                value={profile.tone || ""}
                onChange={(event) => setProfile({ ...profile, tone: event.target.value })}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Notas adicionales">
                <textarea
                  className={inputClass}
                  rows={4}
                  value={profile.notes || ""}
                  onChange={(event) => setProfile({ ...profile, notes: event.target.value })}
                />
              </Field>
            </div>
            {message ? <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600 md:col-span-2">{message}</p> : null}
            <div className="md:col-span-2">
              <button className="focus-ring min-h-10 rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
                Guardar ICP
              </button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

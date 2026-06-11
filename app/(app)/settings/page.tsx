"use client";

import { useEffect, useState } from "react";
import { Card, DemoNotice, Field, inputClass, PageHeader } from "@/components/ui";
import { mockSettings } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { UserSettings } from "@/lib/types";

export default function SettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<UserSettings>(mockSettings);
  const [message, setMessage] = useState<string | null>(null);
  const demo = !supabase;

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single();
      if (data) setSettings(data as UserSettings);
    }
    load();
  }, [supabase]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!supabase) {
      setMessage("Modo demo: configura Supabase para persistir la configuración.");
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          default_daily_review_limit: settings.default_daily_review_limit,
          ai_model: settings.ai_model,
          notes: settings.notes
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (data) setSettings(data as UserSettings);
    setMessage(error ? error.message : "Configuración guardada.");
  }

  return (
    <>
      <PageHeader title="Configuración" description="Ajustes privados del workspace, límites recomendados y modelo de IA." />
      <div className="mx-auto max-w-3xl space-y-4 p-5 md:p-7">
        {demo ? <DemoNotice /> : null}
        <Card className="p-5">
          <form onSubmit={save} className="space-y-4">
            <Field label="Límite diario recomendado">
              <input
                className={inputClass}
                type="number"
                min={1}
                max={200}
                value={settings.default_daily_review_limit}
                onChange={(event) => setSettings({ ...settings, default_daily_review_limit: Number(event.target.value) })}
              />
            </Field>
            <Field label="Modelo de IA">
              <input
                className={inputClass}
                value={settings.ai_model || ""}
                onChange={(event) => setSettings({ ...settings, ai_model: event.target.value })}
                placeholder="gpt-4o-mini"
              />
            </Field>
            <Field label="Notas privadas">
              <textarea className={inputClass} rows={5} value={settings.notes || ""} onChange={(event) => setSettings({ ...settings, notes: event.target.value })} />
            </Field>
            {message ? <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{message}</p> : null}
            <button className="focus-ring min-h-10 rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">Guardar configuración</button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-ink">Variables de entorno</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <code>NEXT_PUBLIC_SUPABASE_URL</code>
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            <code>NEXT_PUBLIC_ALLOWED_EMAIL</code>
            <code>OPENAI_API_KEY</code>
            <code>OPENAI_BASE_URL</code>
            <code>OPENAI_MODEL</code>
          </div>
        </Card>
      </div>
    </>
  );
}

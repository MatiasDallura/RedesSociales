"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, DemoNotice, Field, inputClass, PageHeader } from "@/components/ui";
import { mockDailyActivity, mockSettings } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { DailyActivity, UserSettings } from "@/lib/types";

const principles = [
  "La app no hace auto-follow.",
  "La app no evade límites.",
  "La app no resuelve captchas.",
  "La app no simula comportamiento humano.",
  "Las acciones de seguir o contactar son manuales.",
  "Se recomienda revisar una cantidad limitada de perfiles por día."
];

export default function SafetyPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<UserSettings>(mockSettings);
  const [activity, setActivity] = useState<DailyActivity>(mockDailyActivity);
  const [limit, setLimit] = useState(mockSettings.default_daily_review_limit);
  const demo = !supabase;

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().slice(0, 10);
      const [settingsRes, activityRes] = await Promise.all([
        supabase.from("user_settings").select("*").eq("user_id", user.id).single(),
        supabase.from("daily_activity").select("*").eq("activity_date", today).single()
      ]);
      if (settingsRes.data) {
        setSettings(settingsRes.data as UserSettings);
        setLimit(settingsRes.data.default_daily_review_limit);
      }
      if (activityRes.data) setActivity(activityRes.data as DailyActivity);
    }
    load();
  }, [supabase]);

  async function saveLimit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettings({ ...settings, default_daily_review_limit: limit });
    if (!supabase) return;
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, default_daily_review_limit: limit }, { onConflict: "user_id" });
  }

  const ratio = activity.reviewed_count / settings.default_daily_review_limit;

  return (
    <>
      <PageHeader title="Safety & Compliance" description="Controles para mantener la app como asistente de descubrimiento, ranking y revisión manual." />
      <div className="space-y-5 p-5 md:p-7">
        {demo ? <DemoNotice /> : null}
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-mint-700" />
              <h2 className="text-lg font-semibold text-ink">Principios de uso seguro</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {principles.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-md border border-line bg-slate-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint-700" />
                  <p className="text-sm text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-ink">Actividad diaria</h2>
            <p className="mt-2 text-sm text-slate-500">
              {activity.reviewed_count} revisados de {settings.default_daily_review_limit} recomendados.
            </p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }} />
            </div>
            {ratio >= 0.8 ? (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Se recomienda pausar o reducir la revisión manual por hoy.
              </div>
            ) : null}
            <form onSubmit={saveLimit} className="mt-5 space-y-3">
              <Field label="Límite diario recomendado configurable">
                <input className={inputClass} type="number" min={1} max={200} value={limit} onChange={(event) => setLimit(Number(event.target.value))} />
              </Field>
              <button className="focus-ring min-h-10 rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">Guardar límite</button>
            </form>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-ink">Historial y duplicados</h2>
          <p className="mt-2 text-sm text-slate-600">
            La tabla `leads` usa una restricción única por usuario y URL para evitar perfiles repetidos. El historial diario se guarda en `daily_activity` con aperturas, revisiones y perfiles seguidos manualmente.
          </p>
        </Card>
      </div>
    </>
  );
}

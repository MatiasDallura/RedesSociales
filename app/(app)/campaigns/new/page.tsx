"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, DemoNotice, Field, inputClass, PageHeader } from "@/components/ui";
import { platforms } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Platform } from "@/lib/types";
import { splitList } from "@/lib/utils";

export default function NewCampaignPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    platform: "LinkedIn" as Platform,
    niche: "",
    location: "",
    keywords: "",
    hashtags: "",
    target_profile_type: "",
    daily_review_limit: 35
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      platform: form.platform,
      niche: form.niche,
      location: form.location || null,
      keywords: splitList(form.keywords),
      hashtags: splitList(form.hashtags).map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)),
      target_profile_type: form.target_profile_type || null,
      daily_review_limit: Number(form.daily_review_limit)
    };

    if (supabase) {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("campaigns").insert({ ...payload, user_id: user.id }).select().single();
        if (data) {
          router.push(`/campaigns/${data.id}`);
          return;
        }
      }
    }

    router.push("/campaigns");
  }

  return (
    <>
      <PageHeader title="Crear campaña" description="Define el perfil ideal. La búsqueda inicial se alimenta con mock, carga manual, CSV y futuras APIs oficiales." />
      <div className="mx-auto max-w-3xl space-y-4 p-5 md:p-7">
        {!supabase ? <DemoNotice /> : null}
        <Card className="p-5">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Nombre de campaña">
                <input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </Field>
            </div>
            <Field label="Plataforma objetivo">
              <select className={inputClass} value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value as Platform })}>
                {platforms.map((platform) => (
                  <option key={platform}>{platform}</option>
                ))}
              </select>
            </Field>
            <Field label="Nicho">
              <input className={inputClass} value={form.niche} onChange={(event) => setForm({ ...form, niche: event.target.value })} required />
            </Field>
            <Field label="País o ciudad">
              <input className={inputClass} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </Field>
            <Field label="Tipo de perfil buscado">
              <input className={inputClass} value={form.target_profile_type} onChange={(event) => setForm({ ...form, target_profile_type: event.target.value })} />
            </Field>
            <Field label="Keywords" hint="Separadas por coma, punto y coma o salto de línea.">
              <textarea className={inputClass} rows={4} value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} />
            </Field>
            <Field label="Hashtags" hint="Puedes escribirlos con o sin #.">
              <textarea className={inputClass} rows={4} value={form.hashtags} onChange={(event) => setForm({ ...form, hashtags: event.target.value })} />
            </Field>
            <Field label="Límite diario recomendado">
              <input
                className={inputClass}
                type="number"
                min={1}
                max={200}
                value={form.daily_review_limit}
                onChange={(event) => setForm({ ...form, daily_review_limit: Number(event.target.value) })}
              />
            </Field>
            <div className="flex items-end">
              <button disabled={saving} className="focus-ring min-h-10 w-full rounded-md bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
                {saving ? "Guardando..." : "Crear campaña"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

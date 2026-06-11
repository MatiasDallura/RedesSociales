"use client";

import { useEffect, useState } from "react";
import { Card, DemoNotice, Field, inputClass, PageHeader } from "@/components/ui";
import { platforms, platformTone } from "@/lib/constants";
import { mockSocialAccounts } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { Platform, SocialAccount } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export default function AccountsPage() {
  const supabase = createClient();
  const [accounts, setAccounts] = useState<SocialAccount[]>(mockSocialAccounts);
  const [form, setForm] = useState({ name: "", platform: "LinkedIn" as Platform, url: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const demo = !supabase;

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data } = await supabase.from("social_accounts").select("*").order("created_at", { ascending: false });
      if (data) setAccounts(data as SocialAccount[]);
    }
    load();
  }, [supabase]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const newAccount: SocialAccount = {
      id: crypto.randomUUID(),
      user_id: "demo-user",
      name: form.name,
      platform: form.platform,
      url: form.url,
      notes: form.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("social_accounts")
          .insert({ ...form, user_id: user.id, notes: form.notes || null })
          .select()
          .single();
        if (data) setAccounts((items) => [data as SocialAccount, ...items]);
      }
    } else {
      setAccounts((items) => [newAccount, ...items]);
    }

    setForm({ name: "", platform: "LinkedIn", url: "", notes: "" });
    setSaving(false);
  }

  return (
    <>
      <PageHeader title="Cuentas sociales" description="Registra tus perfiles o páginas. La app no publica, sigue ni contacta desde estas cuentas." />
      <div className="grid gap-6 p-5 md:p-7 xl:grid-cols-[420px_1fr]">
        <section className="space-y-4">
          {demo ? <DemoNotice /> : null}
          <Card className="p-5">
            <form onSubmit={submit} className="space-y-4">
              <Field label="Nombre de la cuenta">
                <input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </Field>
              <Field label="Plataforma">
                <select className={inputClass} value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value as Platform })}>
                  {platforms.map((platform) => (
                    <option key={platform}>{platform}</option>
                  ))}
                </select>
              </Field>
              <Field label="URL">
                <input className={inputClass} type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} required />
              </Field>
              <Field label="Notas">
                <textarea className={inputClass} rows={4} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
              </Field>
              <button disabled={saving} className="focus-ring min-h-10 w-full rounded-md bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
                Guardar cuenta
              </button>
            </form>
          </Card>
        </section>

        <section className="space-y-3">
          {accounts.map((account) => (
            <Card key={account.id} className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-medium text-ink">{account.name}</p>
                  <a href={account.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-brand-700 hover:text-brand-600">
                    {account.url}
                  </a>
                  {account.notes ? <p className="mt-2 text-sm text-slate-500">{account.notes}</p> : null}
                </div>
                <span className={cn("w-fit rounded-md px-2 py-1 text-xs font-medium", platformTone[account.platform])}>{account.platform}</span>
              </div>
              <p className="mt-3 text-xs text-slate-400">Actualizada {formatDate(account.updated_at)}</p>
            </Card>
          ))}
        </section>
      </div>
    </>
  );
}

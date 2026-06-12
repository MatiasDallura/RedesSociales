"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

type Diagnostics = {
  env: Record<string, boolean | string | null>;
  supabase: { configured: boolean; ok: boolean; message: string };
  auth: { ok: boolean; userEmail: string | null; message: string };
  schema: { ok: boolean; tables: Array<{ table: string; ok: boolean; message: string }> };
  searxng: { configured: boolean; ok: boolean; status?: number; resultCount?: number; message: string };
};

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <Badge className={cn(ok ? "border-mint-50 bg-mint-50 text-mint-700" : "border-rose-50 bg-rose-50 text-rose-500")}>
      {ok ? "OK" : "Revisar"}
    </Badge>
  );
}

function CheckRow({ label, ok, message }: { label: string; ok: boolean; message: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-1 text-xs text-slate-500">{message}</p>
      </div>
      <StatusBadge ok={ok} />
    </div>
  );
}

export default function DiagnosticsPage() {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/diagnostics", { cache: "no-store" });
    const json = await response.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <PageHeader
        title="Diagnóstico"
        description="Comprueba variables de entorno, Supabase, autenticación, schema y Discovery."
        action={
          <button
            type="button"
            onClick={load}
            className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Revisar
          </button>
        }
      />
      <div className="space-y-5 p-5 md:p-7">
        {loading ? (
          <Card className="p-5 text-sm text-slate-500">Revisando configuración...</Card>
        ) : data ? (
          <>
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-ink">Variables</h2>
              <div className="mt-3 divide-y divide-line">
                <CheckRow label="NEXT_PUBLIC_SUPABASE_URL" ok={Boolean(data.env.supabaseUrl)} message={data.env.supabaseUrl ? "Configurada." : "Falta en Vercel o no se redeployó."} />
                <CheckRow label="NEXT_PUBLIC_SUPABASE_ANON_KEY" ok={Boolean(data.env.supabaseAnonKey)} message={data.env.supabaseAnonKey ? "Configurada." : "Falta en Vercel o no se redeployó."} />
                <CheckRow label="NEXT_PUBLIC_ALLOWED_EMAIL" ok={Boolean(data.env.allowedEmail)} message={data.env.allowedEmail ? String(data.env.allowedEmail) : "Opcional, pero recomendado."} />
                <CheckRow label="OPENAI_API_KEY" ok={Boolean(data.env.openAiKey)} message={data.env.openAiKey ? "Configurada." : "Sin IA real; usará scoring local."} />
                <CheckRow label="OPENAI_MODEL" ok={Boolean(data.env.openAiModel)} message={data.env.openAiModel ? String(data.env.openAiModel) : "Usará valor por defecto."} />
                <CheckRow label="SEARXNG_BASE_URL" ok={Boolean(data.env.searxngBaseUrl)} message={data.env.searxngBaseUrl ? String(data.env.searxngBaseUrl) : "Falta; Discovery no traerá leads automáticamente."} />
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-semibold text-ink">Conexiones</h2>
              <div className="mt-3 divide-y divide-line">
                <CheckRow label="Supabase" ok={data.supabase.ok && data.supabase.configured} message={data.supabase.message} />
                <CheckRow label="Auth" ok={data.auth.ok} message={data.auth.userEmail ? `${data.auth.message} ${data.auth.userEmail}` : data.auth.message} />
                <CheckRow label="SearXNG" ok={data.searxng.ok} message={data.searxng.message} />
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-semibold text-ink">Schema Supabase</h2>
              <div className="mt-3 divide-y divide-line">
                {data.schema.tables.map((table) => (
                  <CheckRow key={table.table} label={table.table} ok={table.ok} message={table.message} />
                ))}
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </>
  );
}

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function checkSearxng() {
  const baseUrl = process.env.SEARXNG_BASE_URL;

  if (!baseUrl) {
    return {
      configured: false,
      ok: false,
      message: "SEARXNG_BASE_URL no está configurado. Discovery solo generará búsquedas manuales."
    };
  }

  try {
    const url = new URL("/search", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
    url.searchParams.set("q", "test");
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 }
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      return {
        configured: true,
        ok: false,
        status: response.status,
        message: `SearXNG respondió HTTP ${response.status}. Prueba otra instancia.`
      };
    }

    if (!contentType.includes("application/json")) {
      return {
        configured: true,
        ok: false,
        status: response.status,
        message: "SearXNG respondió, pero no devolvió JSON. Esa instancia no sirve para la app."
      };
    }

    const data = await response.json();
    const resultCount = Array.isArray(data.results) ? data.results.length : 0;

    return {
      configured: true,
      ok: true,
      status: response.status,
      resultCount,
      message: `SearXNG funciona. Resultados de prueba: ${resultCount}.`
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo conectar con SearXNG."
    };
  }
}

export async function GET() {
  const env = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    allowedEmail: process.env.NEXT_PUBLIC_ALLOWED_EMAIL || null,
    openAiKey: Boolean(process.env.OPENAI_API_KEY),
    openAiModel: process.env.OPENAI_MODEL || null,
    searxngBaseUrl: process.env.SEARXNG_BASE_URL || null
  };

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({
      env,
      supabase: {
        configured: false,
        ok: false,
        message: "Supabase no está configurado. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
      },
      auth: {
        ok: false,
        userEmail: null,
        message: "No se puede validar usuario sin Supabase."
      },
      schema: {
        ok: false,
        tables: []
      },
      searxng: await checkSearxng()
    });
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  const tableNames = [
    "user_settings",
    "business_profiles",
    "social_accounts",
    "campaigns",
    "leads",
    "lead_notes",
    "daily_activity"
  ];

  const tableChecks = await Promise.all(
    tableNames.map(async (table) => {
      const { error } = await supabase.from(table).select("id", { count: "exact", head: true });
      return {
        table,
        ok: !error,
        message: error?.message ?? "OK"
      };
    })
  );

  return NextResponse.json({
    env,
    supabase: {
      configured: true,
      ok: !userError,
      message: userError?.message ?? "Supabase client creado correctamente."
    },
    auth: {
      ok: Boolean(user),
      userEmail: user?.email ?? null,
      message: user ? "Usuario autenticado." : "No hay usuario autenticado en esta sesión."
    },
    schema: {
      ok: tableChecks.every((check) => check.ok),
      tables: tableChecks
    },
    searxng: await checkSearxng()
  });
}

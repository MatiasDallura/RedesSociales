"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Card, DemoNotice, Field, inputClass } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "email_not_allowed" ? "Este email no está autorizado para esta app privada." : null
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!supabase) {
      router.push("/");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-panel px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600 text-white">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink">Social Prospecting AI</h1>
            <p className="text-sm text-slate-500">Acceso privado de un solo usuario</p>
          </div>
        </div>

        {!supabase ? <DemoNotice /> : null}

        <Card className="mt-4 p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Email">
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required={Boolean(supabase)}
                autoComplete="email"
              />
            </Field>
            <Field label="Contraseña">
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required={Boolean(supabase)}
                autoComplete="current-password"
              />
            </Field>
            {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-500">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="focus-ring flex min-h-10 w-full items-center justify-center rounded-md bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {supabase ? (loading ? "Entrando..." : "Entrar") : "Entrar en modo demo"}
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

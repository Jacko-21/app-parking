"use client";

import { Loader2, LogIn, ParkingCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";
const AUTH_COOKIE = "bingoz_token";

export default function LoginPage() {
  const router = useRouter();
  const [tenantSlug, setTenantSlug] = useState("beaugrenelle-demo");
  const [email, setEmail] = useState("admin@beaugrenelle.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, email, password }),
      });

      if (!response.ok) {
        throw new Error("Identifiants invalides.");
      }

      const data = (await response.json()) as { token: string };
      document.cookie = `${AUTH_COOKIE}=${data.token}; path=/; max-age=28800; samesite=lax`;
      router.push("/");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Connexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-6">
      <form
        className="w-full max-w-sm rounded-lg border border-border bg-white p-6 shadow-panel"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white">
            <ParkingCircle aria-hidden="true" size={22} />
          </span>
          <span className="text-base font-semibold text-ink">Bingo'z Parking</span>
        </div>
        <h1 className="mt-5 text-lg font-semibold text-ink">Connexion exploitant</h1>

        <label className="mt-5 block text-sm font-medium text-ink" htmlFor="tenant">
          Espace (slug)
        </label>
        <input
          id="tenant"
          className="mt-2 h-11 w-full rounded-lg border border-border px-3 text-sm"
          value={tenantSlug}
          onChange={(event) => {
            setTenantSlug(event.target.value);
          }}
        />

        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="mt-2 h-11 w-full rounded-lg border border-border px-3 text-sm"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />

        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          className="mt-2 h-11 w-full rounded-lg border border-border px-3 text-sm"
          type="password"
          placeholder="demo1234"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        />

        <button
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={18} />
          ) : (
            <LogIn aria-hidden="true" size={18} />
          )}
          Se connecter
        </button>

        {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
      </form>
    </main>
  );
}

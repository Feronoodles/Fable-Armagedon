"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CommandGate } from "@/components/command/CommandGate";
import { CommandIcon } from "@/components/command/CommandIcon";
import { useI18n } from "@/components/I18nProvider";

function LoginForm() {
  const router = useRouter(), searchParams = useSearchParams();
  const { language } = useI18n(), en = language === "en";
  const [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [error, setError] = useState(""), [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (loading) return;
    setError(""); setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result?.ok) setError(en ? "Incorrect email or password." : "Correo o contraseña incorrectos.");
      else { router.push("/menu"); router.refresh(); }
    } catch { setError(en ? "Could not sign in. Try again." : "No se pudo iniciar sesión. Inténtalo de nuevo."); }
    finally { setLoading(false); }
  }
  return <section className="command-auth-panel"><p className="command-eyebrow">{en ? "Return to command" : "De vuelta al mando"}</p><h1>{en ? "Welcome back." : "Tu crónica continúa."}</h1><p>{en ? "Sign in to prepare your next battle." : "Inicia sesión para preparar tu próxima batalla."}</p>
    {searchParams.get("registered") && <div className="command-notice" role="status">{en ? "Account created. You can sign in now." : "Cuenta creada. Ya puedes iniciar sesión."}</div>}
    {error && <div className="command-notice is-error" role="alert">{error}</div>}
    <form onSubmit={submit}><label className="command-field">{en ? "Email" : "Correo electrónico"}<input className="command-input" type="email" name="email" autoComplete="email" required placeholder="tu@correo.com" value={email} onChange={event => setEmail(event.target.value)} disabled={loading} /></label><label className="command-field">{en ? "Password" : "Contraseña"}<input className="command-input" type="password" name="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={loading} /></label><button className="command-button" disabled={loading}>{loading ? (en ? "Signing in…" : "Entrando…") : en ? "Sign in" : "Iniciar sesión"}<CommandIcon name="arrow" /></button></form>
    <p className="command-auth-switch">{en ? "New to the chronicle?" : "¿Empiezas tu crónica?"}<Link href="/register">{en ? "Create account" : "Crear cuenta"}</Link></p>
  </section>;
}
export default function LoginPage() {
  return <CommandGate><Suspense fallback={<div className="command-auth-panel" role="status">Cargando…</div>}><LoginForm /></Suspense></CommandGate>;
}

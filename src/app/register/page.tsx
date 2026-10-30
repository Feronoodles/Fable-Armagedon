"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CommandGate } from "@/components/command/CommandGate";
import { CommandIcon } from "@/components/command/CommandIcon";
import { useI18n } from "@/components/I18nProvider";
import { gameMutation } from "@/components/command/useGameResource";
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_BYTES, MAX_USERNAME_LENGTH, MIN_PASSWORD_LENGTH, MIN_USERNAME_LENGTH,
  parseRegistration, RegistrationValidationError, registrationErrorMessage } from "@/lib/registration-validation";

export default function RegisterPage() {
  const router = useRouter(), { language } = useI18n(), en = language === "en";
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState(""), [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (loading) return;
    setError("");
    if (form.password !== form.confirmPassword) { setError(en ? "Passwords do not match." : "Las contraseñas no coinciden."); return; }
    try {
      const registration = parseRegistration(form);
      setLoading(true);
      await gameMutation("/api/register", "POST", registration);
      router.push("/login?registered=true");
    } catch (cause) { setError(cause instanceof RegistrationValidationError ? registrationErrorMessage(cause, language) :
      cause instanceof Error ? cause.message : en ? "Could not create account." : "No se pudo crear la cuenta."); setLoading(false); }
  }
  function field(key: keyof typeof form, value: string) { setForm(previous => ({ ...previous, [key]: value })); }
  return <CommandGate><section className="command-auth-panel"><p className="command-eyebrow">{en ? "Your first chronicle" : "Tu primera crónica"}</p><h1>{en ? "Forge your legacy." : "Forja tu legado."}</h1><p>{en ? "Create your account and choose a starting deck." : "Crea tu cuenta y elige un mazo inicial."}</p>{error && <div className="command-notice is-error" role="alert">{error}</div>}
    <form onSubmit={submit}>
      <label className="command-field">{en ? "Username" : "Nombre de usuario"}<input className="command-input" autoComplete="username" name="username" required minLength={MIN_USERNAME_LENGTH} maxLength={MAX_USERNAME_LENGTH} value={form.username} onChange={event => field("username", event.target.value)} disabled={loading} /></label>
      <label className="command-field">{en ? "Email" : "Correo electrónico"}<input className="command-input" type="email" name="email" autoComplete="email" required maxLength={MAX_EMAIL_LENGTH} value={form.email} onChange={event => field("email", event.target.value)} disabled={loading} /></label>
      <label className="command-field">{en ? "Password" : "Contraseña"}<input className="command-input" type="password" name="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_BYTES} aria-describedby="registration-password-help" value={form.password} onChange={event => field("password", event.target.value)} disabled={loading} /></label>
      <p id="registration-password-help">{en ? "Use at least 8 characters, up to 72 bytes. Some symbols use more than one byte." : "Usa al menos 8 caracteres, hasta 72 bytes. Algunos símbolos ocupan más de un byte."}</p>
      <label className="command-field">{en ? "Confirm password" : "Repetir contraseña"}<input className="command-input" type="password" name="confirmPassword" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_BYTES} value={form.confirmPassword} onChange={event => field("confirmPassword", event.target.value)} disabled={loading} /></label>
      <button className="command-button" disabled={loading || !form.username.trim()}>{loading ? (en ? "Creating account…" : "Creando cuenta…") : en ? "Create account" : "Crear cuenta"}<CommandIcon name="arrow" /></button>
    </form>
    <p className="command-auth-switch">{en ? "Already have an account?" : "¿Ya tienes una cuenta?"}<Link href="/login">{en ? "Sign in" : "Iniciar sesión"}</Link></p>
  </section></CommandGate>;
}

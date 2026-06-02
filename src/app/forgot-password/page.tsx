"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowLeft, Zap, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--background)",
        backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(74,222,128,0.06), transparent)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
        <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px",
            background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Mail style={{ width: 24, height: 24, color: "var(--signal)" }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", marginBottom: 8 }}>Check your email</h2>
          <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.65, maxWidth: 280, margin: "0 auto" }}>
            We sent a reset link to{" "}
            <span style={{ color: "var(--fg)", fontWeight: 600 }}>{email}</span>.
            Click it to set a new password.
          </p>
          <Link href="/login" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 24, color: "var(--fg-4)", fontSize: 13,
            textDecoration: "none", fontFamily: "var(--font-geist-mono)",
          }}>
            <ArrowLeft style={{ width: 13, height: 13 }} />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--background)",
      backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(74,222,128,0.06), transparent)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, rgba(74,222,128,0.2), rgba(74,222,128,0.05))",
            border: "1px solid rgba(74,222,128,0.25)", marginBottom: 14,
          }}>
            <Zap style={{ width: 20, height: 20, color: "var(--signal)" }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", margin: "0 0 4px" }}>Reset password</h1>
          <p style={{ fontSize: 12.5, color: "var(--fg-4)", fontFamily: "var(--font-geist-mono)" }}>
            We&apos;ll send a reset link to your email
          </p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: 14, padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{
                fontSize: 11, fontWeight: 700,
                color: focused ? "var(--signal)" : "var(--fg-4)",
                fontFamily: "var(--font-geist-mono)", letterSpacing: "0.08em",
                transition: "color 0.15s",
              }}>
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                required
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  width: "100%",
                  background: "var(--surface-2)",
                  border: `1px solid ${focused ? "rgba(74,222,128,0.5)" : "var(--hairline)"}`,
                  borderRadius: 8, padding: "10px 12px", fontSize: 14,
                  color: "var(--fg)", outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  boxShadow: focused ? "0 0 0 3px rgba(74,222,128,0.08)" : "none",
                }}
              />
            </div>

            {error && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                fontSize: 12.5, color: "var(--rose)",
                background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)",
                borderRadius: 8, padding: "9px 12px",
              }}>
                <AlertCircle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cos-btn-primary"
              style={{ padding: "11px", fontSize: 13.5, fontWeight: 700, justifyContent: "center", gap: 7, marginTop: 2 }}
            >
              {loading
                ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> Sending...</>
                : "Send reset link"}
            </button>
          </form>

          <Link href="/login" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            marginTop: 18, fontSize: 12.5, color: "var(--fg-4)", textDecoration: "none",
            fontFamily: "var(--font-geist-mono)",
          }}>
            <ArrowLeft style={{ width: 12, height: 12 }} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Zap, Mail } from "lucide-react";

function AuthInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  hint,
  action,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  hint?: string;
  action?: React.ReactNode;
  minLength?: number;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{
          fontSize: 11, fontWeight: 700,
          color: focused ? "var(--signal)" : "var(--fg-4)",
          fontFamily: "var(--font-geist-mono)", letterSpacing: "0.08em",
          transition: "color 0.15s",
        }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: 11, color: "var(--fg-5)", fontFamily: "var(--font-geist-mono)" }}>{hint}</span>}
      </div>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required
          minLength={minLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: "100%",
            background: "var(--surface-2)",
            border: `1px solid ${focused ? "rgba(74,222,128,0.5)" : "var(--hairline)"}`,
            borderRadius: 8,
            padding: action ? "10px 40px 10px 12px" : "10px 12px",
            fontSize: 14,
            color: "var(--fg)",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.15s, box-shadow 0.15s",
            boxShadow: focused ? "0 0 0 3px rgba(74,222,128,0.08)" : "none",
          }}
        />
        {action && (
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const bars = [1, 2, 3, 4];
  const color = score <= 1 ? "#ef4444" : score === 2 ? "#f59e0b" : score === 3 ? "#06b6d4" : "#4ade80";
  const label = score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: -4 }}>
      <div style={{ display: "flex", gap: 3, flex: 1 }}>
        {bars.map(b => (
          <div key={b} style={{
            height: 3, flex: 1, borderRadius: 99,
            background: b <= score ? color : "var(--surface-3)",
            transition: "background 0.2s",
          }} />
        ))}
      </div>
      <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, color, fontWeight: 700, flexShrink: 0 }}>
        {label}
      </span>
    </div>
  );
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const check = await fetch("/api/auth/validate-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, invite_code: inviteCode }),
    });

    if (!check.ok) {
      const data = await check.json();
      setError(data.error ?? "Invalid invite code");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await fetch("/api/auth/validate-invite", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setDone(true);
    setLoading(false);
  }

  if (done) {
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
            We sent a confirmation link to{" "}
            <span style={{ color: "var(--fg)", fontWeight: 600 }}>{email}</span>.
            Click it to activate your account then sign in.
          </p>
          <Link href="/login" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 24, color: "var(--signal)", fontSize: 13,
            textDecoration: "none", fontWeight: 600,
            fontFamily: "var(--font-geist-mono)",
          }}>
            <CheckCircle2 style={{ width: 14, height: 14 }} />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--background)",
      backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(74,222,128,0.06), transparent)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, rgba(74,222,128,0.2), rgba(74,222,128,0.05))",
            border: "1px solid rgba(74,222,128,0.25)",
            marginBottom: 14,
          }}>
            <Zap style={{ width: 20, height: 20, color: "var(--signal)" }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", margin: "0 0 4px" }}>
            Request access
          </h1>
          <p style={{ fontSize: 12.5, color: "var(--fg-4)", fontFamily: "var(--font-geist-mono)" }}>
            Beta · invite only
          </p>
        </div>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--hairline)",
          borderRadius: 14, padding: 24,
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <AuthInput
              label="FULL NAME"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Your name"
              autoComplete="name"
            />

            <AuthInput
              label="EMAIL"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <AuthInput
                label="PASSWORD"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                minLength={8}
                hint="min. 8 chars"
                action={
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-4)", padding: 0, display: "flex", alignItems: "center" }}
                  >
                    {showPassword
                      ? <EyeOff style={{ width: 15, height: 15 }} />
                      : <Eye style={{ width: 15, height: 15 }} />}
                  </button>
                }
              />
              <PasswordStrength password={password} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <AuthInput
                label="INVITE CODE"
                type="text"
                value={inviteCode}
                onChange={v => setInviteCode(v.toUpperCase())}
                placeholder="XXXXXXXXXX"
                autoComplete="off"
                hint="from your invite email"
              />
            </div>

            {error && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                fontSize: 12.5, color: "var(--rose)",
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.18)",
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
                ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> Creating account...</>
                : "Create account"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 18, fontSize: 12.5, color: "var(--fg-4)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--signal)", textDecoration: "none", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

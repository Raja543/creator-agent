"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, AlertCircle, Zap } from "lucide-react";

function AuthInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  hint,
  action,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  action?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{
          fontSize: 11, fontWeight: 700, color: focused ? "var(--signal)" : "var(--fg-4)",
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
          required={required}
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Incorrect email or password."
        : error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--background)",
      backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(74,222,128,0.06), transparent)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Logo */}
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
            Welcome back
          </h1>
          <p style={{ fontSize: 12.5, color: "var(--fg-4)", fontFamily: "var(--font-geist-mono)" }}>
            Creator OS · Web3 Gaming Intelligence
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          borderRadius: 14,
          padding: 24,
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <AuthInput
              label="EMAIL"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />

            <AuthInput
              label="PASSWORD"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              hint=""
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

            <div style={{ textAlign: "right", marginTop: -6 }}>
              <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--fg-4)", textDecoration: "none", fontFamily: "var(--font-geist-mono)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--signal)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--fg-4)")}
              >
                Forgot password?
              </Link>
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
                ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> Signing in...</>
                : "Sign in"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 18, fontSize: 12.5, color: "var(--fg-4)" }}>
            No account?{" "}
            <Link href="/signup" style={{ color: "var(--signal)", textDecoration: "none", fontWeight: 600 }}>
              Request beta access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, AlertCircle, Zap } from "lucide-react";

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const color = score <= 1 ? "#ef4444" : score === 2 ? "#f59e0b" : score === 3 ? "#06b6d4" : "#4ade80";
  const label = score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 3, flex: 1 }}>
        {[1, 2, 3, 4].map(b => (
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedPw, setFocusedPw] = useState(false);
  const [focusedCf, setFocusedCf] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const EyeToggle = ({ focused }: { focused: boolean }) => (
    <button
      type="button"
      onClick={() => setShowPassword(p => !p)}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: focused ? "var(--fg-3)" : "var(--fg-4)", padding: 0,
        display: "flex", alignItems: "center",
      }}
    >
      {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
    </button>
  );

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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", margin: "0 0 4px" }}>Set new password</h1>
          <p style={{ fontSize: 12.5, color: "var(--fg-4)", fontFamily: "var(--font-geist-mono)" }}>
            Choose a strong password
          </p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: 14, padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: focusedPw ? "var(--signal)" : "var(--fg-4)", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.08em", transition: "color 0.15s" }}>
                  NEW PASSWORD
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedPw(true)}
                    onBlur={() => setFocusedPw(false)}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    style={{
                      width: "100%", background: "var(--surface-2)",
                      border: `1px solid ${focusedPw ? "rgba(74,222,128,0.5)" : "var(--hairline)"}`,
                      borderRadius: 8, padding: "10px 40px 10px 12px", fontSize: 14,
                      color: "var(--fg)", outline: "none", boxSizing: "border-box",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      boxShadow: focusedPw ? "0 0 0 3px rgba(74,222,128,0.08)" : "none",
                    }}
                  />
                  <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
                    <EyeToggle focused={focusedPw} />
                  </div>
                </div>
              </div>
              <PasswordStrength password={password} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: focusedCf ? "var(--signal)" : "var(--fg-4)", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.08em", transition: "color 0.15s" }}>
                CONFIRM PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onFocus={() => setFocusedCf(true)}
                  onBlur={() => setFocusedCf(false)}
                  required
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  style={{
                    width: "100%", background: "var(--surface-2)",
                    border: `1px solid ${confirm && confirm !== password ? "rgba(239,68,68,0.5)" : focusedCf ? "rgba(74,222,128,0.5)" : "var(--hairline)"}`,
                    borderRadius: 8, padding: "10px 12px", fontSize: 14,
                    color: "var(--fg)", outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    boxShadow: focusedCf ? "0 0 0 3px rgba(74,222,128,0.08)" : "none",
                  }}
                />
              </div>
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
                ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> Updating...</>
                : "Update password"}
            </button>
          </form>

          <Link href="/login" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            marginTop: 18, fontSize: 12.5, color: "var(--fg-4)", textDecoration: "none",
            fontFamily: "var(--font-geist-mono)",
          }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, Trash2, Copy, CheckCircle2, Clock, Mail } from "lucide-react";
import type { Invite } from "@/lib/database.types";

export function InvitesClient({ initialInvites }: { initialInvites: Invite[] }) {
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to create invite"); setLoading(false); return; }

    setInvites([data, ...invites]);
    setEmail("");
    setLoading(false);
  }

  async function deleteInvite(id: string) {
    await fetch("/api/admin/invites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setInvites(invites.filter(i => i.id !== id));
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback for browsers that block clipboard access
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const used = invites.filter(i => i.used_at).length;
  const pending = invites.filter(i => !i.used_at).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "TOTAL", value: invites.length, color: "#06b6d4" },
          { label: "PENDING", value: pending, color: "#f59e0b" },
          { label: "USED", value: used, color: "#4ade80" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: "var(--fg-4)", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Create invite */}
      <div className="cos-card" style={{ padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 12 }}>Create invite</div>
        <form onSubmit={createInvite} style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "var(--surface-2)", border: "1px solid var(--hairline)", borderRadius: 8, padding: "0 12px" }}>
            <Mail style={{ width: 13, height: 13, color: "var(--fg-4)", flexShrink: 0 }} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="creator@example.com"
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: "var(--fg)", padding: "10px 0" }}
            />
          </div>
          <button type="submit" disabled={loading} className="cos-btn-primary" style={{ padding: "0 18px", fontSize: 12, fontWeight: 700, gap: 6 }}>
            <Plus style={{ width: 13, height: 13 }} />
            {loading ? "Creating..." : "Invite"}
          </button>
        </form>
        {error && <p style={{ fontSize: 12, color: "var(--rose)", marginTop: 8 }}>{error}</p>}
      </div>

      {/* Invite list */}
      <div className="cos-card" style={{ overflow: "hidden" }}>
        {invites.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--fg-4)", fontSize: 13, fontFamily: "var(--font-geist-mono)" }}>
            No invites yet. Create one above.
          </div>
        ) : (
          invites.map((invite, i) => (
            <div key={invite.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px",
              borderBottom: i < invites.length - 1 ? "1px solid var(--hairline)" : undefined,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", marginBottom: 3 }}>{invite.email}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--fg-3)", background: "var(--surface-2)", padding: "2px 8px", borderRadius: 4 }}>
                    {invite.code}
                  </span>
                  {invite.used_at ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--signal)", fontFamily: "var(--font-geist-mono)" }}>
                      <CheckCircle2 style={{ width: 10, height: 10 }} /> used
                    </span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#f59e0b", fontFamily: "var(--font-geist-mono)" }}>
                      <Clock style={{ width: 10, height: 10 }} /> pending
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => copyCode(invite.code)}
                  className="cos-btn-ghost"
                  style={{ fontSize: 10.5, padding: "5px 10px" }}
                >
                  {copied === invite.code ? <CheckCircle2 style={{ width: 11, height: 11, color: "var(--signal)" }} /> : <Copy style={{ width: 11, height: 11 }} />}
                </button>
                {!invite.used_at && (
                  <button
                    onClick={() => deleteInvite(invite.id)}
                    className="cos-btn-ghost"
                    style={{ fontSize: 10.5, padding: "5px 10px", color: "var(--rose)", borderColor: "rgba(239,68,68,0.2)" }}
                  >
                    <Trash2 style={{ width: 11, height: 11 }} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

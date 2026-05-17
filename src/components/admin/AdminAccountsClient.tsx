"use client";

import { useState, useMemo } from "react";
import {
  Plus, Search, Edit2, Trash2, X, CheckCircle2, XCircle,
  Users, ExternalLink, ChevronDown,
} from "lucide-react";
import type { Account, AccountInsert, Ecosystem, AccountCategory } from "@/lib/database.types";

const ECOSYSTEMS: { value: Ecosystem; label: string }[] = [
  { value: "ronin",     label: "Ronin" },
  { value: "immutable", label: "Immutable" },
  { value: "abstract",  label: "Abstract" },
  { value: "other",     label: "Other" },
];

const CATEGORIES: { value: AccountCategory; label: string; icon: string }[] = [
  { value: "official_game", label: "Official Game", icon: "🎮" },
  { value: "ecosystem",     label: "Ecosystem",     icon: "🌐" },
  { value: "founder",       label: "Founder",       icon: "👤" },
  { value: "creator",       label: "Creator",       icon: "✍️" },
  { value: "analytics",     label: "Analytics",     icon: "📊" },
  { value: "media",         label: "Media",         icon: "📰" },
  { value: "guild",         label: "Guild",         icon: "🏰" },
  { value: "influencer",    label: "Influencer",    icon: "📣" },
];

const CATEGORY_CHIP: Record<string, string> = {
  official_game: "signal",
  ecosystem:     "ronin",
  founder:       "amber",
  creator:       "violet",
  analytics:     "",
  media:         "amber",
  guild:         "violet",
  influencer:    "rose",
};

const PRESET_ACCOUNTS: Array<{
  username: string;
  display_name: string;
  ecosystem: Ecosystem;
  category: AccountCategory;
  priority: number;
}> = [
  // ── RONIN ──────────────────────────────────────────────────────
  { username: "Ronin_Network",    display_name: "Ronin",                    ecosystem: "ronin", category: "ecosystem",    priority: 10 },
  { username: "SkyMavisHQ",       display_name: "Sky Mavis",                ecosystem: "ronin", category: "ecosystem",    priority: 10 },
  { username: "Jihoz_Axie",       display_name: "Jihoz",                    ecosystem: "ronin", category: "founder",      priority: 10 },
  { username: "trungfinity",      display_name: "trungfinity.ron",          ecosystem: "ronin", category: "founder",      priority: 9  },
  { username: "AxieInfinity",     display_name: "Axie Infinity",            ecosystem: "ronin", category: "official_game",priority: 10 },
  { username: "pixels_online",    display_name: "Pixels",                   ecosystem: "ronin", category: "official_game",priority: 10 },
  { username: "playwildforest",   display_name: "Wild Forest",              ecosystem: "ronin", category: "official_game",priority: 9  },
  { username: "playcambria",      display_name: "Cambria",                  ecosystem: "ronin", category: "official_game",priority: 8  },
  { username: "Moku_HQ",          display_name: "Moku: Grand Arena",        ecosystem: "ronin", category: "official_game",priority: 8  },
  { username: "fableborne",       display_name: "Fableborne",               ecosystem: "ronin", category: "official_game",priority: 8  },
  { username: "ApeironNFT",       display_name: "Apeiron",                  ecosystem: "ronin", category: "official_game",priority: 7  },
  { username: "PixelHeroesMMO",   display_name: "Pixel Heroes Adventure",   ecosystem: "ronin", category: "official_game",priority: 7  },
  { username: "kaidrochronicle",  display_name: "Kaidro",                   ecosystem: "ronin", category: "official_game",priority: 7  },
  { username: "ROL_Genesis",      display_name: "Ragnarok: Monster World",  ecosystem: "ronin", category: "official_game",priority: 7  },
  { username: "LumiterraGame",    display_name: "Lumiterra",                ecosystem: "ronin", category: "official_game",priority: 7  },
  { username: "yellowpantherx",   display_name: "Yellow Panther",           ecosystem: "ronin", category: "creator",      priority: 9  },
  { username: "0xRoosta",         display_name: "0xRoosta",                 ecosystem: "ronin", category: "creator",      priority: 8  },
  { username: "imdrkc",           display_name: "imdrkc",                   ecosystem: "ronin", category: "creator",      priority: 7  },
  { username: "Ryann_AF",         display_name: "Ryann",                    ecosystem: "ronin", category: "creator",      priority: 7  },
  { username: "themlpx",          display_name: "themlpx",                  ecosystem: "ronin", category: "creator",      priority: 7  },
  { username: "nixeniego",        display_name: "nixeniego",                ecosystem: "ronin", category: "creator",      priority: 6  },
  { username: "TheRoninRadio",    display_name: "The Ronin Radio",          ecosystem: "ronin", category: "media",        priority: 8  },

  // ── IMMUTABLE ──────────────────────────────────────────────────
  { username: "Immutable",        display_name: "Immutable",                ecosystem: "immutable", category: "ecosystem",    priority: 10 },
  { username: "0xferg",           display_name: "Robbie Ferguson",          ecosystem: "immutable", category: "founder",      priority: 10 },
  { username: "GodsUnchained",    display_name: "Gods Unchained",           ecosystem: "immutable", category: "official_game",priority: 10 },
  { username: "GuildOfGuardian",  display_name: "Guild of Guardians",       ecosystem: "immutable", category: "official_game",priority: 9  },
  { username: "illuviumio",       display_name: "Illuvium",                 ecosystem: "immutable", category: "official_game",priority: 9  },
  { username: "MightMagicFates",  display_name: "Might & Magic: Fates",     ecosystem: "immutable", category: "official_game",priority: 9  },
  { username: "Olderfall",        display_name: "Olderfall",                ecosystem: "immutable", category: "official_game",priority: 8  },
  { username: "RavenQuestGame",   display_name: "RavenQuest",               ecosystem: "immutable", category: "official_game",priority: 8  },
  { username: "PlayElumia",       display_name: "Legends of Elumia",        ecosystem: "immutable", category: "official_game",priority: 8  },
  { username: "NomSteadGame",     display_name: "NomStead",                 ecosystem: "immutable", category: "official_game",priority: 8  },
  { username: "MedievalEmpires",  display_name: "Medieval Empires",         ecosystem: "immutable", category: "official_game",priority: 7  },
  { username: "P2EGamerX",        display_name: "P2E Gamer X",              ecosystem: "immutable", category: "creator",      priority: 8  },
  { username: "ReadyPlayerRich",  display_name: "Ready Player Rich",        ecosystem: "immutable", category: "creator",      priority: 8  },
  { username: "Brycent_",         display_name: "Brycent",                  ecosystem: "immutable", category: "creator",      priority: 8  },

  // ── ABSTRACT ───────────────────────────────────────────────────
  { username: "AbstractChain",    display_name: "Abstract",                 ecosystem: "abstract", category: "ecosystem",    priority: 10 },
  { username: "Abstract_Eco",     display_name: "Abstract Ecosystem",       ecosystem: "abstract", category: "ecosystem",    priority: 10 },
  { username: "LucaNetz",         display_name: "Luca Netz",                ecosystem: "abstract", category: "founder",      priority: 10 },
  { username: "masoncags",        display_name: "Mason (Head of Ecosystem)",ecosystem: "abstract", category: "ecosystem",    priority: 9  },
  { username: "0xCygaar",         display_name: "cygaar",                   ecosystem: "abstract", category: "ecosystem",    priority: 9  },
  { username: "pudgypenguins",    display_name: "Pudgy Penguins",           ecosystem: "abstract", category: "official_game",priority: 10 },
  { username: "playgigaverse",    display_name: "Gigaverse",                ecosystem: "abstract", category: "official_game",priority: 9  },
  { username: "onchainheroes",    display_name: "Onchain Heroes",           ecosystem: "abstract", category: "official_game",priority: 9  },
  { username: "RoachRacingClub",  display_name: "Roach Racing Club",        ecosystem: "abstract", category: "official_game",priority: 7  },
  { username: "play_ember",       display_name: "Playember",                ecosystem: "abstract", category: "official_game",priority: 7  },
  { username: "unchained_game",   display_name: "Unchained",                ecosystem: "abstract", category: "official_game",priority: 8  },
  { username: "TollanUniverse",   display_name: "Tollan Universe",          ecosystem: "abstract", category: "official_game",priority: 8  },
  { username: "MoodyMights",      display_name: "Moody Mights",             ecosystem: "abstract", category: "official_game",priority: 7  },
  { username: "GMB_AOB",          display_name: "GMB_AOB",                  ecosystem: "abstract", category: "creator",      priority: 9  },
  { username: "Abstract_OW",      display_name: "Abstract_OW",              ecosystem: "abstract", category: "creator",      priority: 8  },
  { username: "Neslie_eth",       display_name: "Neslie",                   ecosystem: "abstract", category: "creator",      priority: 8  },
  { username: "marcellovtv",      display_name: "Marcello",                 ecosystem: "abstract", category: "creator",      priority: 8  },
  { username: "0xAbhiP",          display_name: "0xAbhiP",                  ecosystem: "abstract", category: "creator",      priority: 8  },
  { username: "shivst3r",         display_name: "shivst3r",                 ecosystem: "abstract", category: "creator",      priority: 7  },
  { username: "SultanXchain",     display_name: "SultanXchain",             ecosystem: "abstract", category: "creator",      priority: 7  },
  { username: "enftsar",          display_name: "enftsar",                  ecosystem: "abstract", category: "creator",      priority: 7  },
  { username: "Joobs155",         display_name: "Joobs155",                 ecosystem: "abstract", category: "creator",      priority: 7  },
  { username: "ChopperuaCrypto",  display_name: "ChopperuaCrypto",          ecosystem: "abstract", category: "creator",      priority: 7  },
  { username: "abstractdaily_",   display_name: "Abstract Daily",           ecosystem: "abstract", category: "media",        priority: 8  },
  { username: "Abstract_Hzn",     display_name: "Abstract Horizon",         ecosystem: "abstract", category: "media",        priority: 8  },
];

function priorityColor(p: number): string {
  return p >= 8 ? "var(--signal)" : p >= 5 ? "var(--amber)" : "var(--fg-5)";
}

const EMPTY_FORM: Partial<AccountInsert> = {
  username: "", display_name: "", ecosystem: undefined, category: undefined,
  priority: 5, active: true, notes: "", follower_count: undefined, avatar_url: "",
};

interface Props { initialAccounts: Account[]; }

export function AdminAccountsClient({ initialAccounts }: Props) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [search, setSearch] = useState("");
  const [filterEco, setFilterEco] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<Partial<AccountInsert>>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showBulkPresets, setShowBulkPresets] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const matchSearch =
        !search ||
        a.username.toLowerCase().includes(search.toLowerCase()) ||
        (a.display_name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchEco = filterEco === "all" || a.ecosystem === filterEco;
      const matchCat = filterCat === "all" || a.category === filterCat;
      const matchActive =
        filterActive === "all" || (filterActive === "active" ? a.active : !a.active);
      return matchSearch && matchEco && matchCat && matchActive;
    });
  }, [accounts, search, filterEco, filterCat, filterActive]);

  function openAdd() {
    setEditAccount(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowDialog(true);
  }

  function openEdit(account: Account) {
    setEditAccount(account);
    setForm({
      username: account.username,
      display_name: account.display_name ?? "",
      ecosystem: account.ecosystem ?? undefined,
      category: account.category ?? undefined,
      priority: account.priority,
      active: account.active,
      notes: account.notes ?? "",
      follower_count: account.follower_count ?? undefined,
      avatar_url: account.avatar_url ?? "",
    });
    setError(null);
    setShowDialog(true);
  }

  function closeDialog() {
    setShowDialog(false);
    setEditAccount(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username?.trim()) { setError("Username is required"); return; }
    setLoading(true);
    setError(null);
    try {
      if (editAccount) {
        const res = await fetch(`/api/sources/${editAccount.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const updated: Account = await res.json();
        setAccounts((prev) => prev.map((a) => (a.id === editAccount.id ? updated : a)));
      } else {
        const res = await fetch("/api/sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const created: Account = await res.json();
        setAccounts((prev) => [created, ...prev]);
      }
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/sources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(account: Account) {
    const res = await fetch(`/api/sources/${account.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !account.active }),
    });
    if (res.ok) {
      const updated: Account = await res.json();
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? updated : a)));
    }
  }

  async function addPresets() {
    const toAdd = PRESET_ACCOUNTS.filter(
      (p) =>
        selectedPresets.has(p.username) &&
        !accounts.some((a) => a.username.toLowerCase() === p.username.toLowerCase())
    );
    setLoading(true);
    const created: Account[] = [];
    for (const preset of toAdd) {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preset),
      });
      if (res.ok) created.push(await res.json());
    }
    setAccounts((prev) => [...created, ...prev]);
    setShowBulkPresets(false);
    setSelectedPresets(new Set());
    setLoading(false);
  }

  const ecoConfig = Object.fromEntries(ECOSYSTEMS.map((e) => [e.value, e]));
  const catConfig = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="cos-search-wrap flex-1">
          <Search />
          <input
            type="text"
            placeholder="Search by username or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <SelectFilter
            value={filterEco}
            onChange={setFilterEco}
            options={[
              { value: "all", label: "All Ecosystems" },
              ...ECOSYSTEMS.map((e) => ({ value: e.value, label: e.label })),
            ]}
          />
          <SelectFilter
            value={filterCat}
            onChange={setFilterCat}
            options={[
              { value: "all", label: "All Categories" },
              ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
            ]}
          />
          <SelectFilter
            value={filterActive}
            onChange={setFilterActive}
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <button
            onClick={() => setShowBulkPresets(true)}
            className="cos-btn-ghost"
            style={{ fontSize: 12 }}
          >
            <Users style={{ width: 13, height: 13 }} />
            Presets
          </button>
          <button onClick={openAdd} className="cos-btn-primary" style={{ fontSize: 12 }}>
            <Plus style={{ width: 13, height: 13 }} />
            Add Account
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 10, fontFamily: "var(--font-geist-mono)", fontSize: 10.5, color: "var(--fg-4)", flexWrap: "wrap" }}>
        <span>{filtered.length} of {accounts.length} accounts</span>
        <span>·</span>
        <span style={{ color: "var(--signal)" }}>{accounts.filter((a) => a.active).length} active</span>
        {Object.entries(
          accounts.reduce<Record<string, number>>((acc, a) => {
            if (a.ecosystem) acc[a.ecosystem] = (acc[a.ecosystem] ?? 0) + 1;
            return acc;
          }, {})
        ).map(([eco, count]) => (
          <span key={eco}>· {count} {eco}</span>
        ))}
      </div>

      {/* Grouped by category or flat */}
      {filterCat === "all" && filterEco === "all" && !search ? (
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const catAccounts = filtered.filter((a) => a.category === cat.value);
            if (catAccounts.length === 0) return null;
            return (
              <div key={cat.value}>
                <div className="cos-divider">
                  <span>{cat.icon}</span>
                  {cat.label}
                  <span style={{ color: "var(--fg-5)", fontFamily: "var(--font-geist-mono)", fontSize: 9.5 }}>
                    ({catAccounts.length})
                  </span>
                </div>
                <AccountTable
                  accounts={catAccounts}
                  ecoConfig={ecoConfig}
                  catConfig={catConfig}
                  onEdit={openEdit}
                  onDelete={(id) => setDeleteConfirm(id)}
                  onToggle={toggleActive}
                />
              </div>
            );
          })}
          {(() => {
            const uncat = filtered.filter((a) => !a.category);
            if (uncat.length === 0) return null;
            return (
              <div>
                <div className="cos-divider">
                  <span>❓</span>
                  Uncategorized
                  <span style={{ color: "var(--fg-5)", fontFamily: "var(--font-geist-mono)", fontSize: 9.5 }}>
                    ({uncat.length})
                  </span>
                </div>
                <AccountTable
                  accounts={uncat}
                  ecoConfig={ecoConfig}
                  catConfig={catConfig}
                  onEdit={openEdit}
                  onDelete={(id) => setDeleteConfirm(id)}
                  onToggle={toggleActive}
                />
              </div>
            );
          })()}
        </div>
      ) : (
        <AccountTable
          accounts={filtered}
          ecoConfig={ecoConfig}
          catConfig={catConfig}
          onEdit={openEdit}
          onDelete={(id) => setDeleteConfirm(id)}
          onToggle={toggleActive}
        />
      )}

      {accounts.length === 0 && (
        <div className="cos-card" style={{ padding: "48px 20px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--signal-dim)", color: "var(--signal)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Users style={{ width: 22, height: 22 }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>No accounts yet</p>
          <p style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 16 }}>Add X accounts to start tracking ecosystems</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => setShowBulkPresets(true)} className="cos-btn-ghost">Load presets</button>
            <button onClick={openAdd} className="cos-btn-primary">Add manually</button>
          </div>
        </div>
      )}

      {/* Add / Edit dialog */}
      {showDialog && (
        <Dialog title={editAccount ? `Edit @${editAccount.username}` : "Add Account"} onClose={closeDialog}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Username *">
                <input
                  type="text"
                  value={form.username ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.replace(/^@/, "") }))}
                  placeholder="e.g. Ronin_Network"
                  className="cos-input"
                  disabled={!!editAccount}
                />
              </Field>
              <Field label="Display Name">
                <input
                  type="text"
                  value={form.display_name ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                  placeholder="e.g. Ronin Network"
                  className="cos-input"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ecosystem">
                <select
                  value={form.ecosystem ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, ecosystem: (e.target.value || undefined) as Ecosystem | undefined }))}
                  className="cos-input"
                >
                  <option value="">Select ecosystem...</option>
                  {ECOSYSTEMS.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Category">
                <select
                  value={form.category ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, category: (e.target.value || undefined) as AccountCategory | undefined }))}
                  className="cos-input"
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Priority (1–10)">
                <input
                  type="number"
                  min={1} max={10}
                  value={form.priority ?? 5}
                  onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value) }))}
                  className="cos-input"
                />
              </Field>
              <Field label="Follower Count">
                <input
                  type="number"
                  value={form.follower_count ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, follower_count: e.target.value ? parseInt(e.target.value) : undefined }))}
                  placeholder="optional"
                  className="cos-input"
                />
              </Field>
            </div>
            <Field label="Notes">
              <textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Why are you tracking this account?"
                rows={2}
                className="cos-input resize-none"
              />
            </Field>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.active ?? true}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                style={{ width: 14, height: 14 }}
              />
              <span style={{ fontSize: 12.5, color: "var(--fg-2)" }}>Active — include in scraping pipeline</span>
            </label>
            {error && (
              <div style={{ fontSize: 12, color: "var(--rose)", background: "var(--rose-dim)", padding: "8px 12px", borderRadius: 6 }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
              <button type="button" onClick={closeDialog} className="cos-btn-ghost">Cancel</button>
              <button type="submit" disabled={loading} className="cos-btn-primary">
                {loading ? "Saving..." : editAccount ? "Save Changes" : "Add Account"}
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <Dialog title="Delete Account" onClose={() => setDeleteConfirm(null)}>
          <p style={{ fontSize: 12.5, color: "var(--fg-3)", marginBottom: 20, lineHeight: 1.5 }}>
            This will permanently remove the account and stop tracking it. This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setDeleteConfirm(null)} className="cos-btn-ghost">Cancel</button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              disabled={loading}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 5, border: "1px solid rgba(244,63,94,.25)", background: "var(--rose-dim)", color: "var(--rose)", fontSize: 11, fontFamily: "var(--font-geist-mono)", cursor: "pointer", opacity: loading ? 0.5 : 1 }}
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Dialog>
      )}

      {/* Bulk presets dialog */}
      {showBulkPresets && (
        <Dialog title="Add Preset Accounts" onClose={() => setShowBulkPresets(false)}>
          <p style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 12 }}>
            Select accounts to add. Already tracked accounts are grayed out.
          </p>
          <div style={{ maxHeight: 320, overflowY: "auto", marginBottom: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            {PRESET_ACCOUNTS.map((preset) => {
              const alreadyAdded = accounts.some(
                (a) => a.username.toLowerCase() === preset.username.toLowerCase()
              );
              const selected = selectedPresets.has(preset.username);
              return (
                <label
                  key={preset.username}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: `1px solid ${selected && !alreadyAdded ? "rgba(74,222,128,.25)" : "var(--hairline)"}`,
                    background: selected && !alreadyAdded ? "var(--signal-dim)" : "var(--surface-2)",
                    opacity: alreadyAdded ? 0.45 : 1,
                    cursor: alreadyAdded ? "not-allowed" : "pointer",
                    transition: "background 0.1s, border-color 0.1s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={alreadyAdded}
                    onChange={(e) => {
                      setSelectedPresets((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(preset.username);
                        else next.delete(preset.username);
                        return next;
                      });
                    }}
                    style={{ width: 13, height: 13, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--fg)" }}>@{preset.username}</span>
                      {alreadyAdded && <span className="cos-chip" style={{ fontSize: 9.5 }}>added</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", fontFamily: "var(--font-geist-mono)", fontSize: 10, color: "var(--fg-4)" }}>
                      <span>{preset.display_name}</span>
                      <span>·</span>
                      <span className={`cos-eco ${preset.ecosystem}`}>{preset.ecosystem}</span>
                      <span>·</span>
                      <span>{preset.category.replace("_", " ")}</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={() => {
                const available = new Set(
                  PRESET_ACCOUNTS.filter(
                    (p) => !accounts.some((a) => a.username.toLowerCase() === p.username.toLowerCase())
                  ).map((p) => p.username)
                );
                setSelectedPresets(available);
              }}
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--signal)", background: "none", border: "none", cursor: "pointer" }}
            >
              Select all available
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowBulkPresets(false)} className="cos-btn-ghost">Cancel</button>
              <button
                onClick={addPresets}
                disabled={loading || selectedPresets.size === 0}
                className="cos-btn-primary"
              >
                {loading ? "Adding..." : `Add ${selectedPresets.size} accounts`}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function AccountTable({
  accounts, ecoConfig, catConfig, onEdit, onDelete, onToggle,
}: {
  accounts: Account[];
  ecoConfig: Record<string, { label: string }>;
  catConfig: Record<string, { label: string; icon: string }>;
  onEdit: (a: Account) => void;
  onDelete: (id: string) => void;
  onToggle: (a: Account) => void;
}) {
  if (accounts.length === 0) {
    return (
      <div className="cos-card" style={{ padding: "24px 16px", textAlign: "center", fontFamily: "var(--font-geist-mono)", fontSize: 11.5, color: "var(--fg-4)" }}>
        No accounts match your filters
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {accounts.map((account) => (
          <div key={account.id} className="cos-card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div className="cos-user-cell">
                <div className={`cos-avatar ${account.ecosystem ?? "other"}`}>
                  {account.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="cos-user-handle">@{account.username}</div>
                  {account.display_name && <div className="cos-user-name">{account.display_name}</div>}
                </div>
              </div>
              <div className="cos-row-actions" style={{ opacity: 0.7 }}>
                <button className="cos-row-action" onClick={() => onEdit(account)}>
                  <Edit2 style={{ width: 13, height: 13 }} />
                </button>
                <button className="cos-row-action" onClick={() => onDelete(account.id)}>
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
              {account.ecosystem && (
                <span className={`cos-eco ${account.ecosystem}`}>{ecoConfig[account.ecosystem]?.label}</span>
              )}
              {account.category && (
                <span className={`cos-chip ${CATEGORY_CHIP[account.category] ?? ""}`}>{catConfig[account.category]?.label}</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--hairline)" }}>
              <div className="cos-priority-bar">
                <div className="cos-priority-track">
                  <div className="cos-priority-fill" style={{ width: `${account.priority * 10}%`, background: priorityColor(account.priority) }} />
                </div>
                <span className="cos-priority-val">{account.priority}/10</span>
              </div>
              <button
                onClick={() => onToggle(account)}
                style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-geist-mono)", fontSize: 11, background: "none", border: "none", cursor: "pointer" }}
              >
                {account.active ? (
                  <><CheckCircle2 style={{ width: 13, height: 13, color: "var(--signal)" }} /><span style={{ color: "var(--signal)" }}>Active</span></>
                ) : (
                  <><XCircle style={{ width: 13, height: 13, color: "var(--fg-4)" }} /><span style={{ color: "var(--fg-4)" }}>Inactive</span></>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block cos-card">
        <table className="cos-list-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Ecosystem</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>
                  <div className="cos-user-cell">
                    <div className={`cos-avatar ${account.ecosystem ?? "other"}`}>
                      {account.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="cos-user-handle">@{account.username}</span>
                        <a
                          href={`https://x.com/${account.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--fg-5)", transition: "color 0.1s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg-3)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-5)")}
                        >
                          <ExternalLink style={{ width: 11, height: 11 }} />
                        </a>
                      </div>
                      {account.display_name && <div className="cos-user-name">{account.display_name}</div>}
                    </div>
                  </div>
                </td>
                <td>
                  {account.ecosystem ? (
                    <span className={`cos-eco ${account.ecosystem}`}>{ecoConfig[account.ecosystem]?.label}</span>
                  ) : (
                    <span style={{ color: "var(--fg-5)" }}>—</span>
                  )}
                </td>
                <td>
                  {account.category ? (
                    <span className={`cos-chip ${CATEGORY_CHIP[account.category] ?? ""}`}>{catConfig[account.category]?.label}</span>
                  ) : (
                    <span style={{ color: "var(--fg-5)" }}>—</span>
                  )}
                </td>
                <td>
                  <div className="cos-priority-bar">
                    <div className="cos-priority-track">
                      <div className="cos-priority-fill" style={{ width: `${account.priority * 10}%`, background: priorityColor(account.priority) }} />
                    </div>
                    <span className="cos-priority-val">{account.priority}</span>
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => onToggle(account)}
                    style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-geist-mono)", fontSize: 11, background: "none", border: "none", cursor: "pointer" }}
                  >
                    {account.active ? (
                      <><CheckCircle2 style={{ width: 13, height: 13, color: "var(--signal)" }} /><span style={{ color: "var(--signal)" }}>Active</span></>
                    ) : (
                      <><XCircle style={{ width: 13, height: 13, color: "var(--fg-4)" }} /><span style={{ color: "var(--fg-4)" }}>Inactive</span></>
                    )}
                  </button>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div className="cos-row-actions" style={{ justifyContent: "flex-end" }}>
                    <button className="cos-row-action" onClick={() => onEdit(account)}>
                      <Edit2 style={{ width: 13, height: 13 }} />
                    </button>
                    <button className="cos-row-action" onClick={() => onDelete(account.id)}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--hairline-2)",
          borderRadius: 10,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 48px rgba(0,0,0,.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--hairline)", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{title}</span>
          <button className="cos-row-action" onClick={onClose}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div style={{ padding: "20px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--fg-4)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectFilter({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          paddingLeft: 10, paddingRight: 26, paddingTop: 6, paddingBottom: 6,
          background: "var(--surface-2)",
          border: "1px solid var(--hairline)",
          borderRadius: 6,
          fontFamily: "var(--font-geist-mono)",
          fontSize: 11,
          color: "var(--fg-3)",
          outline: "none",
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, color: "var(--fg-4)", pointerEvents: "none" }} />
    </div>
  );
}
